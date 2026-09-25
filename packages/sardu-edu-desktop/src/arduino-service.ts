import { execFile, spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { access, appendFile, cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  DEFAULT_ARDUINO_PORT_DISCOVERY_TIMEOUT,
  createArduinoCliInvocation,
  parseHardwareResourceManifest,
} from '@sardu-block/hardware'
import type { ArduinoToolchainLayout, HardwareResourceManifest } from '@sardu-block/hardware'
import { describeArduinoPorts, parseArduinoPorts } from './arduino-ports'
import type {
  ArduinoCompileRequest,
  ArduinoPort,
  ArduinoUploadRequest,
  HardwareOperationResult,
  HardwareOutputEvent,
  HardwareStatus,
} from './contracts'

type HardwareOutputListener = (event: HardwareOutputEvent) => void

const execFileAsync = promisify(execFile)
const R4_COMPILER_VERSION = '7-2017q4'
const R4_PLATFORM_VERSION = '1.6.0'
const R4_CACHE_MARKER = 'sardu-block-r4-cache-v1.json'
const R4_CACHE_CONTENTS = JSON.stringify({
  compiler: R4_COMPILER_VERSION,
  platform: R4_PLATFORM_VERSION,
})

export const createBoardListArguments = (
  configuration: string,
  discoveryTimeoutMs = DEFAULT_ARDUINO_PORT_DISCOVERY_TIMEOUT,
): readonly string[] => [
  '--config-file',
  configuration,
  'board',
  'list',
  '--discovery-timeout',
  `${discoveryTimeoutMs}ms`,
  '--json',
]

export class ArduinoService {
  readonly layout: ArduinoToolchainLayout
  readonly userDataRoot: string
  readonly portDiagnosticsPath: string
  private r4PreparationPromise: Promise<void> | null = null
  private lastPortError: string | null = null
  private lastPortSummary: string | null = null

  constructor(resourceRoot: string, userDataRoot: string) {
    const toolchainRoot = path.join(resourceRoot, 'toolchains', 'arduino')
    this.layout = {
      executable: path.join(toolchainRoot, 'arduino-cli.exe'),
      configuration: path.join(toolchainRoot, 'arduino-cli.yaml'),
      dataDirectory: path.join(toolchainRoot, 'data'),
      downloadsDirectory: path.join(userDataRoot, 'arduino', 'downloads'),
      librariesDirectory: path.join(toolchainRoot, 'user', 'libraries'),
    }
    this.userDataRoot = userDataRoot
    this.portDiagnosticsPath = path.join(
      process.env.SARDU_BLOCK_LOG_DIR || process.env.SARDU_EDU_LOG_DIR || process.env.SARDU_LOG_DIR ||
        path.join(userDataRoot, 'logs'),
      'hardware-porte.txt',
    )
  }

  async getStatus(): Promise<HardwareStatus> {
    const arduinoCliAvailable = await this.exists(this.layout.executable)
    const manifest = await this.readManifest()
    const platforms = manifest?.platforms || []
    const installedPlatforms = await Promise.all(
      platforms.map((platform) => {
        const [provider, architecture] = platform.id.split(':')
        if (!provider || !architecture) return Promise.resolve(false)
        return this.exists(
          path.join(this.layout.dataDirectory, 'packages', provider, 'hardware', architecture, platform.version),
        )
      }),
    )
    const arduinoCoreAvailable = platforms.length > 0 && installedPlatforms.every(Boolean)
    return { arduinoCliAvailable, arduinoCoreAvailable }
  }

  async listPorts(
    discoveryTimeoutMs = DEFAULT_ARDUINO_PORT_DISCOVERY_TIMEOUT,
  ): Promise<readonly ArduinoPort[]> {
    try {
      const output = await this.run(createBoardListArguments(this.layout.configuration, discoveryTimeoutMs))
      const ports = parseArduinoPorts(output)
      const summary = describeArduinoPorts(output).join('; ') || 'nessuna porta rilevata'
      if (summary !== this.lastPortSummary) {
        await this.writePortDiagnostic('INFO', `ArduinoService.listPorts: ${summary}`)
      }
      this.lastPortSummary = summary
      this.lastPortError = null
      return ports
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message !== this.lastPortError) {
        await this.writePortDiagnostic(
          'ERROR',
          `ArduinoService.listPorts failed: executable=${this.layout.executable}, ` +
            `configuration=${this.layout.configuration}, error=${message}`,
        )
      }
      this.lastPortError = message
      throw error
    }
  }

  async compile(request: ArduinoCompileRequest, onOutput?: HardwareOutputListener): Promise<HardwareOperationResult> {
    return this.runSketch('compile', request, onOutput)
  }

  async upload(request: ArduinoUploadRequest, onOutput?: HardwareOutputListener): Promise<HardwareOperationResult> {
    return this.runSketch('upload', request, onOutput)
  }

  async areR4ResourcesReady(): Promise<boolean> {
    return process.platform !== 'win32' || this.isValidR4Cache(this.getR4CacheRoot())
  }

  async prepareR4Resources(): Promise<void> {
    if (process.platform !== 'win32' || await this.areR4ResourcesReady()) return
    this.r4PreparationPromise ??= this.createR4Cache().finally(() => {
      this.r4PreparationPromise = null
    })
    await this.r4PreparationPromise
  }

  private async runSketch(
    action: 'compile' | 'upload',
    request: ArduinoCompileRequest | ArduinoUploadRequest,
    onOutput?: HardwareOutputListener,
  ): Promise<HardwareOperationResult> {
    const sketchRoot = path.join(this.userDataRoot, 'arduino', 'work', randomUUID(), 'SarduSketch')
    const sketchPath = path.join(sketchRoot, 'SarduSketch.ino')
    await mkdir(sketchRoot, { recursive: true })
    await writeFile(sketchPath, request.source, 'utf8')

    try {
      const r4ResourcePaths = request.boardId === 'arduino-uno-r4-wifi' ?
        await this.getR4ResourcePaths() : undefined
      const invocation = createArduinoCliInvocation(
        {
          action,
          boardId: request.boardId,
          nanoProcessor: request.nanoProcessor,
          port: action === 'upload' ? (request as ArduinoUploadRequest).port : undefined,
          r4ResourcePaths,
          sketchPath: sketchRoot,
        },
        { layout: this.layout },
      )
      try {
        return { output: await this.runSketchCommand(invocation.args, action, onOutput) }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const automaticNanoUpload = action === 'upload' && request.boardId === 'arduino-nano' &&
          (request.nanoProcessor === undefined || request.nanoProcessor === 'auto')
        if (!automaticNanoUpload || !/avrdude|stk500|programmer is not responding|not in sync/i.test(message)) throw error
        onOutput?.({
          action,
          stream: 'stderr',
          text: '\nSARDU-Block: nuovo bootloader non rilevato; provo il vecchio bootloader Nano.\n',
        })
        const fallback = createArduinoCliInvocation({
          action,
          boardId: request.boardId,
          nanoProcessor: 'old',
          port: (request as ArduinoUploadRequest).port,
          sketchPath: sketchRoot,
        }, { layout: this.layout })
        return { output: await this.runSketchCommand(fallback.args, action, onOutput) }
      }
    } finally {
      await rm(path.dirname(sketchRoot), { recursive: true, force: true })
    }
  }

  private async runSketchCommand(
    args: readonly string[],
    action: 'compile' | 'upload',
    onOutput?: HardwareOutputListener,
  ): Promise<string> {
    const status = await this.getStatus()
    if (!status.arduinoCliAvailable || !status.arduinoCoreAvailable) {
      throw new Error('SARDU-Block Arduino resources are incomplete; run the hardware resources batch')
    }
    await mkdir(this.layout.downloadsDirectory, { recursive: true })
    const userDirectory = path.dirname(this.layout.librariesDirectory)

    return new Promise((resolve, reject) => {
      let output = ''
      let settled = false
      const child = spawn(this.layout.executable, [...args], {
        env: {
          ...process.env,
          ARDUINO_DIRECTORIES_DATA: this.layout.dataDirectory,
          ARDUINO_DIRECTORIES_DOWNLOADS: this.layout.downloadsDirectory,
          ARDUINO_DIRECTORIES_USER: userDirectory,
        },
        windowsHide: true,
      })
      const append = (stream: 'stdout' | 'stderr', data: Buffer): void => {
        const text = data.toString()
        output += text
        onOutput?.({ action, stream, text })
      }
      child.stdout.on('data', (data: Buffer) => append('stdout', data))
      child.stderr.on('data', (data: Buffer) => append('stderr', data))
      child.once('error', (error) => {
        settled = true
        reject(error)
      })
      child.once('close', (code) => {
        if (settled) return
        if (code === 0) resolve(output)
        else reject(new Error(output.trim() || `Arduino CLI ${action} failed with exit code ${code}`))
      })
    })
  }

  private async run(args: readonly string[]): Promise<string> {
    const status = await this.getStatus()
    if (!status.arduinoCliAvailable || !status.arduinoCoreAvailable) {
      throw new Error('SARDU-Block Arduino resources are incomplete; run the hardware resources batch')
    }
    await mkdir(this.layout.downloadsDirectory, { recursive: true })
    const userDirectory = path.dirname(this.layout.librariesDirectory)
    const { stdout, stderr } = await execFileAsync(this.layout.executable, [...args], {
      env: {
        ...process.env,
        ARDUINO_DIRECTORIES_DATA: this.layout.dataDirectory,
        ARDUINO_DIRECTORIES_DOWNLOADS: this.layout.downloadsDirectory,
        ARDUINO_DIRECTORIES_USER: userDirectory,
      },
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true,
    })
    return [stdout, stderr].filter(Boolean).join('\n')
  }

  private async exists(filePath: string): Promise<boolean> {
    try {
      await access(filePath)
      return true
    } catch {
      return false
    }
  }

  private getR4CacheRoot(): string {
    return path.join(tmpdir(), 'SARDU-Edu', 'r4')
  }

  private async getR4ResourcePaths(): Promise<{
    compiler: string
    core: string
    platform: string
    variant: string
  } | undefined> {
    if (process.platform !== 'win32') return undefined
    const cacheRoot = this.getR4CacheRoot()
    if (!await this.isValidR4Cache(cacheRoot)) {
      throw new Error('Arduino UNO R4 WiFi resources are not prepared')
    }
    return {
      compiler: `${path.join(cacheRoot, `arm-none-eabi-gcc-${R4_COMPILER_VERSION}`, 'bin')}${path.sep}`,
      core: path.join(cacheRoot, `renesas_uno-${R4_PLATFORM_VERSION}`, 'cores', 'arduino'),
      platform: path.join(cacheRoot, `renesas_uno-${R4_PLATFORM_VERSION}`),
      variant: path.join(cacheRoot, `renesas_uno-${R4_PLATFORM_VERSION}`, 'variants', 'UNOWIFIR4'),
    }
  }

  private async createR4Cache(): Promise<void> {
    const cacheRoot = this.getR4CacheRoot()
    const cacheParent = path.dirname(cacheRoot)
    const stagingRoot = path.join(cacheParent, `.r4-${randomUUID()}`)
    const compilerSource = path.join(this.layout.dataDirectory, 'packages', 'arduino', 'tools',
      'arm-none-eabi-gcc', R4_COMPILER_VERSION)
    const platformSource = path.join(this.layout.dataDirectory, 'packages', 'arduino', 'hardware',
      'renesas_uno', R4_PLATFORM_VERSION)
    await mkdir(cacheParent, { recursive: true })
    try {
      await cp(compilerSource, path.join(stagingRoot, `arm-none-eabi-gcc-${R4_COMPILER_VERSION}`), {
        recursive: true,
      })
      await cp(platformSource, path.join(stagingRoot, `renesas_uno-${R4_PLATFORM_VERSION}`), { recursive: true })
      await writeFile(path.join(stagingRoot, R4_CACHE_MARKER), R4_CACHE_CONTENTS, 'utf8')
      if (!await this.isValidR4Cache(stagingRoot)) {
        throw new Error('ArduinoService.createR4Cache: copied UNO R4 resources are incomplete')
      }
      await rm(cacheRoot, { recursive: true, force: true })
      await rename(stagingRoot, cacheRoot)
    } finally {
      await rm(stagingRoot, { recursive: true, force: true })
    }
  }

  private async isValidR4Cache(cacheRoot: string): Promise<boolean> {
    try {
      if (await readFile(path.join(cacheRoot, R4_CACHE_MARKER), 'utf8') !== R4_CACHE_CONTENTS) return false
      await Promise.all([
        access(path.join(cacheRoot, `arm-none-eabi-gcc-${R4_COMPILER_VERSION}`, 'bin',
          'arm-none-eabi-g++.exe')),
        access(path.join(cacheRoot, `arm-none-eabi-gcc-${R4_COMPILER_VERSION}`, 'arm-none-eabi', 'include',
          'machine', 'ieeefp.h')),
        access(path.join(cacheRoot, `arm-none-eabi-gcc-${R4_COMPILER_VERSION}`, 'arm-none-eabi', 'include', 'c++',
          '7.2.1', 'arm-none-eabi', 'thumb', 'v7e-m', 'fpv4-sp', 'hard', 'bits', 'c++config.h')),
        access(path.join(cacheRoot, `renesas_uno-${R4_PLATFORM_VERSION}`, 'platform.txt')),
        access(path.join(cacheRoot, `renesas_uno-${R4_PLATFORM_VERSION}`, 'cores', 'arduino', 'Arduino.h')),
        access(path.join(cacheRoot, `renesas_uno-${R4_PLATFORM_VERSION}`, 'variants', 'UNOWIFIR4', 'libs',
          'libfsp.a')),
        access(path.join(cacheRoot, `renesas_uno-${R4_PLATFORM_VERSION}`, 'variants', 'UNOWIFIR4', 'includes',
          'ra', 'fsp', 'src', 'r_usb_basic', 'src', 'driver', 'inc', 'r_usb_basic_define.h')),
      ])
      return true
    } catch {
      return false
    }
  }

  private async writePortDiagnostic(level: 'INFO' | 'ERROR', message: string): Promise<void> {
    const line = `${new Date().toISOString()} [${level}] ${message}`
    if (level === 'ERROR') console.error(line)
    else console.log(line)
    try {
      await mkdir(path.dirname(this.portDiagnosticsPath), { recursive: true })
      await appendFile(this.portDiagnosticsPath, `${line}\n`, 'utf8')
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      console.warn(`ArduinoService.writePortDiagnostic failed: ${detail}`)
    }
  }

  private async readManifest(): Promise<HardwareResourceManifest | null> {
    let contents: string
    try {
      contents = await readFile(path.join(path.dirname(this.layout.configuration), 'manifest.json'), 'utf8')
    } catch {
      return null
    }
    return parseHardwareResourceManifest(JSON.parse(contents))
  }
}
