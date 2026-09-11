import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type { HardwareOutputEvent, SarduDesktopApi } from './contracts'

// A sandboxed Electron preload must not depend on generated local CommonJS chunks.
const HARDWARE_IPC = {
  compile: 'sardu-hardware:compile',
  getStatus: 'sardu-hardware:get-status',
  listPorts: 'sardu-hardware:list-ports',
  logLiveDiagnostic: 'sardu-hardware:log-live-diagnostic',
  output: 'sardu-hardware:output',
  selectLivePort: 'sardu-hardware:select-live-port',
  upload: 'sardu-hardware:upload',
} as const

const api: SarduDesktopApi = {
  hardware: {
    compile: (request) => ipcRenderer.invoke(HARDWARE_IPC.compile, request),
    getStatus: () => ipcRenderer.invoke(HARDWARE_IPC.getStatus),
    listPorts: () => ipcRenderer.invoke(HARDWARE_IPC.listPorts),
    logLiveDiagnostic: (diagnostic) => ipcRenderer.invoke(HARDWARE_IPC.logLiveDiagnostic, diagnostic),
    onOutput: (listener) => {
      const handleOutput = (_event: IpcRendererEvent, output: HardwareOutputEvent): void => listener(output)
      ipcRenderer.on(HARDWARE_IPC.output, handleOutput)
      return () => ipcRenderer.removeListener(HARDWARE_IPC.output, handleOutput)
    },
    selectLivePort: (port) => ipcRenderer.invoke(HARDWARE_IPC.selectLivePort, port),
    upload: (request) => ipcRenderer.invoke(HARDWARE_IPC.upload, request),
  },
}

contextBridge.exposeInMainWorld('sarduEduDesktop', api)
