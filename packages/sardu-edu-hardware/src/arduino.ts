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
]

export const ARDUINO_COMPONENTS: readonly ComponentDefinition[] = [{
  id: 'dht11-dht22',
  name: 'DHT11/DHT22',
  version: '1',
  boardIds: ['arduino-uno', 'arduino-nano'],
  backendIds: [ARDUINO_BACKEND.id],
  requiredCapabilities: ['digital-io'],
  modes: ['standalone'],
}]

export const ARDUINO_HARDWARE_DEFINITIONS: HardwareDefinitions = {
  backends: new HardwareCatalog<BackendDefinition>([ARDUINO_BACKEND]),
  boards: new HardwareCatalog<ArduinoBoardDefinition>(ARDUINO_BOARDS),
  components: new HardwareCatalog<ComponentDefinition>(ARDUINO_COMPONENTS),
  robots: new HardwareCatalog<RobotDefinition>(),
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
}

export type ArduinoOperation =
  | { readonly type: 'digital-write'; readonly pin: string; readonly level: 'HIGH' | 'LOW' }
  | { readonly type: 'pwm-write'; readonly pin: string; readonly value: string }
  | { readonly type: 'delay'; readonly milliseconds: number | string }
  | { readonly type: 'custom-code'; readonly source: string }
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
  readonly outputPins: readonly string[]
  readonly variables: readonly string[]
  readonly typedVariables: readonly { readonly type: string; readonly name: string; readonly value: string }[]
  readonly interrupts: readonly { readonly pin: string; readonly mode: string; readonly body: readonly ArduinoOperation[] }[]
  readonly setup: readonly ArduinoOperation[]
  readonly loop: readonly ArduinoOperation[]
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

const getDhtModel = (block: ArduinoSourceBlock): string => block.fields.MODEL?.value || 'DHT21'
const getDhtObjectName = (block: ArduinoSourceBlock): string =>
  `sardu_dht_${getDhtModel(block).toLowerCase()}_${getField(block, 'PIN')}`

const arduinoTypes = new Set([
  'bool', 'byte', 'int', 'unsigned int', 'long', 'unsigned long', 'float', 'double', 'char', 'String',
])

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
    Object.values(block.inputs).forEach((input) => {
      if (input?.block) collectDhtPins(blocks, input.block, board, sensors, visited)
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
  const variables = new Set<string>()
  const typedVariables = new Map<string, { readonly type: string; readonly name: string; readonly value: string }>()
  const interrupts: { readonly pin: string; readonly mode: string; readonly body: readonly ArduinoOperation[] }[] = []
  const programBlocks = targets.flatMap(({ blocks }) =>
    Object.values(blocks)
      .filter((block): block is ArduinoSourceBlock =>
        Boolean(block?.topLevel && block.opcode === 'sarduBoard_program'))
      .map((block) => ({ block, blocks })),
  )

  if (programBlocks.length > 1) throw new Error('Only one Arduino program block is allowed')

  const program = programBlocks[0]
  if (program) {
    collectDhtPins(program.blocks, program.block.inputs.SUBSTACK?.block ?? null, board, dhtSensors)
    collectDhtPins(program.blocks, program.block.inputs.SUBSTACK2?.block ?? null, board, dhtSensors)
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
      collectDhtPins(blocks, block.inputs.SUBSTACK?.block ?? null, board, dhtSensors)
      interrupts.push({
        pin,
        mode,
        body: generateStack(blocks, block.inputs.SUBSTACK?.block ?? null, board, outputPins, variables, typedVariables),
      })
    })
  })

  return {
    boardId,
    boardName: board.name,
    dhtSensors: Array.from(dhtSensors.values()).sort((left, right) =>
      `${left.model}:${left.pin}`.localeCompare(`${right.model}:${right.pin}`, undefined, { numeric: true })),
    outputPins: Array.from(outputPins).sort((left, right) => left.localeCompare(right, undefined, { numeric: true })),
    variables: Array.from(variables).sort(),
    typedVariables: Array.from(typedVariables.values()).sort((left, right) => left.name.localeCompare(right.name)),
    interrupts: interrupts.sort((left, right) => left.pin.localeCompare(right.pin, undefined, { numeric: true })),
    setup,
    loop,
  }
}

const operationLines = (operation: ArduinoOperation): string[] => {
  if (operation.type === 'digital-write') {
    return [`digitalWrite(${operation.pin}, ${operation.level});`]
  }
  if (operation.type === 'pwm-write') return [`analogWrite(${operation.pin}, constrain(${operation.value}, 0, 255));`]
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
  const pinModes = program.outputPins.map((pin) => `pinMode(${pin}, OUTPUT);`)
  const declarations = program.variables.map((variable) => `double ${variable} = 0;`)
  const typedDeclarations = program.typedVariables.map(({ type, name, value }) => `${type} ${name} = ${value};`)
  const dhtDeclarations = program.dhtSensors.map(({ model, pin }) =>
    `DHT sardu_dht_${model.toLowerCase()}_${pin}(${pin}, ${model});`)
  const dhtInitializers = program.dhtSensors.map(({ model, pin }) =>
    `sardu_dht_${model.toLowerCase()}_${pin}.begin();`)
  const interruptFunctions = program.interrupts.flatMap((interrupt, index) => [
    `void sardu_interrupt_${index}() {`,
    indent(interrupt.body.flatMap(operationLines)),
    '}',
    '',
  ])
  const interruptInitializers = program.interrupts.map((interrupt, index) =>
    `attachInterrupt(digitalPinToInterrupt(${interrupt.pin}), sardu_interrupt_${index}, ${interrupt.mode});`)

  return [
    '// Generated by SARDU Edu - davide@sardu.pro',
    `// Board: ${program.boardName}`,
    '',
    ...(program.dhtSensors.length ? ['#include <DHT.h>', ''] : []),
    ...dhtDeclarations,
    ...(dhtDeclarations.length ? [''] : []),
    ...declarations,
    ...(declarations.length ? [''] : []),
    ...typedDeclarations,
    ...(typedDeclarations.length ? [''] : []),
    ...interruptFunctions,
    'void setup() {',
    indent([...pinModes, ...dhtInitializers, ...interruptInitializers, ...program.setup.flatMap(operationLines)]),
    '}',
    '',
    'void loop() {',
    indent(program.loop.flatMap(operationLines)),
    '}',
    '',
  ].join('\n')
}

export const generateSarduLiveFirmware = (): string => `// SARDU Edu Live firmware - davide@sardu.pro
// Original serial protocol implementation for Arduino Uno and Nano.

const unsigned long SARDU_BAUD_RATE = 115200;

void setup() {
  Serial.begin(SARDU_BAUD_RATE);
  Serial.setTimeout(50);
}

void loop() {
  if (!Serial.available()) return;

  const char command = Serial.read();
  if (command == 'W') {
    const int pin = Serial.parseInt();
    const int level = Serial.parseInt();
    pinMode(pin, OUTPUT);
    digitalWrite(pin, level ? HIGH : LOW);
  } else if (command == 'P') {
    Serial.println("SARDU-LIVE 1");
  } else if (command == 'M') {
    Serial.println(millis());
  } else if (command == 'U') {
    Serial.println(micros());
  }
  while (Serial.available()) Serial.read();
}
`
