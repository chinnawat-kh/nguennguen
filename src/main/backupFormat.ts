import type { getAllData } from './database'

type BackupData = ReturnType<typeof getAllData>
export const BACKUP_FORMAT = 'nguennguen-backup'

export function createBackup(data: BackupData): string {
  return JSON.stringify(
    { format: BACKUP_FORMAT, version: 1, createdAt: new Date().toISOString(), data },
    null,
    2
  )
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid backup record')
  return value as Record<string, unknown>
}

function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || value.length > max) throw new Error('Invalid backup text')
  return value
}

function optionalText(value: unknown, max: number): string | null {
  return value == null ? null : text(value, max)
}

function amount(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    !Number.isSafeInteger(Math.round(value * 100))
  )
    throw new Error('Invalid backup amount')
  return value
}

function unique(value: unknown, seen: Set<string>): string {
  const key = text(value, 200)
  if (!key || seen.has(key)) throw new Error('Duplicate or empty backup identifier')
  seen.add(key)
  return key
}

function type(value: unknown): 'income' | 'expense' {
  if (value !== 'income' && value !== 'expense') throw new Error('Invalid backup type')
  return value
}

export function parseBackup(source: string): BackupData {
  const root = record(JSON.parse(source))
  if (root.format !== BACKUP_FORMAT || root.version !== 1)
    throw new Error('Unsupported backup format')
  const data = record(root.data)
  for (const key of ['categories', 'transactions', 'budgets']) {
    if (!Array.isArray(data[key]) || data[key].length > 1000000)
      throw new Error('Invalid backup collection')
  }
  const categoryIds = new Set<string>()
  const transactionIds = new Set<string>()
  const months = new Set<string>()
  const metadata = (r: Record<string, unknown>): Record<string, string | null> => ({
    updated_at: optionalText(r.updated_at, 100),
    deleted_at: optionalText(r.deleted_at, 100)
  })
  const categories = (data.categories as unknown[]).map((value) => {
    const r = record(value)
    const name = text(r.name, 100)
    if (!name.trim()) throw new Error('Empty category name')
    const color = optionalText(r.color, 7)
    if (color && !/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Invalid category color')
    return {
      ...metadata(r),
      sync_id: unique(r.sync_id, categoryIds),
      name,
      type: type(r.type),
      icon: optionalText(r.icon, 50),
      color
    }
  })
  const transactions = (data.transactions as unknown[]).map((value) => {
    const r = record(value)
    const date = text(r.date, 10)
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date
    )
      throw new Error('Invalid transaction date')
    const categoryId = optionalText(r.category_sync_id, 200)
    if (categoryId && !categoryIds.has(categoryId)) throw new Error('Missing referenced category')
    return {
      ...metadata(r),
      sync_id: unique(r.sync_id, transactionIds),
      type: type(r.type),
      amount: amount(r.amount),
      date,
      category_sync_id: categoryId,
      note: optionalText(r.note, 500)
    }
  })
  const budgets = (data.budgets as unknown[]).map((value) => {
    const r = record(value)
    const month = unique(r.month, months)
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Invalid budget month')
    return { month, amount: amount(r.amount), updated_at: optionalText(r.updated_at, 100) }
  })
  // SQLite exports nullable optional fields. Keep them present for named SQL bindings.
  return { categories, transactions, budgets } as unknown as BackupData
}
