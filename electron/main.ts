import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'


const preloadPath = fileURLToPath(new URL('../preload/index.js', import.meta.url))

// Dev server URL for the React + Vite frontend
const rendererDevUrl = process.env.ELECTRON_RENDERER_URL ?? 'http://localhost:5173'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 340,
    height: 420,
    show: false,
    frame: false,       // Removes window border (floating widget)
    transparent: true,  // Transparent background
    resizable: true,    // Allows resizing
    alwaysOnTop: true,  // Floats above other apps
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  
  mainWindow.loadURL(rendererDevUrl)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.clippy.ai')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
