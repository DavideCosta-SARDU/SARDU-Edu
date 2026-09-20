import { HardwareCatalog } from './catalog'
import type {
  ArduinoBoardDefinition,
  BackendDefinition,
  BoardBusDefinition,
  BoardPinDefinition,
  ComponentDefinition,
  HardwareDefinitions,
  PinCapability,
  RobotDefinition,
} from './contracts'

export const ARDUINO_BACKEND: BackendDefinition = {
  id: 'arduino-cpp',
  name: 'Arduino C/C++',
  version: '1',
  language: 'Arduino C/C++',
  modes: ['standalone', 'realtime'],
}

const pwmPins = new Set(['3', '5', '6', '9', '10', '11'])

const digitalPin = (id: string): BoardPinDefinition => ({
  id,
  capabilities: ['digital-input', 'digital-output', ...(pwmPins.has(id) ? (['pwm'] as PinCapability[]) : [])],
})

const analogPin = (id: string, supportsDigital = true): BoardPinDefinition => ({
  id,
  capabilities: [
    'analog-input',
    ...(supportsDigital ? (['digital-input', 'digital-output'] as PinCapability[]) : []),
  ],
})

const commonPins = [
  ...['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'].map(digitalPin),
  ...['A0', 'A1', 'A2', 'A3', 'A4', 'A5'].map((id) => analogPin(id)),
]

const commonBuses: readonly BoardBusDefinition[] = [
  { id: 'wire', type: 'i2c', signals: { sda: 'A4', scl: 'A5' } },
  { id: 'spi', type: 'spi', signals: { ss: '10', mosi: '11', miso: '12', sck: '13' } },
  { id: 'serial', type: 'uart', signals: { rx: '0', tx: '1' } },
]

const esp32Pin = (id: string, analog = false): BoardPinDefinition => ({
  id,
  capabilities: [
    'digital-input', 'digital-output', 'pwm',
    ...(analog ? (['analog-input'] as PinCapability[]) : []),
  ],
})

const esp32Pins = (digital: readonly number[], analog: readonly number[]) =>
  digital.map((pin) => esp32Pin(String(pin), analog.includes(pin)))

const esp32InputPin = (id: string): BoardPinDefinition => ({id, capabilities: ['digital-input', 'analog-input']})

const esp32Buses = (
  sda: string, scl: string, ss: string, mosi: string, miso: string, sck: string, rx: string, tx: string,
): readonly BoardBusDefinition[] => [
  { id: 'wire', type: 'i2c', signals: { sda, scl } },
  { id: 'spi', type: 'spi', signals: { ss, mosi, miso, sck } },
  { id: 'serial', type: 'uart', signals: { rx, tx } },
]

const esp32BoardIds = [
  'esp32-dev-module', 'esp32-s2-dev-module', 'esp32-s3-dev-module', 'esp32-c3-dev-module', 'esp32-cam-ai-thinker',
]

export const ARDUINO_BOARDS: readonly ArduinoBoardDefinition[] = [
  {
    id: 'arduino-uno',
    name: 'Arduino Uno',
    version: '1',
    fqbn: 'arduino:avr:uno',
    processor: 'ATmega328P',
    operatingVoltage: 5,
    backendIds: [ARDUINO_BACKEND.id],
    capabilities: ['digital-io', 'analog-input', 'pwm', 'i2c', 'spi', 'uart'],
    pins: commonPins,
    buses: commonBuses,
    modes: ['standalone', 'realtime'],
  },
  {
    id: 'arduino-nano',
    name: 'Arduino Nano',
    version: '1',
    fqbn: 'arduino:avr:nano',
    processor: 'ATmega328P',
    operatingVoltage: 5,
    backendIds: [ARDUINO_BACKEND.id],
    capabilities: ['digital-io', 'analog-input', 'pwm', 'i2c', 'spi', 'uart'],
    pins: [...commonPins, analogPin('A6', false), analogPin('A7', false)],
    buses: commonBuses,
    modes: ['standalone', 'realtime'],
  },
  {
    id: 'esp32-dev-module', name: 'ESP32 Dev Module', version: '1', fqbn: 'esp32:esp32:esp32',
    processor: 'ESP32', operatingVoltage: 3.3, backendIds: [ARDUINO_BACKEND.id],
    capabilities: ['digital-io', 'analog-input', 'pwm', 'i2c', 'spi', 'uart'],
    pins: [...esp32Pins([0, 2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33], [32, 33]),
      ...['34', '35', '36', '39'].map(esp32InputPin)],
    buses: esp32Buses('21', '22', '5', '23', '19', '18', '16', '17'), modes: ['standalone', 'realtime'],
  },
  {
    id: 'esp32-s2-dev-module', name: 'ESP32-S2 Dev Module', version: '1', fqbn: 'esp32:esp32:esp32s2',
    processor: 'ESP32-S2', operatingVoltage: 3.3, backendIds: [ARDUINO_BACKEND.id],
    capabilities: ['digital-io', 'analog-input', 'pwm', 'i2c', 'spi', 'uart'],
    pins: esp32Pins(Array.from({length: 46}, (_, index) => index).filter(pin => ![19, 20, 22, 23, 24, 25].includes(pin)), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    buses: esp32Buses('8', '9', '34', '35', '37', '36', '44', '43'), modes: ['standalone', 'realtime'],
  },
  {
    id: 'esp32-s3-dev-module', name: 'ESP32-S3 Dev Module', version: '1', fqbn: 'esp32:esp32:esp32s3',
    processor: 'ESP32-S3', operatingVoltage: 3.3, backendIds: [ARDUINO_BACKEND.id],
    capabilities: ['digital-io', 'analog-input', 'pwm', 'i2c', 'spi', 'uart'],
    pins: esp32Pins(Array.from({length: 49}, (_, index) => index).filter(pin => ![19, 20, 22, 23, 24, 25].includes(pin)), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    buses: esp32Buses('8', '9', '10', '11', '13', '12', '44', '43'), modes: ['standalone', 'realtime'],
  },
  {
    id: 'esp32-c3-dev-module', name: 'ESP32-C3 Dev Module', version: '1', fqbn: 'esp32:esp32:esp32c3',
    processor: 'ESP32-C3', operatingVoltage: 3.3, backendIds: [ARDUINO_BACKEND.id],
    capabilities: ['digital-io', 'analog-input', 'pwm', 'i2c', 'spi', 'uart'],
    pins: esp32Pins(Array.from({length: 22}, (_, index) => index), [0, 1, 2, 3, 4]),
    buses: esp32Buses('8', '9', '7', '6', '5', '4', '20', '21'), modes: ['standalone', 'realtime'],
  },
  {
    id: 'esp32-cam-ai-thinker', name: 'AI Thinker ESP32-CAM', version: '1', fqbn: 'esp32:esp32:esp32cam',
    processor: 'ESP32', operatingVoltage: 3.3, backendIds: [ARDUINO_BACKEND.id],
    capabilities: ['digital-io', 'analog-input', 'pwm', 'i2c', 'spi', 'uart'],
    pins: esp32Pins([0, 1, 2, 3, 4, 12, 13, 14, 15, 16], [2, 4, 12, 13, 14, 15]),
    buses: [
      {id: 'wire', type: 'i2c', signals: {sda: '15', scl: '14'}},
      {id: 'spi', type: 'spi', signals: {ss: '15', mosi: '13', miso: '12', sck: '14'}},
      {id: 'serial', type: 'uart', signals: {rx: '3', tx: '1'}},
    ], modes: ['standalone', 'realtime'],
  },
]

export const ARDUINO_COMPONENTS: readonly ComponentDefinition[] = [
  {
    id: 'dht11-dht22', name: 'DHT11/DHT22', version: '1',
    boardIds: ['arduino-uno', 'arduino-nano'], backendIds: [ARDUINO_BACKEND.id],
    requiredCapabilities: ['digital-io'], modes: ['standalone', 'realtime'],
  },
  {
    id: 'hc-sr04', name: 'HC-SR04', version: '1',
    boardIds: ['arduino-uno', 'arduino-nano'], backendIds: [ARDUINO_BACKEND.id],
    requiredCapabilities: ['digital-io'], modes: ['standalone', 'realtime'],
  },
  {
    id: 'servo', name: 'Servomotor', version: '1',
    boardIds: ['arduino-uno', 'arduino-nano'], backendIds: [ARDUINO_BACKEND.id],
    requiredCapabilities: ['digital-io'], modes: ['standalone', 'realtime'],
  },
  {id: 'touch', name: 'Touch sensor', version: '1', boardIds: ['arduino-uno', 'arduino-nano'], backendIds: [ARDUINO_BACKEND.id], requiredCapabilities: ['digital-io'], modes: ['standalone', 'realtime']},
  {id: 'sound-sensor', name: 'Sound sensor', version: '1', boardIds: ['arduino-uno', 'arduino-nano'], backendIds: [ARDUINO_BACKEND.id], requiredCapabilities: ['analog-input'], modes: ['standalone', 'realtime']},
  {id: 'photoresistor', name: 'Photoresistor', version: '1', boardIds: ['arduino-uno', 'arduino-nano'], backendIds: [ARDUINO_BACKEND.id], requiredCapabilities: ['analog-input'], modes: ['standalone', 'realtime']},
  {id: 'buzzer', name: 'Buzzer', version: '1', boardIds: ['arduino-uno', 'arduino-nano'], backendIds: [ARDUINO_BACKEND.id], requiredCapabilities: ['digital-io'], modes: ['standalone', 'realtime']},
  {id: 'vl53l0x', name: 'VL53L0X', version: '1', boardIds: ['arduino-uno', 'arduino-nano'], backendIds: [ARDUINO_BACKEND.id], requiredCapabilities: ['i2c'], modes: ['standalone', 'realtime']},
  {id: 'neopixel', name: 'NeoPixel', version: '1', boardIds: ['arduino-uno', 'arduino-nano'], backendIds: [ARDUINO_BACKEND.id], requiredCapabilities: ['digital-io'], modes: ['standalone', 'realtime']},
  {id: 'led', name: 'LED', version: '1', boardIds: ['arduino-uno', 'arduino-nano', ...esp32BoardIds], backendIds: [ARDUINO_BACKEND.id], requiredCapabilities: ['digital-io'], modes: ['standalone', 'realtime']},
  {id: 'pn532', name: 'PN532', version: '1', boardIds: ['arduino-uno', 'arduino-nano', ...esp32BoardIds], backendIds: [ARDUINO_BACKEND.id], requiredCapabilities: ['i2c', 'spi'], modes: ['standalone', 'realtime']},
  {id: 'rc522', name: 'RC522', version: '1', boardIds: ['arduino-uno', 'arduino-nano', ...esp32BoardIds], backendIds: [ARDUINO_BACKEND.id], requiredCapabilities: ['spi'], modes: ['standalone', 'realtime']},
]

export const ARDUINO_ROBOTS: readonly RobotDefinition[] = [{
  id: 'otto-diy', name: 'Otto DIY', version: '1', boardId: 'arduino-nano',
  backendIds: [ARDUINO_BACKEND.id], componentIds: ['servo', 'hc-sr04', 'touch', 'sound-sensor', 'photoresistor', 'buzzer'],
  modes: ['standalone', 'realtime'],
}]

export const ARDUINO_HARDWARE_DEFINITIONS: HardwareDefinitions = {
  backends: new HardwareCatalog<BackendDefinition>([ARDUINO_BACKEND]),
  boards: new HardwareCatalog<ArduinoBoardDefinition>(ARDUINO_BOARDS),
  components: new HardwareCatalog<ComponentDefinition>(ARDUINO_COMPONENTS),
  robots: new HardwareCatalog<RobotDefinition>(ARDUINO_ROBOTS),
}

interface ScratchField {
  readonly value: string
}

interface ScratchInput {
  readonly block: string | null
}

export interface ArduinoSourceBlock {
  readonly id: string
  readonly opcode: string
  readonly next: string | null
  readonly topLevel: boolean
  readonly fields: Readonly<Record<string, ScratchField | undefined>>
  readonly inputs: Readonly<Record<string, ScratchInput | undefined>>
}

export interface ArduinoSourceTarget {
  readonly blocks: Readonly<Record<string, ArduinoSourceBlock | undefined>>
}

export interface ArduinoSketchRequest {
  readonly boardId: string
  readonly targets: readonly ArduinoSourceTarget[]
  readonly messages?: {
    readonly pn532Found: string
    readonly pn532NotFound: string
  }
}

export type ArduinoOperation =
  | { readonly type: 'digital-write'; readonly pin: string; readonly level: 'HIGH' | 'LOW' }
  | { readonly type: 'pwm-write'; readonly pin: string; readonly value: string }
  | { readonly type: 'servo-write'; readonly pin: string; readonly angle: string; readonly waitMilliseconds?: string }
  | { readonly type: 'delay'; readonly milliseconds: number | string }
  | { readonly type: 'custom-code'; readonly source: string }
  | { readonly type: 'pn532-config' }
  | { readonly type: 'serial-begin'; readonly baud: number }
  | { readonly type: 'serial-print'; readonly value: string; readonly newline: boolean }
  | { readonly type: 'set-variable'; readonly variable: string; readonly value: string }
  | { readonly type: 'change-variable'; readonly variable: string; readonly value: string }
  | { readonly type: 'arduino-variable-set'; readonly variable: string; readonly value: string }
  | { readonly type: 'comment'; readonly source: string; readonly multiline: boolean }
  | { readonly type: 'if'; readonly condition: string; readonly then: readonly ArduinoOperation[]; readonly otherwise: readonly ArduinoOperation[] }
  | { readonly type: 'forever'; readonly body: readonly ArduinoOperation[] }

export interface ArduinoProgram {
  readonly boardId: string
  readonly boardName: string
  readonly dhtSensors: readonly { readonly model: string; readonly pin: string }[]
  readonly servoPins: readonly string[]
  readonly ultrasonicSensors: readonly { readonly trigger: string; readonly echo: string }[]
  readonly usesVl53l0x: boolean
  readonly neoPixelPins: readonly string[]
  readonly outputPins: readonly string[]
  readonly variables: readonly string[]
  readonly typedVariables: readonly { readonly type: string; readonly name: string; readonly value: string }[]
  readonly interrupts: readonly { readonly pin: string; readonly mode: string; readonly body: readonly ArduinoOperation[] }[]
  readonly touchEvents: readonly { readonly pin: string; readonly level: string; readonly body: readonly ArduinoOperation[] }[]
  readonly setup: readonly ArduinoOperation[]
  readonly loop: readonly ArduinoOperation[]
  readonly usesOtto: boolean
  readonly usesWifi: boolean
  readonly usesRfid: boolean
  readonly usesPn532: boolean
  readonly usesRc522: boolean
  readonly usesPn532I2c: boolean
  readonly usesPn532Spi: boolean
  readonly pn532Operations: ReadonlySet<string>
  readonly rc522Operations: ReadonlySet<string>
  readonly pn532Config: null | {
    readonly bus: 'I2C' | 'SPI'
    readonly sda: string
    readonly scl: string
    readonly mosi: string
    readonly miso: string
    readonly sck: string
    readonly ss: string
    readonly irq: string
    readonly reset: string
  }
  readonly rc522Config: null | {
    readonly mosi: string
    readonly miso: string
    readonly sck: string
    readonly ss: string
    readonly reset: string
  }
}

const getBoard = (boardId: string): ArduinoBoardDefinition => {
  const board = ARDUINO_BOARDS.find((candidate) => candidate.id === boardId)
  if (!board) throw new Error(`Unknown Arduino board: ${boardId}`)
  return board
}

const getField = (block: ArduinoSourceBlock, fieldName: string): string => {
  const field = block.fields[fieldName]
  if (!field) throw new Error(`Missing ${fieldName} field on block ${block.id}`)
  return field.value
}

const numberLiteral = (value: string, blockId: string): string => {
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error(`Invalid number on block ${blockId}`)
  return String(number)
}

const variableName = (name: string): string => {
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_]/g, '_')
  const prefixed = /^[A-Za-z_]/.test(normalized) ? normalized : `v_${normalized}`
  return `sardu_${prefixed || 'variable'}`
}

const getDhtModel = (block: ArduinoSourceBlock): string => block.fields.MODEL?.value || 'DHT11'
const getDhtObjectName = (block: ArduinoSourceBlock): string =>
  `sardu_dht_${getDhtModel(block).toLowerCase()}_${getField(block, 'PIN')}`

const legacyRfidReader = (block: ArduinoSourceBlock): 'pn532' | 'rc522' =>
  block.fields.READER?.value?.toUpperCase() === 'RC522' ? 'rc522' : 'pn532'

const arduinoTypes = new Set([
  'bool', 'byte', 'int', 'unsigned int', 'long', 'unsigned long', 'float', 'double', 'char', 'String',
])

const getReachableArduinoBlocks = (targets: readonly ArduinoSourceTarget[]): ArduinoSourceBlock[] => {
  const reachable: ArduinoSourceBlock[] = []
  targets.forEach(({blocks}) => {
    const pending = Object.values(blocks).filter((block): block is ArduinoSourceBlock => Boolean(
      block?.topLevel && ['sarduBoard_program', 'sarduBoard_interrupt', 'sarduSensors_whenTouch'].includes(block.opcode),
    ))
    const visited = new Set<string>()
    while (pending.length) {
      const block = pending.pop()
      if (!block || visited.has(block.id)) continue
      visited.add(block.id)
      reachable.push(block)
      const linkedIds = [block.next, ...Object.values(block.inputs).map(input => input?.block ?? null)]
      linkedIds.forEach(id => {
        const linkedBlock = id ? blocks[id] : undefined
        if (linkedBlock) pending.push(linkedBlock)
      })
    }
  })
  return reachable
}

const getRfidOperation = (opcode: string): string | null => {
  if (opcode.endsWith('TagPresent')) return 'present'
  if (opcode.endsWith('Uid')) return 'uid'
  if (opcode.endsWith('TagType')) return 'type'
  if (opcode.endsWith('Authenticate')) return 'authenticate'
  if (opcode.endsWith('ReadBlock')) return 'read'
  if (opcode.endsWith('WriteBlock')) return 'write'
  return null
}

const getLiteralInput = (
  blocks: Readonly<Record<string, ArduinoSourceBlock | undefined>>,
  block: ArduinoSourceBlock,
  inputName: string,
): string => {
  const inputId = block.inputs[inputName]?.block
  const inputBlock = inputId ? blocks[inputId] : undefined
  if (!inputBlock) throw new Error(`Missing ${inputName} input on block ${block.id}`)
  if (inputBlock.opcode === 'text') return getField(inputBlock, 'TEXT')
  if (inputBlock.opcode === 'sarduBoard_multiline') return getField(inputBlock, 'field_sarduBoard_multiline')
  if (inputBlock.opcode.startsWith('math_')) return getField(inputBlock, 'NUM')
  throw new Error(`${inputName} on block ${block.id} must be literal text`)
}

const getExpression = (
  blocks: Readonly<Record<string, ArduinoSourceBlock | undefined>>,
  block: ArduinoSourceBlock,
  inputName: string,
  variables: Set<string>,
): string => {
  const inputId = block.inputs[inputName]?.block
  const inputBlock = inputId ? blocks[inputId] : undefined
  if (!inputBlock) throw new Error(`Missing ${inputName} input on block ${block.id}`)
  switch (inputBlock.opcode) {
    case 'math_number':
    case 'math_integer':
    case 'math_whole_number':
    case 'math_positive_number':
      return numberLiteral(getField(inputBlock, 'NUM'), inputBlock.id)
    case 'text':
      return numberLiteral(getField(inputBlock, 'TEXT'), inputBlock.id)
    case 'data_variable': {
      const name = variableName(getField(inputBlock, 'VARIABLE'))
      variables.add(name)
      return name
    }
    case 'sarduBoard_millis': return 'millis()'
    case 'sarduBoard_micros': return 'micros()'
    case 'sarduBoard_readAnalogPin': return `analogRead(${getField(inputBlock, 'PIN')})`
    case 'sarduBoard_readDigitalPin': return `digitalRead(${getField(inputBlock, 'PIN')})`
    case 'sarduBoard_arduinoVariable': return variableName(getLiteralInput(blocks, inputBlock, 'NAME'))
    case 'sarduBoard_convertValue': {
      const type = getField(inputBlock, 'TYPE')
      if (!arduinoTypes.has(type)) throw new Error(`Unsupported Arduino type: ${type}`)
      const value = getTypedExpression(blocks, inputBlock, 'VALUE', type, variables)
      return type === 'String' ? `String(${value})` : `((${type})(${value}))`
    }
    case 'sarduBoard_dhtTemperature':
    case 'sarduSensors_dhtTemperature': return `((int)${getDhtObjectName(inputBlock)}.readTemperature())`
    case 'sarduBoard_dhtHumidity':
    case 'sarduSensors_dhtHumidity': return `((int)${getDhtObjectName(inputBlock)}.readHumidity())`
    case 'sarduSensors_ultrasonicDistance': {
      const unit = getField(inputBlock, 'UNIT')
      const sensor = `ultrasonic_${getField(inputBlock, 'TRIGGER')}_${getField(inputBlock, 'ECHO')}`
      if (unit === 'cm') return `${sensor}.read(CM)`
      if (unit === 'inch') return `${sensor}.read(INC)`
      throw new Error(`Unsupported HC-SR04 distance unit: ${unit}`)
    }
    case 'sarduSensors_soundLevel': {
      const value = `analogRead(${getField(inputBlock, 'PIN')})`
      return getField(inputBlock, 'FORMAT') === 'percent' ? `((${value} * 100L) / 1023)` : value
    }
    case 'sarduSensors_lightLevel': {
      const value = `analogRead(${getField(inputBlock, 'PIN')})`
      return getField(inputBlock, 'FORMAT') === 'percent' ? `(((1023 - ${value}) * 100L) / 1023)` : value
    }
    case 'sarduSensors_touch': return `(digitalRead(${getField(inputBlock, 'PIN')}) == HIGH)`
    case 'sarduSensors_rfidTagPresent': return `${legacyRfidReader(inputBlock)}CercaTag()`
    case 'sarduSensors_pn532TagPresent': return 'pn532CercaTag()'
    case 'sarduSensors_pn532Uid': return 'pn532Uid()'
    case 'sarduSensors_pn532TagType': return 'pn532Tipo()'
    case 'sarduSensors_pn532ReadBlock': return `pn532Leggi(${getExpression(blocks, inputBlock, 'BLOCK', variables)})`
    case 'sarduSensors_pn532Authenticate': return `pn532Autentica(${getExpression(blocks, inputBlock, 'BLOCK', variables)}, "${getField(inputBlock, 'KEY_TYPE')}", ${JSON.stringify(getLiteralInput(blocks, inputBlock, 'KEY'))})`
    case 'sarduSensors_rfidUid': return `${legacyRfidReader(inputBlock)}Uid()`
    case 'sarduSensors_rfidTagType': return `${legacyRfidReader(inputBlock)}Tipo()`
    case 'sarduSensors_rfidReadBlock': return `${legacyRfidReader(inputBlock)}Leggi(${getExpression(blocks, inputBlock, 'BLOCK', variables)})`
    case 'sarduSensors_rfidAuthenticate': return `${legacyRfidReader(inputBlock)}Autentica(${getExpression(blocks, inputBlock, 'BLOCK', variables)}, "${getField(inputBlock, 'KEY_TYPE')}", ${JSON.stringify(getLiteralInput(blocks, inputBlock, 'KEY'))})`
    case 'sarduSensors_rc522TagPresent': return 'rc522CercaTag()'
    case 'sarduSensors_rc522Uid': return 'rc522Uid()'
    case 'sarduSensors_rc522TagType': return 'rc522Tipo()'
    case 'sarduSensors_rc522ReadBlock': return `rc522Leggi(${getExpression(blocks, inputBlock, 'BLOCK', variables)})`
    case 'sarduSensors_rc522Authenticate': return `rc522Autentica(${getExpression(blocks, inputBlock, 'BLOCK', variables)}, "${getField(inputBlock, 'KEY_TYPE')}", ${JSON.stringify(getLiteralInput(blocks, inputBlock, 'KEY'))})`
    case 'sarduSensors_laserDistance': return getField(inputBlock, 'UNIT') === 'cm' ?
      '(vl53l0x.readRangeSingleMillimeters() / 10)' : 'vl53l0x.readRangeSingleMillimeters()'
    case 'sarduActuators_servoAngle': return `servo_${getField(inputBlock, 'PIN')}.read()`
    case 'sarduWifi_isConnected': return '(WiFi.status() == WL_CONNECTED)'
    case 'sarduWifi_localIp': return 'WiFi.localIP().toString()'
    case 'operator_join': return `(String(${getStringExpression(blocks, inputBlock, 'STRING1', variables)}) + String(${getStringExpression(blocks, inputBlock, 'STRING2', variables)}))`
    case 'operator_add': return `(${getExpression(blocks, inputBlock, 'NUM1', variables)} + ${getExpression(blocks, inputBlock, 'NUM2', variables)})`
    case 'operator_subtract': return `(${getExpression(blocks, inputBlock, 'NUM1', variables)} - ${getExpression(blocks, inputBlock, 'NUM2', variables)})`
    case 'operator_multiply': return `(${getExpression(blocks, inputBlock, 'NUM1', variables)} * ${getExpression(blocks, inputBlock, 'NUM2', variables)})`
    case 'operator_divide': return `(${getExpression(blocks, inputBlock, 'NUM1', variables)} / ${getExpression(blocks, inputBlock, 'NUM2', variables)})`
    case 'operator_mod': return `(${getExpression(blocks, inputBlock, 'NUM1', variables)} % ${getExpression(blocks, inputBlock, 'NUM2', variables)})`
    case 'operator_gt': return `(${getExpression(blocks, inputBlock, 'OPERAND1', variables)} > ${getExpression(blocks, inputBlock, 'OPERAND2', variables)})`
    case 'operator_lt': return `(${getExpression(blocks, inputBlock, 'OPERAND1', variables)} < ${getExpression(blocks, inputBlock, 'OPERAND2', variables)})`
    case 'operator_equals': return `(${getExpression(blocks, inputBlock, 'OPERAND1', variables)} == ${getExpression(blocks, inputBlock, 'OPERAND2', variables)})`
    case 'operator_and': return `(${getExpression(blocks, inputBlock, 'OPERAND1', variables)} && ${getExpression(blocks, inputBlock, 'OPERAND2', variables)})`
    case 'operator_or': return `(${getExpression(blocks, inputBlock, 'OPERAND1', variables)} || ${getExpression(blocks, inputBlock, 'OPERAND2', variables)})`
    case 'operator_not': return `(!${getExpression(blocks, inputBlock, 'OPERAND', variables)})`
    case 'operator_round': return `round(${getExpression(blocks, inputBlock, 'NUM', variables)})`
    default: throw new Error(`Unsupported Arduino expression: ${inputBlock.opcode}`)
  }
}

const getStringExpression = (
  blocks: Readonly<Record<string, ArduinoSourceBlock | undefined>>,
  block: ArduinoSourceBlock,
  inputName: string,
  variables: Set<string>,
): string => {
  const inputId = block.inputs[inputName]?.block
  const inputBlock = inputId ? blocks[inputId] : undefined
  if (!inputBlock) throw new Error(`Missing ${inputName} input on block ${block.id}`)
  if (inputBlock.opcode === 'text') return JSON.stringify(getField(inputBlock, 'TEXT')) as string
  return getExpression(blocks, block, inputName, variables)
}

const getTypedExpression = (
  blocks: Readonly<Record<string, ArduinoSourceBlock | undefined>>,
  block: ArduinoSourceBlock,
  inputName: string,
  type: string,
  variables: Set<string>,
): string => {
  const inputId = block.inputs[inputName]?.block
  const inputBlock = inputId ? blocks[inputId] : undefined
  if (!inputBlock) throw new Error(`Missing ${inputName} input on block ${block.id}`)
  if (inputBlock.opcode !== 'text') return getExpression(blocks, block, inputName, variables)
  const value = getField(inputBlock, 'TEXT')
  if (type === 'String') return JSON.stringify(value) as string
  if (type === 'char') return `((char)${JSON.stringify(value)}[0])`
  if (type === 'bool' && ['true', 'false'].includes(value.toLowerCase())) return value.toLowerCase()
  return numberLiteral(value, inputBlock.id)
}

const getMultilineSource = (
  blocks: Readonly<Record<string, ArduinoSourceBlock | undefined>>,
  block: ArduinoSourceBlock,
): string => {
  const inputId = block.inputs.CODE?.block
  const inputBlock = inputId ? blocks[inputId] : undefined
  if (!inputBlock) throw new Error(`Missing CODE input on block ${block.id}`)
  if (inputBlock.opcode === 'sarduBoard_multiline') {
    return getField(inputBlock, 'field_sarduBoard_multiline')
  }
  if (inputBlock.opcode === 'text') return getField(inputBlock, 'TEXT')
  throw new Error(`Unsupported custom Arduino code input: ${inputBlock.opcode}`)
}

const indent = (lines: readonly string[]): string => lines.map((line) => `  ${line}`).join('\n')

const collectDhtPins = (
  blocks: Readonly<Record<string, ArduinoSourceBlock | undefined>>,
  firstId: string | null,
  board: ArduinoBoardDefinition,
  sensors: Map<string, { readonly model: string; readonly pin: string }>,
  servoPins: Set<string>,
  ultrasonic: Map<string, { readonly trigger: string; readonly echo: string }>,
  neoPixelPins: Set<string>,
  visited = new Set<string>(),
): void => {
  let blockId = firstId
  while (blockId) {
    if (visited.has(blockId)) return
    visited.add(blockId)
    const block = blocks[blockId]
    if (!block) return
    if (['sarduBoard_dhtTemperature', 'sarduBoard_dhtHumidity',
      'sarduSensors_dhtTemperature', 'sarduSensors_dhtHumidity'].includes(block.opcode)) {
      const pin = getField(block, 'PIN')
      const model = getDhtModel(block)
      if (!['DHT11', 'DHT21', 'DHT22'].includes(model)) throw new Error(`Unsupported DHT model: ${model}`)
      if (!board.pins.some((candidate) => candidate.id === pin && candidate.capabilities.includes('digital-input'))) {
        throw new Error(`Pin ${pin} does not support ${model} on ${board.name}`)
      }
      sensors.set(`${model}:${pin}`, { model, pin })
    }
    if (['sarduActuators_setServoAngle', 'sarduActuators_setServoAngleAndWait',
      'sarduActuators_servoAngle'].includes(block.opcode)) {
      const pin = getField(block, 'PIN')
      if (!board.pins.some((candidate) => candidate.id === pin && candidate.capabilities.includes('digital-output'))) {
        throw new Error(`Pin ${pin} does not support a servo on ${board.name}`)
      }
      servoPins.add(pin)
    }
    if (block.opcode === 'sarduSensors_ultrasonicDistance') {
      const trigger = getField(block, 'TRIGGER')
      const echo = getField(block, 'ECHO')
      if (!board.pins.some((candidate) => candidate.id === trigger && candidate.capabilities.includes('digital-output')) ||
        !board.pins.some((candidate) => candidate.id === echo && candidate.capabilities.includes('digital-input'))) {
        throw new Error(`Pins ${trigger}/${echo} do not support HC-SR04 on ${board.name}`)
      }
      ultrasonic.set(`${trigger}:${echo}`, { trigger, echo })
    }
    if (block.opcode.startsWith('sarduActuators_') && block.opcode.toLowerCase().includes('neopixel')) {
      neoPixelPins.add(getField(block, 'PIN'))
    }
    Object.values(block.inputs).forEach((input) => {
      if (input?.block) collectDhtPins(blocks, input.block, board, sensors, servoPins, ultrasonic, neoPixelPins, visited)
    })
    blockId = block.next
  }
}

const generateStack = (
  blocks: Readonly<Record<string, ArduinoSourceBlock | undefined>>,
  firstId: string | null,
  board: ArduinoBoardDefinition,
  outputPins: Set<string>,
  variables: Set<string>,
  typedVariables: Map<string, { readonly type: string; readonly name: string; readonly value: string }>,
): ArduinoOperation[] => {
  const operations: ArduinoOperation[] = []
  const visited = new Set<string>()
  let blockId = firstId

  while (blockId) {
    if (visited.has(blockId)) throw new Error(`Cycle detected at Arduino block ${blockId}`)
    visited.add(blockId)

    const block = blocks[blockId]
    if (!block) throw new Error(`Missing Arduino block: ${blockId}`)

    switch (block.opcode) {
      case 'sarduBoard_setDigitalPin': {
        const pin = getField(block, 'PIN')
        const level = getField(block, 'LEVEL')
        const pinDefinition = board.pins.find((candidate) => candidate.id === pin)
        if (!pinDefinition?.capabilities.includes('digital-output')) {
          throw new Error(`Pin ${pin} does not support digital output on ${board.name}`)
        }
        if (level !== 'HIGH' && level !== 'LOW') {
          throw new Error(`Invalid digital level ${level} on block ${block.id}`)
        }
        outputPins.add(pin)
        operations.push({ type: 'digital-write', pin, level })
        break
      }
      case 'sarduBoard_setPwmPin': {
        const pin = getField(block, 'PIN')
        if (!board.pins.some((candidate) => candidate.id === pin && candidate.capabilities.includes('pwm'))) {
          throw new Error(`Pin ${pin} does not support PWM on ${board.name}`)
        }
        outputPins.add(pin)
        operations.push({ type: 'pwm-write', pin, value: getExpression(blocks, block, 'VALUE', variables) })
        break
      }
      case 'sarduActuators_setLed': {
        const pin = getField(block, 'PIN')
        const level = getField(block, 'STATE')
        if (level !== 'HIGH' && level !== 'LOW') throw new Error(`Invalid LED state ${level} on block ${block.id}`)
        outputPins.add(pin)
        operations.push({type: 'digital-write', pin, level})
        break
      }
      case 'sarduWifi_connect': {
        if (!board.id.startsWith('esp32-')) throw new Error(`Wi-Fi blocks require an ESP32 board, not ${board.name}`)
        const ssid = JSON.stringify(getLiteralInput(blocks, block, 'SSID'))
        const password = JSON.stringify(getLiteralInput(blocks, block, 'PASSWORD'))
        const seconds = getExpression(blocks, block, 'SECONDS', variables)
        operations.push({type: 'custom-code', source: `WiFi.begin(${ssid}, ${password});\n{\n  const unsigned long sardu_wifi_started = millis();\n  while (WiFi.status() != WL_CONNECTED && millis() - sardu_wifi_started < ((unsigned long)(${seconds}) * 1000UL)) delay(250);\n}`})
        break
      }
      case 'sarduWifi_disconnect':
        if (!board.id.startsWith('esp32-')) throw new Error(`Wi-Fi blocks require an ESP32 board, not ${board.name}`)
        operations.push({type: 'custom-code', source: 'WiFi.disconnect();'})
        break
      case 'sarduSensors_rfidConfigurePn532I2c':
        operations.push({type: 'pn532-config'})
        break
      case 'sarduSensors_rfidConfigurePn532I2cAdvanced':
        operations.push({type: 'pn532-config'})
        break
      case 'sarduSensors_rfidConfigurePn532Spi':
        operations.push({type: 'pn532-config'})
        break
      case 'sarduSensors_rfidConfigureRc522Spi':
        break
      case 'sarduSensors_rfidWriteBlock':
        operations.push({type: 'custom-code', source: `${legacyRfidReader(block)}Scrivi(${getExpression(blocks, block, 'BLOCK', variables)}, ${JSON.stringify(getLiteralInput(blocks, block, 'DATA'))});`})
        break
      case 'sarduSensors_pn532WriteBlock':
        operations.push({type: 'custom-code', source: `pn532Scrivi(${getExpression(blocks, block, 'BLOCK', variables)}, ${JSON.stringify(getLiteralInput(blocks, block, 'DATA'))});`})
        break
      case 'sarduSensors_rc522WriteBlock':
        operations.push({type: 'custom-code', source: `rc522Scrivi(${getExpression(blocks, block, 'BLOCK', variables)}, ${JSON.stringify(getLiteralInput(blocks, block, 'DATA'))});`})
        break
      case 'sarduActuators_setLedBrightness': {
        const pin = getField(block, 'PIN')
        if (!board.pins.some(candidate => candidate.id === pin && candidate.capabilities.includes('pwm'))) {
          throw new Error(`Pin ${pin} does not support PWM on ${board.name}`)
        }
        outputPins.add(pin)
        const percentage = getExpression(blocks, block, 'BRIGHTNESS', variables)
        operations.push({type: 'pwm-write', pin, value: `map(constrain(${percentage}, 0, 100), 0, 100, 0, 255)`})
        break
      }
      case 'sarduActuators_setServoAngle':
        operations.push({
          type: 'servo-write',
          pin: getField(block, 'PIN'),
          angle: getExpression(blocks, block, 'ANGLE', variables),
        })
        break
      case 'sarduActuators_setServoAngleAndWait':
        operations.push({
          type: 'servo-write',
          pin: getField(block, 'PIN'),
          angle: getExpression(blocks, block, 'ANGLE', variables),
          waitMilliseconds: getExpression(blocks, block, 'MILLIS', variables),
        })
        break
      case 'sarduActuators_playTone':
        operations.push({type: 'custom-code', source: `tone(${getField(block, 'PIN')}, ${getExpression(blocks, block, 'FREQUENCY', variables)}, ${getExpression(blocks, block, 'MILLIS', variables)});`})
        break
      case 'sarduActuators_configureNeoPixel': {
        const pin = getField(block, 'PIN'); const count = getExpression(blocks, block, 'COUNT', variables)
        operations.push({type: 'custom-code', source: `neopixel_${pin}.updateLength(${count});\nneopixel_${pin}.setPin(${pin});\nneopixel_${pin}.updateType(NEO_GRB + NEO_KHZ800);\nneopixel_${pin}.begin();`})
        break
      }
      case 'sarduActuators_setNeoPixelRgb': {
        const pin = getField(block, 'PIN')
        operations.push({type:'custom-code', source:`neopixel_${pin}.setPixelColor(${getExpression(blocks, block, 'PIXEL', variables)}, ${getExpression(blocks, block, 'RED', variables)}, ${getExpression(blocks, block, 'GREEN', variables)}, ${getExpression(blocks, block, 'BLUE', variables)});`})
        break
      }
      case 'sarduActuators_setNeoPixelHsv': {
        const pin = getField(block, 'PIN'); const h=getExpression(blocks,block,'HUE',variables); const s=getExpression(blocks,block,'SATURATION',variables); const v=getExpression(blocks,block,'BRIGHTNESS',variables)
        operations.push({type:'custom-code', source:`neopixel_${pin}.setPixelColor(${getExpression(blocks,block,'PIXEL',variables)}, neopixel_${pin}.ColorHSV((uint16_t)(constrain(${h}, 0, 360) * 65535.0 / 360.0), map(constrain(${s}, 0, 100), 0, 100, 0, 255), map(constrain(${v}, 0, 100), 0, 100, 0, 255)));`})
        break
      }
      case 'sarduActuators_fillNeoPixelRgb':
      case 'sarduActuators_fillNeoPixelHsv': {
        const pin=getField(block,'PIN'); const first=getExpression(blocks,block,'FIRST',variables); const last=getExpression(blocks,block,'LAST',variables)
        const color=block.opcode.endsWith('Rgb') ? `neopixel_${pin}.Color(${getExpression(blocks,block,'RED',variables)}, ${getExpression(blocks,block,'GREEN',variables)}, ${getExpression(blocks,block,'BLUE',variables)})` : `neopixel_${pin}.ColorHSV((uint16_t)(constrain(${getExpression(blocks,block,'HUE',variables)}, 0, 360) * 65535.0 / 360.0), map(constrain(${getExpression(blocks,block,'SATURATION',variables)}, 0, 100), 0, 100, 0, 255), map(constrain(${getExpression(blocks,block,'BRIGHTNESS',variables)}, 0, 100), 0, 100, 0, 255))`
        operations.push({type:'custom-code', source:`for (int sardu_pixel = ${first}; sardu_pixel <= ${last}; ++sardu_pixel) neopixel_${pin}.setPixelColor(sardu_pixel, ${color});`})
        break
      }
      case 'sarduActuators_setNeoPixelBrightness': { const pin=getField(block,'PIN'); operations.push({type:'custom-code',source:`neopixel_${pin}.setBrightness(map(constrain(${getExpression(blocks,block,'BRIGHTNESS',variables)}, 0, 100), 0, 100, 0, 255));`}); break }
      case 'sarduActuators_clearNeoPixels': { const pin=getField(block,'PIN'); operations.push({type:'custom-code',source:`neopixel_${pin}.clear();`}); break }
      case 'sarduActuators_showNeoPixels': { const pin=getField(block,'PIN'); operations.push({type:'custom-code',source:`neopixel_${pin}.show();`}); break }
      case 'sarduActuators_rainbowNeoPixels': { const pin=getField(block,'PIN'); operations.push({type:'custom-code',source:`neopixel_${pin}.rainbow((uint16_t)(constrain(${getExpression(blocks,block,'HUE',variables)}, 0, 360) * 65535.0 / 360.0), ${getExpression(blocks,block,'REPETITIONS',variables)});\nneopixel_${pin}.show();`}); break }
      case 'sarduActuators_rotateNeoPixels':
      case 'sarduActuators_shiftNeoPixels': {
        const pin=getField(block,'PIN'); const amount=getExpression(blocks,block,'POSITIONS',variables); const rotate=block.opcode.includes('rotate')
        const positive=rotate ? `uint32_t sardu_last = neopixel_${pin}.getPixelColor(neopixel_${pin}.numPixels() - 1); for (int sardu_i = neopixel_${pin}.numPixels() - 1; sardu_i > 0; --sardu_i) neopixel_${pin}.setPixelColor(sardu_i, neopixel_${pin}.getPixelColor(sardu_i - 1)); neopixel_${pin}.setPixelColor(0, sardu_last);` : `for (int sardu_i = neopixel_${pin}.numPixels() - 1; sardu_i > 0; --sardu_i) neopixel_${pin}.setPixelColor(sardu_i, neopixel_${pin}.getPixelColor(sardu_i - 1)); neopixel_${pin}.setPixelColor(0, 0);`
        const negative=rotate ? `uint32_t sardu_first = neopixel_${pin}.getPixelColor(0); for (uint16_t sardu_i = 0; sardu_i + 1 < neopixel_${pin}.numPixels(); ++sardu_i) neopixel_${pin}.setPixelColor(sardu_i, neopixel_${pin}.getPixelColor(sardu_i + 1)); neopixel_${pin}.setPixelColor(neopixel_${pin}.numPixels() - 1, sardu_first);` : `for (uint16_t sardu_i = 0; sardu_i + 1 < neopixel_${pin}.numPixels(); ++sardu_i) neopixel_${pin}.setPixelColor(sardu_i, neopixel_${pin}.getPixelColor(sardu_i + 1)); neopixel_${pin}.setPixelColor(neopixel_${pin}.numPixels() - 1, 0);`
        operations.push({type:'custom-code',source:`{ int sardu_steps = ${amount}; while (sardu_steps > 0) { ${positive} --sardu_steps; } while (sardu_steps < 0) { ${negative} ++sardu_steps; } }`})
        break
      }
      case 'sarduOtto_configure':
        operations.push({type: 'custom-code', source: `Otto.init(${getExpression(blocks, block, 'YL', variables)}, ${getExpression(blocks, block, 'YR', variables)}, ${getExpression(blocks, block, 'RL', variables)}, ${getExpression(blocks, block, 'RR', variables)}, true, ${getExpression(blocks, block, 'BUZZER', variables)});`})
        break
      case 'sarduOtto_home': operations.push({type: 'custom-code', source: 'Otto.home();'}); break
      case 'sarduOtto_move': {
        const movement: Record<string, string> = {
          'walk-forward': 'walk', 'walk-backward': 'walk', 'turn-left': 'turn', 'turn-right': 'turn',
          'bend-left': 'bend', 'bend-right': 'bend', 'shake-left': 'shakeLeg', 'shake-right': 'shakeLeg', jump: 'jump',
        }
        const selected = getField(block, 'MOVE'); const method = movement[selected]
        if (!method) throw new Error(`Unsupported Otto movement: ${selected}`)
        const direction = selected.endsWith('backward') ? 'BACKWARD' : selected.endsWith('right') ? 'RIGHT' : selected.endsWith('left') ? 'LEFT' : 'FORWARD'
        const args = `${getExpression(blocks, block, 'STEPS', variables)}, ${getExpression(blocks, block, 'TIME', variables)}`
        operations.push({type: 'custom-code', source: `Otto.${method}(${args}${method === 'jump' ? '' : `, ${direction}`});`})
        break
      }
      case 'sarduOtto_dance': {
        const selected = getField(block, 'DANCE'); const parts = selected.split('-')
        const names: Record<string, string> = {moonwalker:'moonwalker', crusaito:'crusaito', flapping:'flapping', swing:'swing', tiptoe:'tiptoeSwing', jitter:'jitter', updown:'updown', ascending:'ascendingTurn'}
        const method = names[parts[0]]; if (!method) throw new Error(`Unsupported Otto dance: ${selected}`)
        const direction = parts.includes('right') ? 'RIGHT' : parts.includes('backward') ? 'BACKWARD' : parts.includes('left') ? 'LEFT' : 'FORWARD'
        operations.push({type:'custom-code', source:`Otto.${method}(${getExpression(blocks, block, 'STEPS', variables)}, ${getExpression(blocks, block, 'TIME', variables)}, ${getExpression(blocks, block, 'HEIGHT', variables)}${['moonwalker','crusaito','flapping'].includes(method) ? `, ${direction}` : ''});`})
        break
      }
      case 'sarduOtto_sing': operations.push({type:'custom-code', source:`Otto.sing(${getField(block, 'SOUND')});`}); break
      case 'sarduOtto_beep': operations.push({type:'custom-code', source:`Otto._tone(${getExpression(blocks, block, 'FREQUENCY', variables)}, ${getExpression(blocks, block, 'DURATION', variables)}, ${getExpression(blocks, block, 'SILENCE', variables)});`}); break
      case 'sarduOtto_gesture': operations.push({type:'custom-code', source:`Otto.playGesture(${getField(block, 'GESTURE')});`}); break
      case 'sarduBoard_shortComment':
        operations.push({ type: 'comment', source: getLiteralInput(blocks, block, 'TEXT'), multiline: false })
        break
      case 'sarduBoard_longComment':
        operations.push({ type: 'comment', source: getLiteralInput(blocks, block, 'TEXT'), multiline: true })
        break
      case 'sarduBoard_declareArduinoVariable': {
        const type = getField(block, 'TYPE')
        if (!arduinoTypes.has(type)) throw new Error(`Unsupported Arduino type: ${type}`)
        const name = variableName(getLiteralInput(blocks, block, 'NAME'))
        const value = getTypedExpression(blocks, block, 'VALUE', type, variables)
        typedVariables.set(name, { type, name, value })
        break
      }
      case 'sarduBoard_setArduinoVariable':
        operations.push({
          type: 'arduino-variable-set',
          variable: variableName(getLiteralInput(blocks, block, 'NAME')),
          value: getStringExpression(blocks, block, 'VALUE', variables),
        })
        break
      case 'sarduBoard_waitMilliseconds':
        {
          const milliseconds = getExpression(blocks, block, 'MILLIS', variables)
          operations.push({ type: 'delay', milliseconds: /^-?\d+(\.\d+)?$/.test(milliseconds) ? Number(milliseconds) : milliseconds })
        }
        break
      case 'sarduBoard_customCode':
        operations.push({ type: 'custom-code', source: getMultilineSource(blocks, block) })
        break
      case 'sarduBoard_serialBegin': {
        const baud = getExpression(blocks, block, 'BAUD', variables)
        const numericBaud = Number(baud)
        if (!/^\d+$/.test(baud) || !Number.isSafeInteger(numericBaud) || numericBaud <= 0 || numericBaud > 2_000_000) {
          throw new Error(`Invalid serial baud rate on block ${block.id}`)
        }
        operations.push({ type: 'serial-begin', baud: numericBaud })
        break
      }
      case 'sarduBoard_serialPrint':
      case 'sarduBoard_serialPrintln':
        operations.push({
          type: 'serial-print',
          value: getStringExpression(blocks, block, 'VALUE', variables),
          newline: block.opcode === 'sarduBoard_serialPrintln',
        })
        break
      case 'control_wait':
        {
          const seconds = getExpression(blocks, block, 'DURATION', variables)
          operations.push({
            type: 'delay',
            milliseconds: /^-?\d+(\.\d+)?$/.test(seconds) ? Number(seconds) * 1000 : `(${seconds} * 1000)`,
          })
        }
        break
      case 'data_setvariableto': {
        const variable = variableName(getField(block, 'VARIABLE'))
        variables.add(variable)
        operations.push({ type: 'set-variable', variable, value: getExpression(blocks, block, 'VALUE', variables) })
        break
      }
      case 'data_changevariableby': {
        const variable = variableName(getField(block, 'VARIABLE'))
        variables.add(variable)
        operations.push({ type: 'change-variable', variable, value: getExpression(blocks, block, 'VALUE', variables) })
        break
      }
      case 'control_if':
      case 'control_if_else':
        operations.push({
          type: 'if',
          condition: getExpression(blocks, block, 'CONDITION', variables),
          then: generateStack(blocks, block.inputs.SUBSTACK?.block ?? null, board, outputPins, variables, typedVariables),
          otherwise: generateStack(blocks, block.inputs.SUBSTACK2?.block ?? null, board, outputPins, variables, typedVariables),
        })
        break
      case 'control_forever':
        operations.push({
          type: 'forever',
          body: generateStack(blocks, block.inputs.SUBSTACK?.block ?? null, board, outputPins, variables, typedVariables),
        })
        break
      default:
        throw new Error(`Unsupported Arduino block: ${block.opcode}`)
    }
    blockId = block.next
  }

  return operations
}

export const compileArduinoProgram = ({ boardId, targets }: ArduinoSketchRequest): ArduinoProgram => {
  const board = getBoard(boardId)
  const setup: ArduinoOperation[] = []
  const loop: ArduinoOperation[] = []
  const outputPins = new Set<string>()
  const dhtSensors = new Map<string, { readonly model: string; readonly pin: string }>()
  const servoPins = new Set<string>()
  const ultrasonic = new Map<string, { readonly trigger: string; readonly echo: string }>()
  const neoPixelPins = new Set<string>()
  const variables = new Set<string>()
  const typedVariables = new Map<string, { readonly type: string; readonly name: string; readonly value: string }>()
  const interrupts: { readonly pin: string; readonly mode: string; readonly body: readonly ArduinoOperation[] }[] = []
  const touchEvents: { readonly pin: string; readonly level: string; readonly body: readonly ArduinoOperation[] }[] = []
  const usesWifi = targets.some(({blocks}) => Object.values(blocks)
    .some(block => block?.opcode.startsWith('sarduWifi_')))
  if (usesWifi && !board.id.startsWith('esp32-')) {
    throw new Error(`Wi-Fi blocks require an ESP32 board, not ${board.name}`)
  }
  const programBlocks = targets.flatMap(({ blocks }) =>
    Object.values(blocks)
      .filter((block): block is ArduinoSourceBlock =>
        Boolean(block?.topLevel && block.opcode === 'sarduBoard_program'))
      .map((block) => ({ block, blocks })),
  )

  if (programBlocks.length > 1) throw new Error('Only one Arduino program block is allowed')

  const program = programBlocks[0]
  if (program) {
    collectDhtPins(program.blocks, program.block.inputs.SUBSTACK?.block ?? null, board, dhtSensors, servoPins, ultrasonic, neoPixelPins)
    collectDhtPins(program.blocks, program.block.inputs.SUBSTACK2?.block ?? null, board, dhtSensors, servoPins, ultrasonic, neoPixelPins)
    setup.push(...generateStack(
      program.blocks,
      program.block.inputs.SUBSTACK?.block ?? null,
      board,
      outputPins,
      variables,
      typedVariables,
    ))
    loop.push(...generateStack(
      program.blocks,
      program.block.inputs.SUBSTACK2?.block ?? null,
      board,
      outputPins,
      variables,
      typedVariables,
    ))
  }

  targets.forEach(({ blocks }) => {
    Object.values(blocks).forEach((block) => {
      if (!block?.topLevel || block.opcode !== 'sarduBoard_interrupt') return
      const pin = getField(block, 'PIN')
      const mode = getField(block, 'MODE')
      if (!['2', '3'].includes(pin)) throw new Error(`Pin ${pin} does not support external interrupts on ${board.name}`)
      if (!['RISING', 'FALLING', 'CHANGE', 'LOW'].includes(mode)) throw new Error(`Invalid interrupt mode ${mode}`)
      collectDhtPins(blocks, block.inputs.SUBSTACK?.block ?? null, board, dhtSensors, servoPins, ultrasonic, neoPixelPins)
      interrupts.push({
        pin,
        mode,
        body: generateStack(blocks, block.inputs.SUBSTACK?.block ?? null, board, outputPins, variables, typedVariables),
      })
    })
  })

  targets.forEach(({blocks}) => Object.values(blocks).forEach((block) => {
    if (!block?.topLevel || block.opcode !== 'sarduSensors_whenTouch') return
    const pin = getField(block, 'PIN'); const level = getField(block, 'LEVEL')
    if (!['A0', 'A2', 'A3'].includes(pin) || !['HIGH', 'LOW'].includes(level)) throw new Error(`Invalid touch event ${pin}/${level}`)
    touchEvents.push({pin, level, body: generateStack(blocks, block.next, board, outputPins, variables, typedVariables)})
  }))

  const reachableBlocks = getReachableArduinoBlocks(targets)
  const pn532Blocks = reachableBlocks.filter(block =>
    block.opcode.startsWith('sarduSensors_pn532') || block.opcode.startsWith('sarduSensors_rfidConfigurePn532') ||
    (getRfidOperation(block.opcode) && block.fields.READER?.value !== 'RC522'))
  const rc522Blocks = reachableBlocks.filter(block =>
    block.opcode.startsWith('sarduSensors_rc522') || block.opcode === 'sarduSensors_rfidConfigureRc522Spi' ||
    (getRfidOperation(block.opcode) && block.fields.READER?.value === 'RC522'))
  const pn532Operations = new Set(pn532Blocks.map(block => getRfidOperation(block.opcode)).filter((operation): operation is string => Boolean(operation)))
  const rc522Operations = new Set(rc522Blocks.map(block => getRfidOperation(block.opcode)).filter((operation): operation is string => Boolean(operation)))
  const pn532Configs = pn532Blocks.flatMap((block): NonNullable<ArduinoProgram['pn532Config']>[] => {
    if (block.opcode === 'sarduSensors_rfidConfigurePn532I2c') return [{
      bus: 'I2C' as const, sda: getField(block, 'SDA'), scl: getField(block, 'SCL'),
      mosi: '-1', miso: '-1', sck: '-1', ss: '-1', irq: '-1', reset: '-1',
    }]
    if (block.opcode === 'sarduSensors_rfidConfigurePn532I2cAdvanced') return [{
      bus: 'I2C' as const, sda: getField(block, 'SDA'), scl: getField(block, 'SCL'),
      mosi: '-1', miso: '-1', sck: '-1', ss: '-1', irq: getField(block, 'IRQ'), reset: getField(block, 'RESET'),
    }]
    if (block.opcode === 'sarduSensors_rfidConfigurePn532Spi' ||
      (block.fields.READER?.value === 'PN532' && block.fields.BUS?.value === 'SPI')) return [{
      bus: 'SPI' as const, sda: '-1', scl: '-1', mosi: getField(block, 'MOSI'), miso: getField(block, 'MISO'),
      sck: getField(block, 'SCK'), ss: getField(block, 'SS'), irq: '-1', reset: '-1',
    }]
    if (block.fields.READER?.value === 'PN532') return [{
      bus: 'I2C' as const, sda: getField(block, 'SDA'), scl: getField(block, 'SCL'),
      mosi: '-1', miso: '-1', sck: '-1', ss: '-1', irq: getField(block, 'IRQ'), reset: getField(block, 'RESET'),
    }]
    return []
  })
  const rc522Configs = rc522Blocks.flatMap(block =>
    block.opcode === 'sarduSensors_rfidConfigureRc522Spi' || block.fields.READER?.value === 'RC522' ? [{
      mosi: getField(block, 'MOSI'), miso: getField(block, 'MISO'), sck: getField(block, 'SCK'),
      ss: getField(block, 'SS'), reset: getField(block, 'RESET'),
    }] : [])
  if (new Set(pn532Configs.map(config => JSON.stringify(config))).size > 1) throw new Error('PN532 has conflicting configurations')
  if (new Set(rc522Configs.map(config => JSON.stringify(config))).size > 1) throw new Error('RC522 has conflicting configurations')
  const pn532Config = pn532Configs[0] || null
  const rc522Config = rc522Configs[0] || null

  return {
    boardId,
    boardName: board.name,
    dhtSensors: Array.from(dhtSensors.values()).sort((left, right) =>
      `${left.model}:${left.pin}`.localeCompare(`${right.model}:${right.pin}`, undefined, { numeric: true })),
    servoPins: Array.from(servoPins).sort((left, right) => left.localeCompare(right, undefined, { numeric: true })),
    ultrasonicSensors: Array.from(ultrasonic.values()).sort((left, right) =>
      `${left.trigger}:${left.echo}`.localeCompare(`${right.trigger}:${right.echo}`, undefined, { numeric: true })),
    usesVl53l0x: targets.some(({blocks}) => Object.values(blocks).some(block => block?.opcode === 'sarduSensors_laserDistance')),
    neoPixelPins: Array.from(neoPixelPins).sort((left, right) => left.localeCompare(right, undefined, {numeric: true})),
    outputPins: Array.from(outputPins).sort((left, right) => left.localeCompare(right, undefined, { numeric: true })),
    variables: Array.from(variables).sort(),
    typedVariables: Array.from(typedVariables.values()).sort((left, right) => left.name.localeCompare(right.name)),
    interrupts: interrupts.sort((left, right) => left.pin.localeCompare(right.pin, undefined, { numeric: true })),
    touchEvents,
    setup,
    loop,
    usesOtto: targets.some(({blocks}) => Object.values(blocks).some(block => block?.opcode.startsWith('sarduOtto_'))),
    usesWifi,
    usesRfid: pn532Blocks.length > 0 || rc522Blocks.length > 0,
    usesPn532: pn532Blocks.length > 0,
    usesRc522: rc522Blocks.length > 0,
    usesPn532I2c: pn532Config?.bus === 'I2C',
    usesPn532Spi: pn532Config?.bus === 'SPI',
    pn532Operations,
    rc522Operations,
    pn532Config,
    rc522Config,
  }
}

const rfidParseHelper = `bool rfidHex(const String &text, uint8_t *bytes, size_t count) {
  if (text.length() != count * 2) return false;
  for (size_t i = 0; i < count; ++i) {
    char pair[3] = {text[i * 2], text[i * 2 + 1], 0};
    char *end = nullptr; long value = strtol(pair, &end, 16);
    if (!end || *end) return false; bytes[i] = (uint8_t)value;
  }
  return true;
}`

const rfidTextHelper = `String rfidHexText(const uint8_t *bytes, size_t count) {
  const char digits[] = "0123456789ABCDEF"; String result; result.reserve(count * 2);
  for (size_t i = 0; i < count; ++i) { result += digits[bytes[i] >> 4]; result += digits[bytes[i] & 15]; }
  return result;
}`

const pn532StateHelpers = `Adafruit_PN532 *pn532 = nullptr;
uint8_t pn532UidBytes[10];
uint8_t pn532UidLength = 0;
uint8_t pn532Sak = 0;
int pn532AuthenticatedBlock = -1;
String pn532Bus;
int pn532Pins[4] = {-1, -1, -1, -1};

bool pn532Avvia() {
  if (!pn532) return false;
  pn532->begin();
  if (!pn532->getFirmwareVersion()) return false;
  pn532->SAMConfig();
  return true;
}`

const pn532I2cHelpers = `void pn532ConfiguraI2c(int sda, int scl, int irq, int reset) {
  if (pn532 && pn532Bus == "I2C" && pn532Pins[0] == sda && pn532Pins[1] == scl && pn532Pins[2] == irq && pn532Pins[3] == reset) return;
  delete pn532;
#if defined(ARDUINO_ARCH_ESP32)
  Wire.begin(sda, scl);
  Wire.setTimeOut(25);
#else
  (void)sda; (void)scl; Wire.begin();
  Wire.setWireTimeout(25000, true);
#endif
  delay(100);
  pn532 = new Adafruit_PN532(irq, reset, &Wire);
  pn532Bus = "I2C"; pn532Pins[0] = sda; pn532Pins[1] = scl; pn532Pins[2] = irq; pn532Pins[3] = reset;
  pn532UidLength = 0; pn532AuthenticatedBlock = -1;
  bool pronto = false;
  for (uint8_t tentativo = 0; tentativo < 5 && !pronto; ++tentativo) {
    pronto = pn532Avvia();
#if !defined(ARDUINO_ARCH_ESP32)
    if (Wire.getWireTimeoutFlag()) { Wire.clearWireTimeoutFlag(); pronto = false; }
#endif
    if (!pronto && tentativo < 4) {
      Wire.end(); delay(100);
#if defined(ARDUINO_ARCH_ESP32)
      Wire.begin(sda, scl); Wire.setTimeOut(25);
#else
      Wire.begin(); Wire.setWireTimeout(25000, true);
#endif
      delay(100);
    }
  }
  if (!pronto) Serial.println("Errore: lettore PN532 non trovato");
}`

const pn532SpiHelpers = `void pn532ConfiguraSpi(int mosi, int miso, int sck, int ss) {
  if (pn532 && pn532Bus == "SPI" && pn532Pins[0] == mosi && pn532Pins[1] == miso && pn532Pins[2] == sck && pn532Pins[3] == ss) return;
  delete pn532;
#if defined(ARDUINO_ARCH_ESP32)
  SPI.begin(sck, miso, mosi, ss); pn532 = new Adafruit_PN532(ss, &SPI);
#else
  pn532 = new Adafruit_PN532(sck, miso, mosi, ss);
#endif
  pn532Bus = "SPI"; pn532Pins[0] = mosi; pn532Pins[1] = miso; pn532Pins[2] = sck; pn532Pins[3] = ss;
  pn532UidLength = 0; pn532AuthenticatedBlock = -1;
  if (!pn532Avvia()) Serial.println("Errore: lettore PN532 non trovato");
}`

const pn532PresentHelper = (withType: boolean): string => `bool pn532CercaTag() {
  if (!pn532) return false;
  pn532UidLength = 0;${withType ? ' pn532Sak = 0;' : ''} pn532AuthenticatedBlock = -1;
  if (!pn532->readPassiveTargetID(PN532_MIFARE_ISO14443A, pn532UidBytes, &pn532UidLength, 50)) return false;${withType ? '\n  // Adafruit-PN532 1.3.4 keeps the final SAK in this response buffer.\n  extern byte pn532_packetbuffer[];\n  pn532Sak = pn532_packetbuffer[11];' : ''}
  return true;
}`

const pn532UidHelper = `String pn532Uid() { return (pn532UidLength || pn532CercaTag()) ? rfidHexText(pn532UidBytes, pn532UidLength) : String(""); }`
const pn532TypeHelper = `String pn532Tipo() {
  if (!pn532UidLength && !pn532CercaTag()) return String("");
  if (pn532Sak == 0x09) return String("MIFARE Classic Mini");
  if (pn532Sak == 0x08) return String("likely MIFARE Classic 1K");
  if (pn532Sak == 0x18) return String("likely MIFARE Classic 4K");
  uint8_t command = 0x60; uint8_t version[8]; uint8_t versionLength = sizeof(version);
  const bool hasVersion = pn532->inListPassiveTarget() &&
    pn532->inDataExchange(&command, 1, version, &versionLength);
  if (hasVersion) {
    if (versionLength == 8 && version[0] == 0x00 && version[1] == 0x04 && version[7] == 0x03) {
      const uint8_t productType = version[2] & 0x0F;
      if (productType == 0x03) {
        if ((version[3] == 0x01 || version[3] == 0x02) && version[4] == 0x01 && version[5] == 0x00) {
          if (version[6] == 0x0B) return String("MIFARE Ultralight EV1 MF0UL11");
          if (version[6] == 0x0E) return String("MIFARE Ultralight EV1 MF0UL21");
        }
        return String("MIFARE Ultralight");
      }
      if (productType == 0x04) {
        if (version[3] == 0x02 && version[4] == 0x01 && version[5] == 0x00) {
          if (version[6] == 0x0F) return String("NTAG213");
          if (version[6] == 0x11) return String("NTAG215");
          if (version[6] == 0x13) return String("NTAG216");
        }
        return String("NTAG");
      }
    }
    return String("ISO14443A");
  }
  if (pn532Sak == 0x00) return String("likely MIFARE Ultralight or NTAG");
  return String("ISO14443A");
}`

const pn532AuthenticateHelper = `bool pn532Autentica(int block, const String &keyType, const String &keyText) {
  uint8_t key[6]; if (!pn532 || (!pn532UidLength && !pn532CercaTag()) || !rfidHex(keyText, key, 6)) return false;
  const bool ok = pn532->mifareclassic_AuthenticateBlock(pn532UidBytes, pn532UidLength, block, keyType == "B" ? 1 : 0, key);
  pn532AuthenticatedBlock = ok ? block : -1; return ok;
}`

const pn532ReadHelper = `String pn532Leggi(int block) {
  if ((!pn532UidLength && !pn532CercaTag()) || (pn532AuthenticatedBlock != block && !pn532Autentica(block, "A", "FFFFFFFFFFFF"))) return String("");
  uint8_t data[16]; return pn532->mifareclassic_ReadDataBlock(block, data) ? rfidHexText(data, 16) : String("");
}`

const pn532WriteHelper = `bool pn532Scrivi(int block, const String &dataText) {
  uint8_t data[16];
  return rfidHex(dataText, data, 16) && (pn532UidLength || pn532CercaTag()) &&
    (pn532AuthenticatedBlock == block || pn532Autentica(block, "A", "FFFFFFFFFFFF")) &&
    pn532->mifareclassic_WriteDataBlock(block, data);
}`

const rc522StateHelpers = `MFRC522 *rc522 = nullptr;
uint8_t rc522UidBytes[10];
uint8_t rc522UidLength = 0;
int rc522AuthenticatedBlock = -1;
int rc522Pins[5] = {-1, -1, -1, -1, -1};`

const rc522ConfigHelper = `void rc522Configura(int mosi, int miso, int sck, int ss, int reset) {
  if (rc522 && rc522Pins[0] == mosi && rc522Pins[1] == miso && rc522Pins[2] == sck && rc522Pins[3] == ss && rc522Pins[4] == reset) return;
  delete rc522;
#if defined(ARDUINO_ARCH_ESP32)
  SPI.begin(sck, miso, mosi, ss);
#else
  (void)mosi; (void)miso; (void)sck; SPI.begin();
#endif
  rc522 = new MFRC522(ss, reset); rc522->PCD_Init();
  rc522Pins[0] = mosi; rc522Pins[1] = miso; rc522Pins[2] = sck; rc522Pins[3] = ss; rc522Pins[4] = reset;
  rc522UidLength = 0; rc522AuthenticatedBlock = -1;
}`

const rc522PresentHelper = `bool rc522CercaTag() {
  if (!rc522 || !rc522->PICC_IsNewCardPresent() || !rc522->PICC_ReadCardSerial()) return false;
  rc522UidLength = rc522->uid.size; memcpy(rc522UidBytes, rc522->uid.uidByte, rc522UidLength);
  rc522AuthenticatedBlock = -1; return true;
}`

const rc522UidHelper = `String rc522Uid() { return (rc522UidLength || rc522CercaTag()) ? rfidHexText(rc522UidBytes, rc522UidLength) : String(""); }`
const rc522TypeHelper = `String rc522Tipo() { return (rc522UidLength || rc522CercaTag()) ? String(rc522->PICC_GetTypeName(rc522->PICC_GetType(rc522->uid.sak))) : String(""); }`

const rc522AuthenticateHelper = `bool rc522Autentica(int block, const String &keyType, const String &keyText) {
  uint8_t key[6]; if (!rc522 || (!rc522UidLength && !rc522CercaTag()) || !rfidHex(keyText, key, 6)) return false;
  MFRC522::MIFARE_Key rcKey; memcpy(rcKey.keyByte, key, 6);
  const bool ok = rc522->PCD_Authenticate(keyType == "B" ? MFRC522::PICC_CMD_MF_AUTH_KEY_B : MFRC522::PICC_CMD_MF_AUTH_KEY_A, block, &rcKey, &rc522->uid) == MFRC522::STATUS_OK;
  rc522AuthenticatedBlock = ok ? block : -1; return ok;
}`

const rc522ReadHelper = `String rc522Leggi(int block) {
  if ((!rc522UidLength && !rc522CercaTag()) || (rc522AuthenticatedBlock != block && !rc522Autentica(block, "A", "FFFFFFFFFFFF"))) return String("");
  uint8_t data[18]; uint8_t size = sizeof(data);
  return rc522->MIFARE_Read(block, data, &size) == MFRC522::STATUS_OK ? rfidHexText(data, 16) : String("");
}`

const rc522WriteHelper = `bool rc522Scrivi(int block, const String &dataText) {
  uint8_t data[16];
  return rfidHex(dataText, data, 16) && (rc522UidLength || rc522CercaTag()) &&
    (rc522AuthenticatedBlock == block || rc522Autentica(block, "A", "FFFFFFFFFFFF")) &&
    rc522->MIFARE_Write(block, data, 16) == MFRC522::STATUS_OK;
}`

const operationLines = (operation: ArduinoOperation): string[] => {
  if (operation.type === 'digital-write') {
    return [`digitalWrite(${operation.pin}, ${operation.level});`]
  }
  if (operation.type === 'pwm-write') return [`analogWrite(${operation.pin}, constrain(${operation.value}, 0, 255));`]
  if (operation.type === 'servo-write') return [
    `servo_${operation.pin}.write(${operation.angle});`,
    ...(operation.waitMilliseconds === undefined ? [] : [`delay(${operation.waitMilliseconds});`]),
  ]
  if (operation.type === 'delay') return [`delay(${operation.milliseconds});`]
  if (operation.type === 'custom-code') return operation.source.replace(/\r\n?/g, '\n').split('\n')
  if (operation.type === 'serial-begin') return [`Serial.begin(${operation.baud});`]
  if (operation.type === 'serial-print') {
    return [`Serial.${operation.newline ? 'println' : 'print'}(${operation.value});`]
  }
  if (operation.type === 'set-variable') return [`${operation.variable} = ${operation.value};`]
  if (operation.type === 'change-variable') return [`${operation.variable} += ${operation.value};`]
  if (operation.type === 'arduino-variable-set') return [`${operation.variable} = ${operation.value};`]
  if (operation.type === 'comment') {
    const source = operation.source.replace(/\r\n?/g, '\n')
    if (!operation.multiline) return [`// ${source.replace(/\n/g, ' ')}`]
    return ['/*', ...source.split('\n').map((line) => ` * ${line}`), ' */']
  }
  if (operation.type === 'pn532-config') return []
  if (operation.type === 'forever') {
    return ['while (true) {', ...operation.body.flatMap(operationLines).map((line) => `  ${line}`), '}']
  }
  return [
    `if (${operation.condition}) {`,
    ...operation.then.flatMap(operationLines).map((line) => `  ${line}`),
    ...(operation.otherwise.length ? [
      '} else {',
      ...operation.otherwise.flatMap(operationLines).map((line) => `  ${line}`),
    ] : []),
    '}',
  ]
}

export const generateArduinoSketch = (request: ArduinoSketchRequest): string => {
  const program = compileArduinoProgram(request)
  const pn532NeedsPresent = program.pn532Operations.size > 0
  const pn532NeedsAuthenticate = ['authenticate', 'read', 'write'].some(operation => program.pn532Operations.has(operation))
  const rc522NeedsPresent = program.rc522Operations.size > 0
  const rc522NeedsAuthenticate = ['authenticate', 'read', 'write'].some(operation => program.rc522Operations.has(operation))
  if (pn532NeedsPresent && !program.pn532Config) throw new Error('Configure PN532 before using its operations')
  if (rc522NeedsPresent && !program.rc522Config) throw new Error('Configure RC522 before using its operations')
  const usesRfidParse = ['authenticate', 'read', 'write'].some(operation =>
    program.pn532Operations.has(operation) || program.rc522Operations.has(operation))
  const usesRfidText = ['uid', 'read'].some(operation =>
    program.pn532Operations.has(operation) || program.rc522Operations.has(operation))
  const setupSerialInitializers = program.pn532Config ?
    program.setup.filter(operation => operation.type === 'serial-begin') : []
  const setupOperations = program.pn532Config ?
    program.setup.filter(operation => operation.type !== 'serial-begin') : program.setup
  const pn532Messages = request.messages || {
    pn532Found: 'PN532 reader found',
    pn532NotFound: 'Error: PN532 reader not found',
  }
  const pinModes = program.outputPins.map((pin) => `pinMode(${pin}, OUTPUT);`)
  const declarations = program.variables.map((variable) => `double ${variable} = 0;`)
  const typedDeclarations = program.typedVariables.map(({ type, name, value }) => `${type} ${name} = ${value};`)
  const dhtDeclarations = program.dhtSensors.map(({ model, pin }) =>
    `DHT sardu_dht_${model.toLowerCase()}_${pin}(${pin}, ${model});`)
  const dhtInitializers = program.dhtSensors.map(({ model, pin }) =>
    `sardu_dht_${model.toLowerCase()}_${pin}.begin();`)
  const servoDeclarations = program.servoPins.map((pin) => `Servo servo_${pin};`)
  const servoInitializers = program.servoPins.map((pin) => `servo_${pin}.attach(${pin});`)
  const ultrasonicDeclarations = program.ultrasonicSensors.map(({ trigger, echo }) =>
    `Ultrasonic ultrasonic_${trigger}_${echo}(${trigger}, ${echo});`)
  const neoPixelDeclarations = program.neoPixelPins.map(pin => `Adafruit_NeoPixel neopixel_${pin};`)
  const interruptFunctions = program.interrupts.flatMap((interrupt, index) => [
    `void sardu_interrupt_${index}() {`,
    indent(interrupt.body.flatMap(operationLines)),
    '}',
    '',
  ])
  const interruptInitializers = program.interrupts.map((interrupt, index) =>
    `attachInterrupt(digitalPinToInterrupt(${interrupt.pin}), sardu_interrupt_${index}, ${interrupt.mode});`)
  const touchDeclarations = program.touchEvents.map((_, index) => `bool sardu_touch_${index} = false;`)
  const touchInitializers = program.touchEvents.flatMap((event, index) => [`pinMode(${event.pin}, INPUT);`, `sardu_touch_${index} = digitalRead(${event.pin});`])
  const touchLoops = program.touchEvents.flatMap((event, index) => [
    `bool sardu_touch_now_${index} = digitalRead(${event.pin});`,
    `if (sardu_touch_now_${index} == ${event.level} && sardu_touch_${index} != ${event.level}) {`,
    ...event.body.flatMap(operationLines).map(line => `  ${line}`), '}',
    `sardu_touch_${index} = sardu_touch_now_${index};`,
  ])
  const pn532Declarations = program.pn532Config ? [
    ...(pn532NeedsPresent ? ['uint8_t pn532UidBytes[10];', 'uint8_t pn532UidLength = 0;'] : []),
    ...(program.pn532Operations.has('type') ? ['uint8_t pn532Sak = 0;'] : []),
    ...(pn532NeedsAuthenticate ? ['int pn532AuthenticatedBlock = -1;'] : []),
    ...(program.pn532Config.bus === 'I2C' ? [
      `Adafruit_PN532 pn532(${program.pn532Config.irq}, ${program.pn532Config.reset}, &Wire);`,
    ] : [
      '#if defined(ARDUINO_ARCH_ESP32)',
      `Adafruit_PN532 pn532(${program.pn532Config.ss}, &SPI);`,
      '#else',
      `Adafruit_PN532 pn532(${program.pn532Config.sck}, ${program.pn532Config.miso}, ${program.pn532Config.mosi}, ${program.pn532Config.ss});`,
      '#endif',
    ]),
  ] : []
  const pn532I2cBegin = program.pn532Config?.bus === 'I2C' ?
    (program.boardId.startsWith('esp32-') ?
      [`Wire.begin(${program.pn532Config.sda}, ${program.pn532Config.scl});`, 'Wire.setTimeOut(25);'] :
      ['Wire.begin();', 'Wire.setWireTimeout(25000, true);']) : []
  const pn532Initializers = program.pn532Config ?
    (program.pn532Config.bus === 'I2C' ? [
      ...pn532I2cBegin,
      'delay(100);',
      'bool pn532Pronto = false;',
      'for (uint8_t pn532Tentativo = 0; pn532Tentativo < 5 && !pn532Pronto; ++pn532Tentativo) {',
      '  pn532.begin();',
      '  pn532Pronto = pn532.getFirmwareVersion();',
      ...(program.boardId.startsWith('esp32-') ? [] : [
        '  if (Wire.getWireTimeoutFlag()) { Wire.clearWireTimeoutFlag(); pn532Pronto = false; }',
      ]),
      '  if (pn532Pronto) { pn532.SAMConfig(); break; }',
      '  if (pn532Tentativo < 4) {',
      '    Wire.end();',
      '    delay(100);',
      ...pn532I2cBegin.map(line => `    ${line}`),
      '    delay(100);',
      '  }',
      '}',
      ...(setupSerialInitializers.length ? [
        'if (pn532Pronto) {',
        `  Serial.println(${JSON.stringify(pn532Messages.pn532Found)});`,
        '} else {',
        `  Serial.println(${JSON.stringify(pn532Messages.pn532NotFound)});`,
        '}',
      ] : []),
    ] : [
      ...(program.boardId.startsWith('esp32-') ?
        [`SPI.begin(${program.pn532Config.sck}, ${program.pn532Config.miso}, ${program.pn532Config.mosi}, ${program.pn532Config.ss});`] : []),
      'pn532.begin();',
      ...(setupSerialInitializers.length ? [
        'if (!pn532.getFirmwareVersion()) {',
        `  Serial.println(${JSON.stringify(pn532Messages.pn532NotFound)});`,
        '} else {',
        '  pn532.SAMConfig();',
        `  Serial.println(${JSON.stringify(pn532Messages.pn532Found)});`,
        '}',
      ] : [
        'if (pn532.getFirmwareVersion()) {',
        '  pn532.SAMConfig();',
        '}',
      ]),
    ]) : []
  const rc522Declarations = program.rc522Config ? [
    ...(rc522NeedsPresent ? ['uint8_t rc522UidBytes[10];', 'uint8_t rc522UidLength = 0;'] : []),
    ...(rc522NeedsAuthenticate ? ['int rc522AuthenticatedBlock = -1;'] : []),
    `MFRC522 rc522(${program.rc522Config.ss}, ${program.rc522Config.reset});`,
  ] : []
  const rc522Initializers = program.rc522Config ? [
    ...(program.boardId.startsWith('esp32-') ?
      [`SPI.begin(${program.rc522Config.sck}, ${program.rc522Config.miso}, ${program.rc522Config.mosi}, ${program.rc522Config.ss});`] : ['SPI.begin();']),
    'rc522.PCD_Init();',
  ] : []
  const hasTopLevelPn532Config = setupOperations.some(operation => operation.type === 'pn532-config')
  let pn532Initialized = false
  const setupOperationLines = setupOperations.flatMap(operation => {
    if (operation.type === 'pn532-config') {
      if (pn532Initialized) return []
      pn532Initialized = true
      return pn532Initializers
    }
    return operationLines(operation)
  })
  const offlinePn532Helper = (source: string): string => source
    .replace(/pn532->/g, 'pn532.')
    .replace('  if (!pn532) return false;\n', '')
    .replace('if (!pn532 || ', 'if (')
  const offlineRc522Helper = (source: string): string => source
    .replace(/rc522->/g, 'rc522.')
    .replace('if (!rc522 || ', 'if (')
  const pn532Present = offlinePn532Helper(pn532PresentHelper(program.pn532Operations.has('type'))).replace(
    `  pn532UidLength = 0;${program.pn532Operations.has('type') ? ' pn532Sak = 0;' : ''} pn532AuthenticatedBlock = -1;`,
    `  pn532UidLength = 0;${program.pn532Operations.has('type') ? ' pn532Sak = 0;' : ''}${pn532NeedsAuthenticate ? ' pn532AuthenticatedBlock = -1;' : ''}`,
  )
  const rc522Present = offlineRc522Helper(rc522PresentHelper).replace(
    '  rc522AuthenticatedBlock = -1; return true;',
    `  ${rc522NeedsAuthenticate ? 'rc522AuthenticatedBlock = -1; ' : ''}return true;`,
  )

  return [
    '// Generated by SARDU Edu - davide@sardu.pro',
    `// Board: ${program.boardName}`,
    '',
    ...(program.dhtSensors.length ? ['#include <DHT.h>', ''] : []),
    ...(program.servoPins.length ? ['#include <Servo.h>', ''] : []),
    ...(program.ultrasonicSensors.length ? ['#include <Ultrasonic.h>', ''] : []),
    ...(program.usesVl53l0x ? ['#include <Wire.h>', '#include <VL53L0X.h>', '', 'VL53L0X vl53l0x;', ''] : []),
    ...(program.neoPixelPins.length ? ['#include <Adafruit_NeoPixel.h>', ''] : []),
    ...(program.usesOtto ? ['#include <Otto.h>', '', 'Otto Otto;', ''] : []),
    ...(program.usesWifi ? ['#include <WiFi.h>', ''] : []),
    ...(program.usesPn532I2c ? ['#include <Wire.h>'] : []),
    ...(program.usesPn532Spi || program.usesRc522 ? ['#include <SPI.h>'] : []),
    ...(program.usesPn532 ? ['#include <Adafruit_PN532.h>'] : []),
    ...(program.usesRc522 ? ['#include <MFRC522.h>'] : []),
    ...(usesRfidParse ? ['', rfidParseHelper] : []),
    ...(usesRfidText ? ['', rfidTextHelper] : []),
    ...(pn532Declarations.length ? ['', ...pn532Declarations] : []),
    ...(pn532NeedsPresent ? ['', pn532Present] : []),
    ...(program.pn532Operations.has('uid') ? ['', offlinePn532Helper(pn532UidHelper)] : []),
    ...(program.pn532Operations.has('type') ? ['', offlinePn532Helper(pn532TypeHelper)] : []),
    ...(pn532NeedsAuthenticate ? ['', offlinePn532Helper(pn532AuthenticateHelper)] : []),
    ...(program.pn532Operations.has('read') ? ['', offlinePn532Helper(pn532ReadHelper)] : []),
    ...(program.pn532Operations.has('write') ? ['', offlinePn532Helper(pn532WriteHelper)] : []),
    ...(rc522Declarations.length ? ['', ...rc522Declarations] : []),
    ...(rc522NeedsPresent ? ['', rc522Present] : []),
    ...(program.rc522Operations.has('uid') ? ['', offlineRc522Helper(rc522UidHelper)] : []),
    ...(program.rc522Operations.has('type') ? ['', offlineRc522Helper(rc522TypeHelper)] : []),
    ...(rc522NeedsAuthenticate ? ['', offlineRc522Helper(rc522AuthenticateHelper)] : []),
    ...(program.rc522Operations.has('read') ? ['', offlineRc522Helper(rc522ReadHelper)] : []),
    ...(program.rc522Operations.has('write') ? ['', offlineRc522Helper(rc522WriteHelper)] : []),
    ...(program.usesRfid ? [''] : []),
    ...dhtDeclarations,
    ...(dhtDeclarations.length ? [''] : []),
    ...servoDeclarations,
    ...(servoDeclarations.length ? [''] : []),
    ...ultrasonicDeclarations,
    ...(ultrasonicDeclarations.length ? [''] : []),
    ...neoPixelDeclarations,
    ...(neoPixelDeclarations.length ? [''] : []),
    ...declarations,
    ...(declarations.length ? [''] : []),
    ...typedDeclarations,
    ...(typedDeclarations.length ? [''] : []),
    ...touchDeclarations,
    ...(touchDeclarations.length ? [''] : []),
    ...interruptFunctions,
    'void setup() {',
    indent([...pinModes, ...dhtInitializers, ...servoInitializers,
      ...(program.usesVl53l0x ? ['Wire.begin();', 'vl53l0x.setTimeout(500);', 'vl53l0x.init();'] : []),
      ...interruptInitializers, ...touchInitializers,
      ...setupSerialInitializers.flatMap(operationLines),
      ...(!hasTopLevelPn532Config ? pn532Initializers : []),
      ...rc522Initializers,
      ...setupOperationLines]),
    '}',
    '',
    'void loop() {',
    indent([...program.loop.flatMap(operationLines), ...touchLoops]),
    '}',
    '',
  ].join('\n')
}

export const generateSarduLiveFirmware = (): string => `// SARDU Edu Live firmware - davide@sardu.pro
// Original serial protocol implementation for SARDU Edu boards.

#include <DHT.h>
#if !defined(ARDUINO_ARCH_ESP32)
#include <Otto.h>
#include <Servo.h>
#endif
#include <Wire.h>
#include <VL53L0X.h>
#include <Adafruit_NeoPixel.h>
#include <SPI.h>
#include <Adafruit_PN532.h>
#include <MFRC522.h>

${rfidParseHelper}

${rfidTextHelper}

${pn532StateHelpers}

${pn532I2cHelpers}

${pn532SpiHelpers}

${pn532PresentHelper(true)}

${pn532UidHelper}

${pn532TypeHelper}

${pn532AuthenticateHelper}

${pn532ReadHelper}

${pn532WriteHelper}

${rc522StateHelpers}

${rc522ConfigHelper}

${rc522PresentHelper}

${rc522UidHelper}

${rc522TypeHelper}

${rc522AuthenticateHelper}

${rc522ReadHelper}

${rc522WriteHelper}

const unsigned long SARDU_BAUD_RATE = 115200;
#if !defined(ARDUINO_ARCH_ESP32)
Servo sardu_servos[14];
bool sardu_servo_attached[14] = {false};
Otto Otto;
#endif
VL53L0X sardu_vl53l0x;
bool sardu_vl53l0x_ready = false;
Adafruit_NeoPixel *sardu_neopixels[14] = {nullptr};

void setup() {
  Serial.begin(SARDU_BAUD_RATE);
  Serial.setTimeout(50);
  Wire.begin();
}

void loop() {
  if (!Serial.available()) return;

  const char command = Serial.read();
  if (command == 'W') {
    const int pin = Serial.parseInt();
    const int level = Serial.parseInt();
    pinMode(pin, OUTPUT);
    digitalWrite(pin, level ? HIGH : LOW);
#if !defined(ARDUINO_ARCH_ESP32)
  } else if (command == 'S') {
    const int pin = Serial.parseInt();
    const int angle = constrain(Serial.parseInt(), 0, 180);
    if (pin >= 0 && pin < 14) {
      if (!sardu_servo_attached[pin]) {
        sardu_servos[pin].attach(pin);
        sardu_servo_attached[pin] = true;
      }
      sardu_servos[pin].write(angle);
    }
  } else if (command == 'R') {
    const int pin = Serial.parseInt();
    if (pin >= 0 && pin < 14) {
      if (!sardu_servo_attached[pin]) {
        sardu_servos[pin].attach(pin);
        sardu_servo_attached[pin] = true;
      }
      Serial.println(sardu_servos[pin].read());
    } else {
      Serial.println(0);
    }
#endif
  } else if (command == 'H') {
    const int triggerPin = Serial.parseInt();
    const int echoPin = Serial.parseInt();
    Serial.read();
    const char unit = Serial.read();
    pinMode(triggerPin, OUTPUT);
    pinMode(echoPin, INPUT);
    digitalWrite(triggerPin, LOW);
    delayMicroseconds(2);
    digitalWrite(triggerPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(triggerPin, LOW);
    float distance = pulseIn(echoPin, HIGH, 30000UL) * 0.0343 / 2.0;
    if (unit == 'I') distance /= 2.54;
    Serial.println(distance);
  } else if (command == 'D') {
    const int model = Serial.parseInt();
    const int pin = Serial.parseInt();
    Serial.read();
    const char measurement = Serial.read();
    DHT sensor(pin, model == 22 ? DHT22 : DHT11);
    sensor.begin();
    const float value = measurement == 'H' ? sensor.readHumidity() : sensor.readTemperature();
    Serial.println(value);
  } else if (command == 'V') {
    const int pin = Serial.parseInt(); pinMode(pin, INPUT); Serial.println(digitalRead(pin));
  } else if (command == 'A') {
    Serial.println(analogRead(Serial.parseInt()));
  } else if (command == 'T') {
    const int pin = Serial.parseInt(); const int frequency = Serial.parseInt(); const long duration = Serial.parseInt();
    tone(pin, frequency, duration); delay(duration); Serial.println(1);
#if !defined(ARDUINO_ARCH_ESP32)
  } else if (command == 'O') {
    while (Serial.peek() == ' ') Serial.read(); const char action = Serial.read();
    if (action == 'I') Otto.init(Serial.parseInt(), Serial.parseInt(), Serial.parseInt(), Serial.parseInt(), true, Serial.parseInt());
    else if (action == 'H') Otto.home();
    else if (action == 'M') {
      while (Serial.peek() == ' ') Serial.read(); const String name = Serial.readStringUntil(' '); const float steps = Serial.parseFloat(); const int duration = Serial.parseInt();
      if (name == "walk-forward") Otto.walk(steps, duration, FORWARD); else if (name == "walk-backward") Otto.walk(steps, duration, BACKWARD);
      else if (name == "turn-left") Otto.turn(steps, duration, LEFT); else if (name == "turn-right") Otto.turn(steps, duration, RIGHT);
      else if (name == "bend-left") Otto.bend(steps, duration, LEFT); else if (name == "bend-right") Otto.bend(steps, duration, RIGHT);
      else if (name == "shake-left") Otto.shakeLeg(steps, duration, LEFT); else if (name == "shake-right") Otto.shakeLeg(steps, duration, RIGHT); else Otto.jump(steps, duration);
    } else if (action == 'D') {
      while (Serial.peek() == ' ') Serial.read(); const String name = Serial.readStringUntil(' '); const float steps = Serial.parseFloat(); const int duration = Serial.parseInt(); const int height = Serial.parseInt();
      if (name == "moonwalker-left") Otto.moonwalker(steps,duration,height,LEFT); else if (name == "moonwalker-right") Otto.moonwalker(steps,duration,height,RIGHT);
      else if (name == "crusaito-forward") Otto.crusaito(steps,duration,height,FORWARD); else if (name == "crusaito-backward") Otto.crusaito(steps,duration,height,BACKWARD);
      else if (name == "flapping-forward") Otto.flapping(steps,duration,height,FORWARD); else if (name == "flapping-backward") Otto.flapping(steps,duration,height,BACKWARD);
      else if (name == "swing") Otto.swing(steps,duration,height); else if (name == "tiptoe-swing") Otto.tiptoeSwing(steps,duration,height);
      else if (name == "jitter") Otto.jitter(steps,duration,height); else if (name == "updown") Otto.updown(steps,duration,height); else Otto.ascendingTurn(steps,duration,height);
    } else if (action == 'S') { while (Serial.peek() == ' ') Serial.read(); Otto.sing(Serial.readStringUntil('\n').toInt()); }
    else if (action == 'B') Otto._tone(Serial.parseFloat(), Serial.parseInt(), Serial.parseInt());
    else if (action == 'G') { while (Serial.peek() == ' ') Serial.read(); Otto.playGesture(Serial.readStringUntil('\n').toInt()); }
    Serial.println(1);
#endif
  } else if (command == 'L') {
    while (Serial.peek() == ' ') Serial.read(); const char unit = Serial.read();
    if (!sardu_vl53l0x_ready) { sardu_vl53l0x.setTimeout(500); sardu_vl53l0x_ready = sardu_vl53l0x.init(); }
    const uint16_t distance = sardu_vl53l0x_ready ? sardu_vl53l0x.readRangeSingleMillimeters() : 0;
    Serial.println(unit == 'C' ? distance / 10 : distance);
  } else if (command == 'N') {
    while (Serial.peek() == ' ') Serial.read(); const char action = Serial.read(); const int pin = Serial.parseInt();
    if (pin >= 0 && pin < 14 && action == 'C') {
      const int count = max(1, Serial.parseInt()); delete sardu_neopixels[pin];
      sardu_neopixels[pin] = new Adafruit_NeoPixel(count, pin, NEO_GRB + NEO_KHZ800); sardu_neopixels[pin]->begin();
    } else if (pin >= 0 && pin < 14 && sardu_neopixels[pin]) {
      Adafruit_NeoPixel &strip = *sardu_neopixels[pin];
      if (action == 'R') { const int pixel=Serial.parseInt(); strip.setPixelColor(pixel, Serial.parseInt(), Serial.parseInt(), Serial.parseInt()); }
      else if (action == 'H') { const int pixel=Serial.parseInt(); const long hue=Serial.parseInt(); const int sat=Serial.parseInt(); const int value=Serial.parseInt(); strip.setPixelColor(pixel, strip.ColorHSV((uint16_t)(constrain(hue,0,360)*65535.0/360.0), map(constrain(sat,0,100),0,100,0,255), map(constrain(value,0,100),0,100,0,255))); }
      else if (action == 'F' || action == 'G') { const int first=Serial.parseInt(); const int last=Serial.parseInt(); uint32_t color; if (action == 'F') color=strip.Color(Serial.parseInt(),Serial.parseInt(),Serial.parseInt()); else { const long hue=Serial.parseInt(); const int sat=Serial.parseInt(); const int value=Serial.parseInt(); color=strip.ColorHSV((uint16_t)(constrain(hue,0,360)*65535.0/360.0),map(constrain(sat,0,100),0,100,0,255),map(constrain(value,0,100),0,100,0,255)); } for(int i=first;i<=last;i++) strip.setPixelColor(i,color); }
      else if (action == 'B') strip.setBrightness(map(constrain(Serial.parseInt(),0,100),0,100,0,255));
      else if (action == 'X') strip.clear();
      else if (action == 'S') strip.show();
      else if (action == 'W') { const long hue=Serial.parseInt(); strip.rainbow((uint16_t)(constrain(hue,0,360)*65535.0/360.0), Serial.parseInt()); strip.show(); }
      else if (action == 'O' || action == 'T') { int steps=Serial.parseInt(); while(steps>0){uint32_t edge=strip.getPixelColor(strip.numPixels()-1);for(int i=strip.numPixels()-1;i>0;i--)strip.setPixelColor(i,strip.getPixelColor(i-1));strip.setPixelColor(0,action=='O'?edge:0);steps--;} while(steps<0){uint32_t edge=strip.getPixelColor(0);for(uint16_t i=0;i+1<strip.numPixels();i++)strip.setPixelColor(i,strip.getPixelColor(i+1));strip.setPixelColor(strip.numPixels()-1,action=='O'?edge:0);steps++;} }
    }
    Serial.println(1);
  } else if (command == 'F') {
    while (Serial.peek() == ' ') Serial.read(); const String reader = Serial.readStringUntil(' ');
    const String bus = Serial.readStringUntil(' ');
    const int sda = Serial.parseInt(); const int scl = Serial.parseInt();
    const int mosi = Serial.parseInt(); const int miso = Serial.parseInt(); const int sck = Serial.parseInt();
    const int ss = Serial.parseInt(); const int irq = Serial.parseInt(); const int reset = Serial.parseInt();
    while (Serial.peek() == ' ') Serial.read(); const char action = Serial.read();
    if (reader == "PN532") {
      if (bus == "SPI") pn532ConfiguraSpi(mosi, miso, sck, ss); else pn532ConfiguraI2c(sda, scl, irq, reset);
      if (action == 'P') Serial.println(pn532CercaTag() ? 1 : 0);
      else if (action == 'U') Serial.println(pn532Uid());
      else if (action == 'T') Serial.println(pn532Tipo());
      else if (action == 'R') Serial.println(pn532Leggi(Serial.parseInt()));
      else if (action == 'A') { const int block=Serial.parseInt(); while(Serial.peek()==' ')Serial.read(); const String keyType=Serial.readStringUntil(' '); const String key=Serial.readStringUntil('\n'); Serial.println(pn532Autentica(block,keyType,key)?1:0); }
      else if (action == 'W') { const int block=Serial.parseInt(); while(Serial.peek()==' ')Serial.read(); const String data=Serial.readStringUntil('\n'); Serial.println(pn532Scrivi(block,data)?1:0); }
      else Serial.println(0);
    } else if (reader == "RC522" && bus == "SPI") {
      rc522Configura(mosi, miso, sck, ss, reset);
      if (action == 'P') Serial.println(rc522CercaTag() ? 1 : 0);
      else if (action == 'U') Serial.println(rc522Uid());
      else if (action == 'T') Serial.println(rc522Tipo());
      else if (action == 'R') Serial.println(rc522Leggi(Serial.parseInt()));
      else if (action == 'A') { const int block=Serial.parseInt(); while(Serial.peek()==' ')Serial.read(); const String keyType=Serial.readStringUntil(' '); const String key=Serial.readStringUntil('\n'); Serial.println(rc522Autentica(block,keyType,key)?1:0); }
      else if (action == 'W') { const int block=Serial.parseInt(); while(Serial.peek()==' ')Serial.read(); const String data=Serial.readStringUntil('\n'); Serial.println(rc522Scrivi(block,data)?1:0); }
      else Serial.println(0);
    }
    else Serial.println(0);
  } else if (command == 'P') {
    Serial.println("SARDU-LIVE 5");
  } else if (command == 'M') {
    Serial.println(millis());
  } else if (command == 'U') {
    Serial.println(micros());
  }
  while (Serial.available()) Serial.read();
}
`
