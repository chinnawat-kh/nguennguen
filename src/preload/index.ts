import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onWindowStateChange: (callback: (maximized: boolean) => void) => {
    const handler = (_: unknown, maximized: boolean): void => callback(maximized)
    ipcRenderer.on('window-state-changed', handler)
    return (): void => {
      ipcRenderer.removeListener('window-state-changed', handler)
    }
  },
  getTransactions: (month?: string) => ipcRenderer.invoke('get-transactions', month),
  addTransaction: (data: {
    type: string
    amount: number
    category_id: number
    date: string
    note?: string
  }) => ipcRenderer.invoke('add-transaction', data),
  updateTransaction: (data: {
    id: number
    type: string
    amount: number
    category_id: number
    date: string
    note?: string
  }) => ipcRenderer.invoke('update-transaction', data),
  deleteTransaction: (id: number) => ipcRenderer.invoke('delete-transaction', id),
  getCategories: () => ipcRenderer.invoke('get-categories'),
  addCategory: (data: { name: string; type: string; icon: string; color: string }) =>
    ipcRenderer.invoke('add-category', data),
  updateCategory: (data: { id: number; name: string; type: string; icon: string; color: string }) =>
    ipcRenderer.invoke('update-category', data),
  deleteCategory: (id: number) => ipcRenderer.invoke('delete-category', id),
  getBudget: (month: string) => ipcRenderer.invoke('get-budget', month),
  setBudget: (data: { month: string; amount: number }) => ipcRenderer.invoke('set-budget', data),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateEvent: (callback: (event: { type: string; data?: Record<string, unknown> }) => void) => {
    const handler = (_: unknown, payload: { type: string; data?: Record<string, unknown> }): void =>
      callback(payload)
    ipcRenderer.on('update-event', handler)
    return (): void => {
      ipcRenderer.removeListener('update-event', handler)
    }
  },
  getClientId: () => ipcRenderer.invoke('sync-get-client-id'),
  setClientId: (id: string) => ipcRenderer.invoke('sync-set-client-id', id),
  signInWithGoogle: () => ipcRenderer.invoke('sync-sign-in'),
  signOutGoogle: () => ipcRenderer.invoke('sync-sign-out'),
  getSyncStatus: () => ipcRenderer.invoke('sync-status'),
  syncNow: () => ipcRenderer.invoke('sync-now'),
  syncPush: () => ipcRenderer.invoke('sync-push'),
  syncPull: () => ipcRenderer.invoke('sync-pull')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (defined in dts)
  window.electron = electronAPI
  // @ts-ignore (defined in dts)
  window.api = api
}
