import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import type { LiveDiagnostic } from './contracts'

export class HardwareDiagnostics {
  readonly liveDiagnosticsPath: string

  constructor(userDataRoot: string) {
    this.liveDiagnosticsPath = path.join(
      process.env.SARDU_LOG_DIR || path.join(userDataRoot, 'logs'),
      'hardware-live.txt',
    )
  }

  async writeLive(diagnostic: LiveDiagnostic): Promise<void> {
    const fields = [
      `stage=${diagnostic.stage}`,
      diagnostic.port ? `port=${diagnostic.port}` : null,
      diagnostic.detail ? `detail=${diagnostic.detail.replace(/[\r\n]+/g, ' ')}` : null,
    ].filter(Boolean)
    const line = `${new Date().toISOString()} [LIVE] ${fields.join(', ')}`
    console.log(line)
    await mkdir(path.dirname(this.liveDiagnosticsPath), { recursive: true })
    await appendFile(this.liveDiagnosticsPath, `${line}\n`, 'utf8')
  }
}
