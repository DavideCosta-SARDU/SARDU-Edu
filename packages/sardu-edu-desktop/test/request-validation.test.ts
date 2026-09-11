import { describe, expect, test } from 'vitest'
import {
  validateCompileRequest,
  validateLiveDiagnostic,
  validatePort,
  validateUploadRequest,
} from '../src/request-validation'

describe('desktop hardware request validation', () => {
  test('accepts supported boards and serial ports', () => {
    expect(
      validateUploadRequest({
        boardId: 'arduino-uno',
        port: 'com4',
        source: 'void setup() {}',
      }),
    ).toEqual({
      boardId: 'arduino-uno',
      port: 'COM4',
      source: 'void setup() {}',
    })
    expect(validatePort('/dev/ttyACM0')).toBe('/dev/ttyACM0')
  })

  test('rejects unsupported boards, empty source, and unsafe ports', () => {
    expect(() => validateCompileRequest({ boardId: '../../bad', source: 'code' })).toThrow(
      'Invalid Arduino board identifier: ../../bad',
    )
    expect(() => validateCompileRequest({ boardId: 'arduino-uno', source: '' })).toThrow(
      'Arduino source must contain',
    )
    expect(() => validatePort('COM4 & erase')).toThrow('Invalid serial port')
  })

  test('validates bounded Live diagnostics before writing them to disk', () => {
    expect(validateLiveDiagnostic({ stage: 'handshake-timeout', port: 'com4', detail: 'No response' })).toEqual({
      stage: 'handshake-timeout',
      port: 'COM4',
      detail: 'No response',
    })
    expect(() => validateLiveDiagnostic({ stage: '../invalid' })).toThrow('Invalid Live diagnostic stage')
  })
})
