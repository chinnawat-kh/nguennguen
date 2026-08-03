export type { Transaction, Category, Budget, SyncStatus, SyncResult } from '../../shared/types'
import type { Transaction, Category, Budget } from '../../shared/types'

export interface SyncPayload {
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
}

export type FilterMode = 'daily' | 'weekly' | 'monthly' | 'yearly'

export const TAB_IDS = {
  DASHBOARD: 'dashboard',
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories'
} as const

export type TabId = (typeof TAB_IDS)[keyof typeof TAB_IDS]
