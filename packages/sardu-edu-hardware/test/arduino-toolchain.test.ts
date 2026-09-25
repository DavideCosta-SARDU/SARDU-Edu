import { describe, expect, test } from 'vitest'
import { SARDU_ARDUINO_TOOLCHAIN_LAYOUT, createArduinoCliInvocation } from '../src/arduino-toolchain'

describe('Arduino CLI resource layout', () => {
  test('keeps the toolchain isolated in SARDU-Block resources', () => {
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

    expect(invocation.args).toContain('arduino:avr:nano:cpu=atmega328')
    expect(invocation.args).toContain('--upload')
    expect(invocation.args).toContain('COM4')
  })

  test('builds the explicit old-bootloader Nano target', () => {
    const invocation = createArduinoCliInvocation({
      action: 'upload', boardId: 'arduino-nano', nanoProcessor: 'old', port: 'COM4', sketchPath: 'work/Blink',
    })
    expect(invocation.args).toContain('arduino:avr:nano:cpu=atmega328old')
  })

  test.each([
    ['arduino-uno-r4-wifi', 'arduino:renesas_uno:unor4wifi'],
    ['esp32-dev-module', 'esp32:esp32:esp32'],
    ['esp32-s2-dev-module', 'esp32:esp32:esp32s2'],
    ['esp32-s3-dev-module', 'esp32:esp32:esp32s3'],
    ['esp32-c3-dev-module', 'esp32:esp32:esp32c3'],
    ['esp32-cam-ai-thinker', 'esp32:esp32:esp32cam'],
  ])('builds the %s compile target', (boardId, fqbn) => {
    const invocation = createArduinoCliInvocation({action: 'compile', boardId, sketchPath: 'work/Rfid'})
    expect(invocation.args).toContain(fqbn)
  })

  test('uses all short cached paths only for UNO R4', () => {
    const paths = {
      compiler: 'R4/compiler/bin/',
      core: 'R4/platform/cores/arduino',
      platform: 'R4/platform',
      variant: 'R4/platform/variants/UNOWIFIR4',
    }
    const r4 = createArduinoCliInvocation({
      action: 'compile', boardId: 'arduino-uno-r4-wifi', r4ResourcePaths: paths, sketchPath: 'work/R4',
    })
    expect(r4.args).toContain('build.compiler_path=R4/compiler/bin/')
    expect(r4.args).toContain('runtime.platform.path=R4/platform')
    expect(r4.args).toContain('build.core.path=R4/platform/cores/arduino')
    expect(r4.args).toContain('build.variant.path=R4/platform/variants/UNOWIFIR4')

    const uno = createArduinoCliInvocation({
      action: 'compile', boardId: 'arduino-uno', r4ResourcePaths: paths, sketchPath: 'work/Uno',
    })
    expect(uno.args).not.toContain('--build-property')
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
