import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getTransactions: (month?: string) => ipcRenderer.invoke('get-transactions', month),
  addTransaction: (data: any) => ipcRenderer.invoke('add-transaction', data),
  updateTransaction: (data: any) => ipcRenderer.invoke('update-transaction', data),
  deleteTransaction: (id: number) => ipcRenderer.invoke('delete-transaction', id),
  getCategories: () => ipcRenderer.invoke('get-categories'),
  addCategory: (data: any) => ipcRenderer.invoke('add-category', data),
  updateCategory: (data: any) => ipcRenderer.invoke('update-category', data),
  deleteCategory: (id: number) => ipcRenderer.invoke('delete-category', id),
  getBudget: (month: string) => ipcRenderer.invoke('get-budget', month),
  setBudget: (data: any) => ipcRenderer.invoke('set-budget', data)
}
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
