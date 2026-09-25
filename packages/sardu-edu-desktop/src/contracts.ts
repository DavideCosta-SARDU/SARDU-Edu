export const HARDWARE_IPC = {
  compile: 'sardu-block-hardware:compile',
  getStatus: 'sardu-block-hardware:get-status',
  listPorts: 'sardu-block-hardware:list-ports',
  logLiveDiagnostic: 'sardu-block-hardware:log-live-diagnostic',
  output: 'sardu-block-hardware:output',
  prepareR4Resources: 'sardu-block-hardware:prepare-r4-resources',
  selectLivePort: 'sardu-block-hardware:select-live-port',
  upload: 'sardu-block-hardware:upload',
} as const

export interface ArduinoCompileRequest {
  readonly boardId: string
  readonly nanoProcessor?: 'auto' | 'new' | 'old'
  readonly source: string
}

export interface ArduinoUploadRequest extends ArduinoCompileRequest {
  readonly port: string
}

export interface ArduinoPort {
  readonly address: string
  readonly label: string
  readonly matchingBoardFqbns: readonly string[]
  readonly pid?: string
  readonly protocol: string
  readonly vid?: string
}

export interface ArduinoPortListRequest {
  readonly discoveryTimeoutMs?: number
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

export interface SarduBlockDesktopHardwareApi {
  compile(request: ArduinoCompileRequest): Promise<HardwareOperationResult>
  getStatus(): Promise<HardwareStatus>
  listPorts(request?: ArduinoPortListRequest): Promise<readonly ArduinoPort[]>
  logLiveDiagnostic(diagnostic: LiveDiagnostic): Promise<void>
  onOutput(listener: (event: HardwareOutputEvent) => void): () => void
  prepareR4Resources(): Promise<boolean>
  selectLivePort(port: string): Promise<void>
  upload(request: ArduinoUploadRequest): Promise<HardwareOperationResult>
}

export interface SarduBlockDesktopApi {
  readonly hardware: SarduBlockDesktopHardwareApi
}

/** Historical type alias retained for integrations compiled against SARDU Edu. */
export type SarduDesktopHardwareApi = SarduBlockDesktopHardwareApi
export type SarduDesktopApi = SarduBlockDesktopApi
