import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type { HardwareOutputEvent, SarduBlockDesktopApi } from './contracts'

// A sandboxed Electron preload must not depend on generated local CommonJS chunks.
const HARDWARE_IPC = {
  compile: 'sardu-block-hardware:compile',
  getStatus: 'sardu-block-hardware:get-status',
  listPorts: 'sardu-block-hardware:list-ports',
  logLiveDiagnostic: 'sardu-block-hardware:log-live-diagnostic',
  output: 'sardu-block-hardware:output',
  selectLivePort: 'sardu-block-hardware:select-live-port',
  upload: 'sardu-block-hardware:upload',
} as const

const api: SarduBlockDesktopApi = {
  hardware: {
    compile: (request) => ipcRenderer.invoke(HARDWARE_IPC.compile, request),
    getStatus: () => ipcRenderer.invoke(HARDWARE_IPC.getStatus),
    listPorts: (request) => ipcRenderer.invoke(HARDWARE_IPC.listPorts, request),
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

contextBridge.exposeInMainWorld('sarduBlockDesktop', api)
// Historical bridge retained while installed SARDU Edu frontends are still supported.
contextBridge.exposeInMainWorld('sarduEduDesktop', api)
