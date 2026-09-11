import { describe, expect, test } from 'vitest'
import { SARDU_ARDUINO_TOOLCHAIN_LAYOUT, createArduinoCliInvocation } from '../src/arduino-toolchain'

describe('Arduino CLI resource layout', () => {
  test('keeps the toolchain isolated in SARDU Edu resources', () => {
    expect(SARDU_ARDUINO_TOOLCHAIN_LAYOUT.executable).toBe('resources/toolchains/arduino/arduino-cli.exe')
    expect(SARDU_ARDUINO_TOOLCHAIN_LAYOUT.librariesDirectory).toBe('resources/toolchains/arduino/user/libraries')
  })

  test('builds an Uno compile invocation without executing it', () => {
    expect(
      createArduinoCliInvocation({
        action: 'compile',
        boardId: 'arduino-uno',
        sketchPath: 'work/Blink',
      }),
    ).toEqual({
      executable: 'resources/toolchains/arduino/arduino-cli.exe',
      args: [
        '--config-file',
        'resources/toolchains/arduino/arduino-cli.yaml',
        'compile',
        '--fqbn',
        'arduino:avr:uno',
        'work/Blink',
      ],
    })
  })

  test('builds a Nano upload invocation with an explicit port', () => {
    const invocation = createArduinoCliInvocation({
      action: 'upload',
      boardId: 'arduino-nano',
      port: 'COM4',
      sketchPath: 'work/Blink',
    })

    expect(invocation.args).toContain('arduino:avr:nano')
    expect(invocation.args).toContain('--upload')
    expect(invocation.args).toContain('COM4')
  })

  test('rejects upload without a serial port', () => {
    expect(() =>
      createArduinoCliInvocation({
        action: 'upload',
        boardId: 'arduino-uno',
        sketchPath: 'work/Blink',
      }),
    ).toThrow('Arduino upload requires a serial port')
  })

  test('accepts resolved desktop resource paths', () => {
    const invocation = createArduinoCliInvocation(
      {
        action: 'compile',
        boardId: 'arduino-uno',
        sketchPath: 'C:/work/Blink',
      },
      {
        layout: {
          executable: 'C:/SARDU/resources/arduino-cli.exe',
          configuration: 'C:/SARDU/resources/arduino-cli.yaml',
          dataDirectory: 'C:/SARDU/resources/data',
          downloadsDirectory: 'C:/SARDU/cache',
          librariesDirectory: 'C:/SARDU/resources/user/libraries',
        },
      },
    )

    expect(invocation.executable).toBe('C:/SARDU/resources/arduino-cli.exe')
    expect(invocation.args).toContain('C:/SARDU/resources/arduino-cli.yaml')
  })
})
