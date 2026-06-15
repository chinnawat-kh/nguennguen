import { ElectronAPI } from '@electron-toolkit/preload'

interface Transaction {
  id: number
  type: 'income' | 'expense'
  amount: number
  category_id: number
  date: string
  note?: string
  updated_at?: string
  category_name?: string
  category_color?: string
  category_icon?: string
}

interface Category {
  id: number
  name: string
  type: 'income' | 'expense'
  icon?: string
  color?: string
  updated_at?: string
}

interface Budget {
  id: number
  month: string
  amount: number
  updated_at?: string
}

interface SyncStatus {
  signedIn: boolean
  lastModifiedAt?: string
}

interface SyncResult {
  success: boolean
  syncedAt?: string
  error?: string
}

interface UpdateEvent {
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      windowMinimize: () => Promise<void>
      windowMaximize: () => Promise<void>
      windowClose: () => Promise<void>
      windowIsMaximized: () => Promise<boolean>
      onWindowStateChange: (callback: (maximized: boolean) => void) => () => void
      getTransactions: (month?: string) => Promise<Transaction[]>
      addTransaction: (data: {
        type: string
        amount: number
        category_id: number
        date: string
        note?: string
      }) => Promise<void>
      updateTransaction: (data: {
        id: number
        type: string
        amount: number
        category_id: number
        date: string
        note?: string
      }) => Promise<void>
      deleteTransaction: (id: number) => Promise<void>
      getCategories: () => Promise<Category[]>
      addCategory: (data: {
        name: string
        type: string
        icon?: string
        color?: string
      }) => Promise<void>
      updateCategory: (data: {
        id: number
        name: string
        type: string
        icon?: string
        color?: string
      }) => Promise<void>
      deleteCategory: (id: number) => Promise<void>
      getBudget: (month: string) => Promise<Budget | undefined>
      setBudget: (data: { month: string; amount: number }) => Promise<void>
      getAppVersion: () => Promise<string>
      checkForUpdates: () => Promise<void>
      downloadUpdate: () => Promise<void>
      installUpdate: () => Promise<void>
      onUpdateEvent: (callback: (event: UpdateEvent) => void) => () => void
      getClientId: () => Promise<string | null>
      setClientId: (id: string) => Promise<void>
      signInWithGoogle: () => Promise<boolean | { error: string }>
      signOutGoogle: () => Promise<void>
      getSyncStatus: () => Promise<SyncStatus>
      syncNow: () => Promise<SyncResult>
      syncPush: () => Promise<SyncResult>
      syncPull: () => Promise<SyncResult>
    }
  }
}
