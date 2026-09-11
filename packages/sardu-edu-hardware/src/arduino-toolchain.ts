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
}

export interface ArduinoCliInvocation {
  readonly executable: string
  readonly args: readonly string[]
}

export interface ArduinoCliInvocationOptions {
  readonly layout?: ArduinoToolchainLayout
}

export const SARDU_ARDUINO_TOOLCHAIN_LAYOUT: ArduinoToolchainLayout = {
  executable: 'resources/toolchains/arduino/arduino-cli.exe',
  configuration: 'resources/toolchains/arduino/arduino-cli.yaml',
  dataDirectory: 'resources/toolchains/arduino/data',
  downloadsDirectory: 'resources/toolchains/arduino/downloads',
  librariesDirectory: 'resources/toolchains/arduino/user/libraries',
}

const boardFqbn: Readonly<Record<string, string>> = {
  'arduino-uno': 'arduino:avr:uno',
  'arduino-nano': 'arduino:avr:nano',
}

export const createArduinoCliInvocation = (
  { action, boardId, port, sketchPath }: ArduinoCliRequest,
  { layout = SARDU_ARDUINO_TOOLCHAIN_LAYOUT }: ArduinoCliInvocationOptions = {},
): ArduinoCliInvocation => {
  const fqbn = boardFqbn[boardId]
  if (!fqbn) throw new Error(`No Arduino CLI target is defined for board: ${boardId}`)
  if (action === 'upload' && !port) throw new Error('Arduino upload requires a serial port')

  const args = ['--config-file', layout.configuration, 'compile', '--fqbn', fqbn]
  if (action === 'upload') args.push('--upload', '--port', port as string)
  args.push(sketchPath)

  return {
    executable: layout.executable,
    args,
  }
}
