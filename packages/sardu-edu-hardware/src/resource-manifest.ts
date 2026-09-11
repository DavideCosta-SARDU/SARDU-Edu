export interface ResourceReference {
  readonly id: string
  readonly version: string
  readonly source: string
  readonly license: string
  readonly archive?: string
  readonly executable?: string
  readonly url?: string
}

export interface ArduinoCliResource extends Omit<ResourceReference, 'id'> {
  readonly archive: string
  readonly checksumsUrl: string
  readonly url: string
}

export interface HardwareResourceManifest {
  readonly schemaVersion: 1
  readonly arduinoCli: ArduinoCliResource
  readonly platforms: readonly ResourceReference[]
  readonly libraries: readonly ResourceReference[]
  readonly drivers: readonly ResourceReference[]
  readonly builtinTools?: readonly ResourceReference[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const requireString = (record: Record<string, unknown>, field: string, context: string): string => {
  const value = record[field]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Hardware resource manifest ${context}.${field} must be a non-empty string`)
  }
  return value
}

const parseReference = (value: unknown, context: string): ResourceReference => {
  if (!isRecord(value)) throw new Error(`Hardware resource manifest ${context} must be an object`)
  const optionalFields = Object.fromEntries(
    (['archive', 'executable', 'url'] as const)
      .filter((field) => value[field] !== undefined)
      .map((field) => [field, requireString(value, field, context)]),
  )
  return {
    id: requireString(value, 'id', context),
    version: requireString(value, 'version', context),
    source: requireString(value, 'source', context),
    license: requireString(value, 'license', context),
    ...optionalFields,
  }
}

const parseReferences = (value: unknown, field: string): readonly ResourceReference[] => {
  if (!Array.isArray(value)) throw new Error(`Hardware resource manifest ${field} must be an array`)
  return value.map((entry, index) => parseReference(entry, `${field}[${index}]`))
}

export const parseHardwareResourceManifest = (value: unknown): HardwareResourceManifest => {
  if (!isRecord(value)) throw new Error('Hardware resource manifest must be an object')
  if (value.schemaVersion !== 1) {
    throw new Error(`Unsupported hardware resource schema: ${String(value.schemaVersion)}`)
  }
  if (!isRecord(value.arduinoCli)) throw new Error('Hardware resource manifest arduinoCli must be an object')

  return {
    schemaVersion: 1,
    arduinoCli: {
      version: requireString(value.arduinoCli, 'version', 'arduinoCli'),
      source: requireString(value.arduinoCli, 'source', 'arduinoCli'),
      license: requireString(value.arduinoCli, 'license', 'arduinoCli'),
      archive: requireString(value.arduinoCli, 'archive', 'arduinoCli'),
      checksumsUrl: requireString(value.arduinoCli, 'checksumsUrl', 'arduinoCli'),
      url: requireString(value.arduinoCli, 'url', 'arduinoCli'),
    },
    platforms: parseReferences(value.platforms, 'platforms'),
    libraries: parseReferences(value.libraries, 'libraries'),
    drivers: parseReferences(value.drivers, 'drivers'),
    ...(value.builtinTools === undefined
      ? {}
      : { builtinTools: parseReferences(value.builtinTools, 'builtinTools') }),
  }
}
