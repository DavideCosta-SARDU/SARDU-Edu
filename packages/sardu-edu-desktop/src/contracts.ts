export const HARDWARE_IPC = {
  compile: 'sardu-hardware:compile',
  getStatus: 'sardu-hardware:get-status',
  listPorts: 'sardu-hardware:list-ports',
  logLiveDiagnostic: 'sardu-hardware:log-live-diagnostic',
  output: 'sardu-hardware:output',
  selectLivePort: 'sardu-hardware:select-live-port',
  upload: 'sardu-hardware:upload',
} as const

export interface ArduinoCompileRequest {
  readonly boardId: string
  readonly source: string
}

export interface ArduinoUploadRequest extends ArduinoCompileRequest {
  readonly port: string
}

export interface ArduinoPort {
  readonly address: string
  readonly label: string
  readonly matchingBoardFqbns: readonly string[]
  readonly protocol: string
}

export interface HardwareOperationResult {
  readonly output: string
}

export interface HardwareOutputEvent {
  readonly action: 'compile' | 'upload'
  readonly stream: 'stdout' | 'stderr'
  readonly text: string
}

export interface HardwareStatus {
  readonly arduinoCliAvailable: boolean
  readonly arduinoCoreAvailable: boolean
}

export interface LiveDiagnostic {
  readonly detail?: string
  readonly port?: string
  readonly stage: string
}

export interface SarduDesktopHardwareApi {
  compile(request: ArduinoCompileRequest): Promise<HardwareOperationResult>
  getStatus(): Promise<HardwareStatus>
  listPorts(): Promise<readonly ArduinoPort[]>
  logLiveDiagnostic(diagnostic: LiveDiagnostic): Promise<void>
  onOutput(listener: (event: HardwareOutputEvent) => void): () => void
  selectLivePort(port: string): Promise<void>
  upload(request: ArduinoUploadRequest): Promise<HardwareOperationResult>
}

export interface SarduDesktopApi {
  readonly hardware: SarduDesktopHardwareApi
}
