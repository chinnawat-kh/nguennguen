export interface Transaction {
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

export interface Category {
  id: number
  name: string
  type: 'income' | 'expense'
  icon?: string
  color?: string
  updated_at?: string
}

export interface Budget {
  id: number
  month: string
  amount: number
  updated_at?: string
}

export interface SyncPayload {
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
}

export type FilterMode = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface SyncStatus {
  signedIn: boolean
  lastModifiedAt?: string
}

export interface SyncResult {
  success: boolean
  error?: string
}

export const TAB_IDS = {
  DASHBOARD: 'dashboard',
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories'
} as const

export type TabId = (typeof TAB_IDS)[keyof typeof TAB_IDS]
