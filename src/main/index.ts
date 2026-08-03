import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as validate from './validation'
import { mergeByKey } from './merge'
import {
  initDB,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getBudget,
  setBudget,
  getAllData,
  replaceAllData
} from './database'
import {
  signIn,
  clearTokens,
  pushData,
  pullData,
  getSyncStatus,
  getClientId,
  setClientId
} from './sync'

let mainWindow: BrowserWindow | null = null

type AppData = ReturnType<typeof getAllData>

function mergeData(local: AppData, remote: AppData): AppData {
  return {
    transactions: mergeByKey(local.transactions, remote.transactions, (item) => item.sync_id),
    categories: mergeByKey(local.categories, remote.categories, (item) => item.sync_id),
    budgets: mergeByKey(local.budgets, remote.budgets, (item) => item.month)
  }
}

function sendUpdateEvent(type: string, data?: unknown): void {
  const w = mainWindow
  if (w && !w.isDestroyed()) {
    w.webContents.send('update-event', { type, data })
  }
}
function createWindow(): void {
  const win = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 560,
    minHeight: 500,
    frame: false,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  mainWindow = win

  win.on('ready-to-show', () => {
    win.show()
  })

  win.webContents.setWindowOpenHandler((details) => {
    const url = new URL(details.url)
    if (url.protocol === 'https:') shell.openExternal(url.toString())
    return { action: 'deny' }
  })

  win.on('maximize', () => {
    win.webContents.send('window-state-changed', true)
  })
  win.on('unmaximize', () => {
    win.webContents.send('window-state-changed', false)
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.nguennguen.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Auto Updater
  autoUpdater.autoDownload = false
  autoUpdater.on('checking-for-update', () => sendUpdateEvent('checking'))
  autoUpdater.on('update-available', (info) => sendUpdateEvent('available', info))
  autoUpdater.on('update-not-available', (info) => sendUpdateEvent('not-available', info))
  autoUpdater.on('download-progress', (progress) => sendUpdateEvent('progress', progress))
  autoUpdater.on('update-downloaded', (info) => sendUpdateEvent('downloaded', info))
  autoUpdater.on('error', (err) => sendUpdateEvent('error', err.message || 'Unknown error'))
  autoUpdater.checkForUpdatesAndNotify()

  // IPC handlers
  ipcMain.handle('get-transactions', (_, value) =>
    getTransactions(value == null ? undefined : validate.month(value))
  )
  ipcMain.handle('add-transaction', (_, data) =>
    addTransaction(validate.transaction(data) as never)
  )
  ipcMain.handle('update-transaction', (_, data) =>
    updateTransaction(validate.transaction(data, true) as never)
  )
  ipcMain.handle('delete-transaction', (_, id) => deleteTransaction(validate.positiveId(id)))
  ipcMain.handle('get-categories', () => getCategories())
  ipcMain.handle('add-category', (_, data) => addCategory(validate.category(data) as never))
  ipcMain.handle('update-category', (_, data) =>
    updateCategory(validate.category(data, true) as never)
  )
  ipcMain.handle('delete-category', (_, id) => deleteCategory(validate.positiveId(id)))
  ipcMain.handle('get-budget', (_, value) => getBudget(validate.month(value)))
  ipcMain.handle('set-budget', (_, data) => setBudget(validate.budget(data) as never))

  ipcMain.handle('get-app-version', () => app.getVersion())
  ipcMain.handle('check-for-updates', () => {
    autoUpdater.checkForUpdates()
  })

  // Sync handlers
  ipcMain.handle('sync-get-client-id', () => getClientId())
  ipcMain.handle('sync-set-client-id', (_, id: string) => {
    setClientId(validate.clientId(id))
  })
  ipcMain.handle('sync-sign-in', async () => {
    try {
      return await signIn()
    } catch (e) {
      return { error: (e as Error).message }
    }
  })
  ipcMain.handle('sync-sign-out', () => {
    clearTokens()
  })
  ipcMain.handle('sync-status', async () => {
    return getSyncStatus()
  })
  ipcMain.handle('sync-now', async () => {
    try {
      const localData = getAllData()
      const remoteData = await pullData()
      const mergedData = remoteData ? mergeData(localData, remoteData) : localData
      const result = await pushData(mergedData)
      replaceAllData(mergedData)
      return { success: true, syncedAt: result.syncedAt }
    } catch (e) {
      return { error: (e as Error).message }
    }
  })
  ipcMain.handle('sync-push', async () => {
    try {
      const localData = getAllData()
      const result = await pushData(localData)
      return { success: true, syncedAt: result.syncedAt }
    } catch (e) {
      return { error: (e as Error).message }
    }
  })
  ipcMain.handle('sync-pull', async () => {
    try {
      const remoteData = await pullData()
      if (remoteData && remoteData.transactions) {
        replaceAllData(remoteData)
        return { success: true, syncedAt: remoteData.syncedAt }
      }
      return { success: true, syncedAt: null }
    } catch (e) {
      return { error: (e as Error).message }
    }
  })
  ipcMain.handle('window-minimize', () => mainWindow?.minimize())
  ipcMain.handle('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.handle('window-close', () => mainWindow?.close())
  ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false)

  ipcMain.handle('download-update', () => {
    autoUpdater.downloadUpdate()
  })
  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall()
  })

  initDB()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
