import { describe, expect, test } from 'vitest'
import { HardwareCatalog } from '../src/catalog'

describe('HardwareCatalog', () => {
  const definition = { id: 'board-a', name: 'Board A', version: '1' }

  test('lists and retrieves definitions', () => {
    const catalog = new HardwareCatalog([definition])

    expect(catalog.has(definition.id)).toBe(true)
    expect(catalog.get(definition.id)).toBe(definition)
    expect(catalog.list()).toEqual([definition])
  })

  test('rejects duplicate identifiers', () => {
    expect(() => new HardwareCatalog([definition, definition])).toThrow('Duplicate hardware definition: board-a')
  })
})
