import { describe, expect, test } from 'vitest'
import { parseHardwareResourceManifest } from '../src/resource-manifest'

const manifest = {
  schemaVersion: 1,
  arduinoCli: {
    version: '1.5.1',
    source: 'https://example.test/cli',
    license: 'GPL-3.0-only',
    archive: 'arduino-cli.zip',
    checksumsUrl: 'https://example.test/checksums',
    url: 'https://example.test/archive',
  },
  platforms: [{ id: 'arduino:avr', version: '1.8.6', source: 'https://example.test/avr', license: 'mixed' }],
  libraries: [],
  drivers: [
    {
      id: 'wch-ch341',
      version: 'snapshot',
      source: 'https://example.test/driver',
      license: 'vendor terms',
      archive: 'driver.zip',
      url: 'https://example.test/driver.zip',
    },
  ],
  builtinTools: [
    {
      id: 'serial-discovery',
      version: '1.5.2',
      source: 'https://example.test/index',
      license: 'GPL-3.0-only',
      executable: 'serial-discovery.exe',
    },
  ],
}

describe('hardware resource manifest', () => {
  test('validates versioned toolchain resources and extension lists', () => {
    expect(parseHardwareResourceManifest(manifest)).toEqual(manifest)
  })

  test('rejects incomplete resource entries at the manifest boundary', () => {
    expect(() => parseHardwareResourceManifest({ ...manifest, drivers: [{ id: 'driver' }] })).toThrow(
      'drivers[0].version must be a non-empty string',
    )
  })
})
