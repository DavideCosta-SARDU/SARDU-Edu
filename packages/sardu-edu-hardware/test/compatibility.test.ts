import { describe, expect, test } from 'vitest'
import { HardwareCatalog } from '../src/catalog'
import { checkCompatibility } from '../src/compatibility'
import type { HardwareDefinitions } from '../src/contracts'

const definitions: HardwareDefinitions = {
  backends: new HardwareCatalog([
    {
      id: 'backend-a',
      name: 'Backend A',
      version: '1',
      language: 'Language A',
      modes: ['standalone'],
    },
  ]),
  boards: new HardwareCatalog([
    {
      id: 'board-a',
      name: 'Board A',
      version: '1',
      backendIds: ['backend-a'],
      capabilities: ['digital-output'],
      modes: ['standalone'],
    },
  ]),
  components: new HardwareCatalog([
    {
      id: 'component-a',
      name: 'Component A',
      version: '1',
      boardIds: ['board-a'],
      backendIds: ['backend-a'],
      requiredCapabilities: ['digital-output'],
      modes: ['standalone'],
    },
  ]),
  robots: new HardwareCatalog([]),
}

describe('checkCompatibility', () => {
  test('accepts a compatible selection', () => {
    expect(
      checkCompatibility(definitions, {
        boardId: 'board-a',
        backendId: 'backend-a',
        componentIds: ['component-a'],
        mode: 'standalone',
      }),
    ).toEqual([])
  })

  test('reports unknown definitions', () => {
    expect(
      checkCompatibility(definitions, {
        boardId: 'missing-board',
        backendId: 'backend-a',
        mode: 'standalone',
      }),
    ).toEqual([{ code: 'unknown-board', definitionId: 'missing-board' }])
  })
})
