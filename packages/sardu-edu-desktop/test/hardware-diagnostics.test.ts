import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { HardwareDiagnostics } from '../src/hardware-diagnostics'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('Live hardware diagnostics', () => {
  test('writes the handshake stage, port, and single-line detail', async () => {
    const userDataRoot = await mkdtemp(path.join(os.tmpdir(), 'sardu-live-diagnostic-'))
    temporaryDirectories.push(userDataRoot)
    const diagnostics = new HardwareDiagnostics(userDataRoot)

    await diagnostics.writeLive({ stage: 'handshake-timeout', port: 'COM4', detail: 'No\nresponse' })

    const contents = await readFile(diagnostics.liveDiagnosticsPath, 'utf8')
    expect(contents).toContain('[LIVE] stage=handshake-timeout, port=COM4, detail=No response')
  })
})
