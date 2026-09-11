import type { ArduinoPort } from './contracts'

interface ArduinoCliPort {
  readonly address?: unknown
  readonly label?: unknown
  readonly protocol?: unknown
  readonly protocol_label?: unknown
  readonly properties?: unknown
}

interface ArduinoCliDetectedPort extends ArduinoCliPort {
  readonly port?: ArduinoCliPort
  readonly matching_boards?: unknown
}

interface ArduinoCliBoardList {
  readonly detected_ports?: readonly ArduinoCliDetectedPort[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const parseBoardList = (output: string): ArduinoCliBoardList => JSON.parse(output) as ArduinoCliBoardList

const getMatchingBoards = (detectedPort: ArduinoCliDetectedPort): readonly Record<string, unknown>[] =>
  Array.isArray(detectedPort.matching_boards) ? detectedPort.matching_boards.filter(isRecord) : []

export const parseArduinoPorts = (output: string): readonly ArduinoPort[] => {
  const parsed = parseBoardList(output)
  if (!Array.isArray(parsed.detected_ports)) return []

  return parsed.detected_ports.flatMap((detectedPort) => {
    const port = detectedPort.port || detectedPort
    if (typeof port.address !== 'string') return []
    return [
      {
        address: port.address,
        label: typeof port.label === 'string' ? port.label : port.address,
        matchingBoardFqbns: getMatchingBoards(detectedPort)
          .map((board) => board.fqbn)
          .filter((fqbn): fqbn is string => typeof fqbn === 'string'),
        protocol: typeof port.protocol === 'string' ? port.protocol : 'serial',
      },
    ]
  })
}

export const describeArduinoPorts = (output: string): readonly string[] => {
  const parsed = parseBoardList(output)
  if (!Array.isArray(parsed.detected_ports)) return []

  return parsed.detected_ports.flatMap((detectedPort) => {
    const port = detectedPort.port || detectedPort
    if (typeof port.address !== 'string') return []
    const properties = isRecord(port.properties) ? port.properties : {}
    const vid = typeof properties.vid === 'string' ? properties.vid : 'n/d'
    const pid = typeof properties.pid === 'string' ? properties.pid : 'n/d'
    const protocol = typeof port.protocol === 'string' ? port.protocol : 'n/d'
    const protocolLabel = typeof port.protocol_label === 'string' ? port.protocol_label : 'n/d'
    const matchingBoards = getMatchingBoards(detectedPort)
      .map((board) => {
        const name = typeof board.name === 'string' ? board.name : 'scheda senza nome'
        const fqbn = typeof board.fqbn === 'string' ? board.fqbn : 'FQBN non disponibile'
        return `${name} [${fqbn}]`
      })
      .join(', ')
    return [
      `${port.address}: protocol=${protocol}, protocolLabel=${protocolLabel}, VID=${vid}, PID=${pid}, ` +
        `matches=${matchingBoards || 'nessuna scheda riconosciuta'}`,
    ]
  })
}
