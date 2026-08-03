export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: number
  type: TransactionType
  amount: number
  category_id: number | null
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
  type: TransactionType
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

export interface SyncStatus {
  signedIn: boolean
  lastModifiedAt?: string
}

export interface SyncResult {
  success: boolean
  syncedAt?: string
  error?: string
}
