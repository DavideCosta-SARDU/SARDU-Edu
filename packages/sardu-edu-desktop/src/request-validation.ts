import type { ArduinoCompileRequest, ArduinoUploadRequest, LiveDiagnostic } from './contracts'

const MAX_SOURCE_LENGTH = 2_000_000
const BOARD_ID = /^[a-z0-9][a-z0-9-]{0,63}$/
const SERIAL_PORT = /^[A-Za-z0-9._:/\\-]+$/
const LIVE_DIAGNOSTIC_STAGE = /^[a-z][a-z0-9-]{0,63}$/

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const validateCompileRequest = (value: unknown): ArduinoCompileRequest => {
  if (!isRecord(value)) throw new Error('Arduino compile request must be an object')
  if (typeof value.boardId !== 'string' || !BOARD_ID.test(value.boardId)) {
    throw new Error(`Invalid Arduino board identifier: ${String(value.boardId)}`)
  }
  if (typeof value.source !== 'string' || value.source.length === 0 || value.source.length > MAX_SOURCE_LENGTH) {
    throw new Error('Arduino source must contain between 1 and 2000000 characters')
  }
  return { boardId: value.boardId, source: value.source }
}

export const validatePort = (value: unknown): string => {
  if (typeof value !== 'string' || value.length > 260 || !SERIAL_PORT.test(value)) {
    throw new Error(`Invalid serial port: ${String(value)}`)
  }
  return /^COM\d+$/i.test(value) ? value.toUpperCase() : value
}

export const validateUploadRequest = (value: unknown): ArduinoUploadRequest => ({
  ...validateCompileRequest(value),
  port: validatePort(isRecord(value) ? value.port : null),
})

export const validateLiveDiagnostic = (value: unknown): LiveDiagnostic => {
  if (!isRecord(value) || typeof value.stage !== 'string' || !LIVE_DIAGNOSTIC_STAGE.test(value.stage)) {
    throw new Error('Invalid Live diagnostic stage')
  }
  if (value.detail !== undefined && (typeof value.detail !== 'string' || value.detail.length > 500)) {
    throw new Error('Invalid Live diagnostic detail')
  }
  return {
    stage: value.stage,
    ...(value.port === undefined ? {} : { port: validatePort(value.port) }),
    ...(value.detail === undefined ? {} : { detail: value.detail }),
  }
}
