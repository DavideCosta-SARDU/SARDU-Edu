import type { DefinitionCatalog, VersionedDefinition } from './contracts'

export class HardwareCatalog<T extends VersionedDefinition> implements DefinitionCatalog<T> {
  readonly #definitions: Map<string, T>

  constructor(definitions: readonly T[] = []) {
    this.#definitions = new Map()
    definitions.forEach((definition) => {
      if (this.#definitions.has(definition.id)) {
        throw new Error(`Duplicate hardware definition: ${definition.id}`)
      }
      this.#definitions.set(definition.id, definition)
    })
  }

  get(id: string): T | undefined {
    return this.#definitions.get(id)
  }

  has(id: string): boolean {
    return this.#definitions.has(id)
  }

  list(): readonly T[] {
    return Array.from(this.#definitions.values())
  }
}
