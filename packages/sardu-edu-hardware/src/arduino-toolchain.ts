export interface ArduinoToolchainLayout {
  readonly executable: string
  readonly configuration: string
  readonly dataDirectory: string
  readonly downloadsDirectory: string
  readonly librariesDirectory: string
}

export interface ArduinoCliRequest {
  readonly action: 'compile' | 'upload'
  readonly boardId: string
  readonly sketchPath: string
  readonly port?: string
  readonly nanoProcessor?: 'auto' | 'new' | 'old'
  readonly r4ResourcePaths?: {
    readonly compiler: string
    readonly core: string
    readonly platform: string
    readonly variant: string
  }
}

export interface ArduinoCliInvocation {
  readonly executable: string
  readonly args: readonly string[]
}

export interface ArduinoCliInvocationOptions {
  readonly layout?: ArduinoToolchainLayout
}

export const ARDUINO_PORT_DISCOVERY_TIMEOUTS = [100, 250, 500, 1000] as const
export const DEFAULT_ARDUINO_PORT_DISCOVERY_TIMEOUT = 250

export const SARDU_BLOCK_ARDUINO_TOOLCHAIN_LAYOUT: ArduinoToolchainLayout = {
  executable: 'resources/toolchains/arduino/arduino-cli.exe',
  configuration: 'resources/toolchains/arduino/arduino-cli.yaml',
  dataDirectory: 'resources/toolchains/arduino/data',
  downloadsDirectory: 'resources/toolchains/arduino/downloads',
  librariesDirectory: 'resources/toolchains/arduino/user/libraries',
}

const boardFqbn: Readonly<Record<string, string>> = {
  'arduino-uno': 'arduino:avr:uno',
  'arduino-nano': 'arduino:avr:nano',
  'arduino-uno-r4-wifi': 'arduino:renesas_uno:unor4wifi',
  'esp32-dev-module': 'esp32:esp32:esp32',
  'esp32-s2-dev-module': 'esp32:esp32:esp32s2',
  'esp32-s3-dev-module': 'esp32:esp32:esp32s3',
  'esp32-c3-dev-module': 'esp32:esp32:esp32c3',
  'esp32-cam-ai-thinker': 'esp32:esp32:esp32cam',
}

const getBoardFqbn = (boardId: string, nanoProcessor: ArduinoCliRequest['nanoProcessor']): string | undefined => {
  if (boardId !== 'arduino-nano') return boardFqbn[boardId]
  return nanoProcessor === 'old' ? 'arduino:avr:nano:cpu=atmega328old' : 'arduino:avr:nano:cpu=atmega328'
}

export const createArduinoCliInvocation = (
  { action, boardId, nanoProcessor, port, r4ResourcePaths, sketchPath }: ArduinoCliRequest,
  { layout = SARDU_BLOCK_ARDUINO_TOOLCHAIN_LAYOUT }: ArduinoCliInvocationOptions = {},
): ArduinoCliInvocation => {
  const fqbn = getBoardFqbn(boardId, nanoProcessor)
  if (!fqbn) throw new Error(`No Arduino CLI target is defined for board: ${boardId}`)
  if (action === 'upload' && !port) throw new Error('Arduino upload requires a serial port')

  const args = ['--config-file', layout.configuration, 'compile', '--fqbn', fqbn]
  if (boardId === 'arduino-uno-r4-wifi' && r4ResourcePaths) {
    args.push(
      '--build-property', `build.compiler_path=${r4ResourcePaths.compiler}`,
      '--build-property', `runtime.platform.path=${r4ResourcePaths.platform}`,
      '--build-property', `build.core.path=${r4ResourcePaths.core}`,
      '--build-property', `build.variant.path=${r4ResourcePaths.variant}`,
    )
  }
  if (action === 'upload') args.push('--upload', '--port', port as string)
  args.push(sketchPath)

  return {
    executable: layout.executable,
    args,
  }
}

/** Historical export retained for consumers compiled against SARDU Edu. */
export const SARDU_ARDUINO_TOOLCHAIN_LAYOUT = SARDU_BLOCK_ARDUINO_TOOLCHAIN_LAYOUT
