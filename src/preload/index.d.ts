import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getTransactions: (month?: string) => Promise<any[]>
      addTransaction: (data: any) => Promise<any>
      updateTransaction: (data: any) => Promise<any>
      deleteTransaction: (id: number) => Promise<any>
      getCategories: () => Promise<any[]>
      addCategory: (data: any) => Promise<any>
      updateCategory: (data: any) => Promise<any>
      deleteCategory: (id: number) => Promise<any>
      getBudget: (month: string) => Promise<any>
      setBudget: (data: { month: string; amount: number }) => Promise<any>
    }
  }
}
