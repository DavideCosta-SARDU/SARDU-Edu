export type HardwareMode = 'realtime' | 'standalone'

export interface VersionedDefinition {
  readonly id: string
  readonly name: string
  readonly version: string
}

export interface BackendDefinition extends VersionedDefinition {
  readonly language: string
  readonly modes: readonly HardwareMode[]
}

export interface BoardDefinition extends VersionedDefinition {
  readonly backendIds: readonly string[]
  readonly capabilities: readonly string[]
  readonly modes: readonly HardwareMode[]
}

export type PinCapability = 'digital-input' | 'digital-output' | 'analog-input' | 'pwm'

export interface BoardPinDefinition {
  readonly id: string
  readonly capabilities: readonly PinCapability[]
}

export type BoardBusType = 'i2c' | 'spi' | 'uart'

export interface BoardBusDefinition {
  readonly id: string
  readonly type: BoardBusType
  readonly signals: Readonly<Record<string, string>>
}

export interface ArduinoBoardDefinition extends BoardDefinition {
  readonly fqbn: string
  readonly processor: string
  readonly operatingVoltage: number
  readonly pins: readonly BoardPinDefinition[]
  readonly buses: readonly BoardBusDefinition[]
}

export interface ComponentDefinition extends VersionedDefinition {
  readonly boardIds: readonly string[]
  readonly backendIds: readonly string[]
  readonly requiredCapabilities: readonly string[]
  readonly modes: readonly HardwareMode[]
}

export interface RobotDefinition extends VersionedDefinition {
  readonly boardId: string
  readonly backendIds: readonly string[]
  readonly componentIds: readonly string[]
  readonly modes: readonly HardwareMode[]
}

export interface HardwareSelection {
  readonly boardId: string
  readonly boardVersion?: string
  readonly backendId: string
  readonly backendVersion?: string
  readonly componentIds?: readonly string[]
  readonly robotId?: string
  readonly mode: HardwareMode
}

export interface HardwareDefinitions {
  readonly backends: DefinitionCatalog<BackendDefinition>
  readonly boards: DefinitionCatalog<BoardDefinition>
  readonly components: DefinitionCatalog<ComponentDefinition>
  readonly robots: DefinitionCatalog<RobotDefinition>
}

export interface DefinitionCatalog<T extends VersionedDefinition> {
  get(id: string): T | undefined
  has(id: string): boolean
  list(): readonly T[]
}
