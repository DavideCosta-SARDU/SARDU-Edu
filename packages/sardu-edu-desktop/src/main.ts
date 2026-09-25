import { cpSync, existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { app, BrowserWindow, dialog, ipcMain, Menu, net, protocol } from 'electron'
import type { IpcMainInvokeEvent, MessageBoxOptions, Session } from 'electron'
import { ArduinoService } from './arduino-service'
import { HardwareDiagnostics } from './hardware-diagnostics'
import { HARDWARE_IPC } from './contracts'
import {
  validateCompileRequest,
  validateLiveDiagnostic,
  validatePort,
  validatePortListRequest,
  validateUploadRequest,
} from './request-validation'

const APP_ORIGIN = 'sardu-block://app'
let preferredLivePort: string | null = null
let quitting = false
const configuredSessions = new WeakSet<Session>()

app.setName('SARDU-Block')
process.title = 'SARDU-Block'

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'sardu-block',
    privileges: { secure: true, standard: true, supportFetchAPI: true },
  },
])

const migrateLegacyUserData = (): void => {
  const currentUserData = app.getPath('userData')
  const legacyUserData = path.join(path.dirname(currentUserData), 'SARDU Edu')
  if (!existsSync(legacyUserData) || path.resolve(legacyUserData) === path.resolve(currentUserData)) return
  cpSync(legacyUserData, currentUserData, { recursive: true, force: false, errorOnExist: false })
}

const guiRoot = (): string =>
  app.isPackaged
    ? path.join(process.resourcesPath, 'gui')
    : path.resolve(__dirname, '..', '..', 'scratch-gui', 'build')

const hardwareRoot = (): string =>
  app.isPackaged ? path.join(process.resourcesPath, 'hardware') : path.resolve(__dirname, '..', 'resources')

const validateSender = (event: IpcMainInvokeEvent): void => {
  if (!event.senderFrame?.url.startsWith(`${APP_ORIGIN}/`)) {
    throw new Error(`Rejected SARDU-Block desktop request from ${event.senderFrame?.url || 'unknown frame'}`)
  }
}

const registerAppProtocol = (): void => {
  const root = path.resolve(guiRoot())
  protocol.handle('sardu-block', (request) => {
    const requestUrl = new URL(request.url)
    if (requestUrl.host !== 'app') return new Response('Not found', { status: 404 })
    const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '') || 'index.html'
    const filePath = path.resolve(root, relativePath)
    if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
      return new Response('Not found', { status: 404 })
    }
    return net.fetch(pathToFileURL(filePath).toString())
  })
}

const configureSerialAccess = (session: Session): void => {
  if (configuredSessions.has(session)) return
  configuredSessions.add(session)
  const isSarduOrigin = (origin: string): boolean => origin === APP_ORIGIN || origin.startsWith(`${APP_ORIGIN}/`)
  const isSerialPermission = (permission: string): boolean => permission === 'serial'
  session.setPermissionCheckHandler(
    (_webContents, permission, requestingOrigin) => isSerialPermission(permission) && isSarduOrigin(requestingOrigin),
  )
  session.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(isSerialPermission(permission) && isSarduOrigin(webContents.getURL()))
  })
  session.on('select-serial-port', (event, portList, _webContents, callback) => {
    event.preventDefault()
    const selected = preferredLivePort ? portList.find((port) => port.portName === preferredLivePort) : null
    preferredLivePort = null
    callback(selected?.portId || '')
  })
}

const registerHardwareIpc = (): void => {
  const service = new ArduinoService(hardwareRoot(), app.getPath('userData'))
  const diagnostics = new HardwareDiagnostics(app.getPath('userData'))
  ipcMain.handle(HARDWARE_IPC.getStatus, (event) => {
    validateSender(event)
    return service.getStatus()
  })
  ipcMain.handle(HARDWARE_IPC.listPorts, (event, request) => {
    validateSender(event)
    return service.listPorts(validatePortListRequest(request).discoveryTimeoutMs)
  })
  ipcMain.handle(HARDWARE_IPC.logLiveDiagnostic, (event, diagnostic) => {
    validateSender(event)
    return diagnostics.writeLive(validateLiveDiagnostic(diagnostic))
  })
  ipcMain.handle(HARDWARE_IPC.prepareR4Resources, async (event) => {
    validateSender(event)
    if (await service.areR4ResourcesReady()) return true
    const italian = app.getLocale().toLowerCase().startsWith('it')
    const options: MessageBoxOptions = {
      type: 'warning',
      title: 'Arduino UNO R4 WiFi',
      message: italian ?
        'Arduino UNO R4 WiFi richiede circa 545 MB aggiuntivi nella cartella temporanea dell’utente per consentire la compilazione.' :
        'Arduino UNO R4 WiFi requires about 545 MB of additional space in the user’s temporary folder to enable compilation.',
      buttons: italian ? ['Accetta e prepara', 'Annulla'] : ['Accept and prepare', 'Cancel'],
      cancelId: 1,
      defaultId: 0,
      noLink: true,
    }
    const owner = BrowserWindow.fromWebContents(event.sender)
    const result = owner ? await dialog.showMessageBox(owner, options) : await dialog.showMessageBox(options)
    if (result.response !== 0) return false
    await service.prepareR4Resources()
    return true
  })
  ipcMain.handle(HARDWARE_IPC.compile, (event, request) => {
    validateSender(event)
    return service.compile(validateCompileRequest(request), (output) => {
      if (!event.sender.isDestroyed()) event.sender.send(HARDWARE_IPC.output, output)
    })
  })
  ipcMain.handle(HARDWARE_IPC.upload, (event, request) => {
    validateSender(event)
    return service.upload(validateUploadRequest(request), (output) => {
      if (!event.sender.isDestroyed()) event.sender.send(HARDWARE_IPC.output, output)
    })
  })
  ipcMain.handle(HARDWARE_IPC.selectLivePort, (event, port) => {
    validateSender(event)
    preferredLivePort = validatePort(port)
  })
}

const configureApplicationMenu = (): void => {
  const italian = app.getLocale().toLowerCase().startsWith('it')
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'File',
        submenu: [
          {
            label: italian ? 'Esci' : 'Exit',
            accelerator: 'Alt+F4',
            click: () => app.quit(),
          },
        ],
      },
    ]),
  )
}

const createWindow = (): void => {
  let closing = false
  const mainWindow = new BrowserWindow({
    title: 'SARDU-Block',
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: true,
    },
  })
  configureSerialAccess(mainWindow.webContents.session)
  mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
    console.error(`SARDU-Block preload failed: path=${preloadPath}, error=${error.message}`)
  })
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault())
  mainWindow.on('page-title-updated', (event) => event.preventDefault())
  mainWindow.on('close', (event) => {
    if (closing) return
    closing = true
    event.preventDefault()
    mainWindow.destroy()
  })
  mainWindow.on('closed', () => {
    if (process.platform !== 'darwin' && !quitting) app.quit()
  })
  mainWindow.once('ready-to-show', () => mainWindow.show())
  void mainWindow.loadURL(`${APP_ORIGIN}/index.html`)
}

void app.whenReady().then(() => {
  app.setAppUserModelId('pro.sardu.block')
  migrateLegacyUserData()
  configureApplicationMenu()
  registerAppProtocol()
  registerHardwareIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  quitting = true
})
