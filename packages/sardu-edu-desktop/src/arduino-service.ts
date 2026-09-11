import { execFile, spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { access, appendFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { createArduinoCliInvocation, parseHardwareResourceManifest } from '@sardu-edu/hardware'
import type { ArduinoToolchainLayout, HardwareResourceManifest } from '@sardu-edu/hardware'
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

export const createBoardListArguments = (configuration: string): readonly string[] => [
  '--config-file',
  configuration,
  'board',
  'list',
  '--json',
]

export class ArduinoService {
  readonly layout: ArduinoToolchainLayout
  readonly userDataRoot: string
  readonly portDiagnosticsPath: string
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
      process.env.SARDU_LOG_DIR || path.join(userDataRoot, 'logs'),
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

  async listPorts(): Promise<readonly ArduinoPort[]> {
    try {
      const output = await this.run(createBoardListArguments(this.layout.configuration))
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
      const invocation = createArduinoCliInvocation(
        {
          action,
          boardId: request.boardId,
          port: action === 'upload' ? (request as ArduinoUploadRequest).port : undefined,
          sketchPath: sketchRoot,
        },
        { layout: this.layout },
      )
      return { output: await this.runSketchCommand(invocation.args, action, onOutput) }
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
      throw new Error('SARDU Edu Arduino resources are incomplete; run the hardware resources batch')
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
      throw new Error('SARDU Edu Arduino resources are incomplete; run the hardware resources batch')
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
