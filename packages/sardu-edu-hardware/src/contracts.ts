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
  readonly backendId: string
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
