import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { toSatang } from '../shared/money'
import { migrateDatabase, SCHEMA_VERSION } from './migrations'
import { mkdirSync } from 'node:fs'

const userDataPath = app.getPath('userData')
const dbPath = join(userDataPath, 'nguennguen.sqlite')

// Initialize DB
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

export function initDB(): void {
  const version = db.pragma('user_version', { simple: true }) as number
  const hasTables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'transactions'")
    .get()
  if (version > SCHEMA_VERSION) throw new Error('Database was created by a newer app version')
  if (hasTables && version < SCHEMA_VERSION) {
    const directory = join(userDataPath, 'backups')
    mkdirSync(directory, { recursive: true })
    db.prepare('VACUUM INTO ?').run(
      join(directory, `before-migration-v${version}-${Date.now()}-${randomUUID()}.sqlite`)
    )
  }
  migrateDatabase(db)

  const count = db.prepare('SELECT count(*) as count FROM categories').get() as { count: number }
  if (count.count === 0) {
    const insert = db.prepare(
      'INSERT INTO categories (name, type, icon, color, sync_id) VALUES (@name, @type, @icon, @color, @sync_id)'
    )
    const defaultCategories = [
      { name: 'Food', type: 'expense', icon: 'Utensils', color: '#ef4444' },
      { name: 'Travel', type: 'expense', icon: 'Car', color: '#3b82f6' },
      { name: 'Salary', type: 'income', icon: 'Banknote', color: '#10b981' },
      { name: 'Entertainment', type: 'expense', icon: 'Film', color: '#a855f7' }
    ]
    for (const cat of defaultCategories) {
      insert.run({ ...cat, sync_id: randomUUID() })
    }
  }
}

function getNextMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const nextYear = m === 12 ? y + 1 : y
  const nextMonth = m === 12 ? 1 : m + 1
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
}

export function getTransactions(month?: string): unknown[] {
  if (month) {
    const start = `${month}-01`
    const end = `${getNextMonth(month)}-01`
    return db
      .prepare(
        'SELECT t.*, t.amount_satang / 100.0 AS amount, c.name as category_name, c.color as category_color, c.icon as category_icon FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.deleted_at IS NULL AND t.date >= ? AND t.date < ? ORDER BY t.date DESC'
      )
      .all(start, end)
  }
  return db
    .prepare(
      'SELECT t.*, t.amount_satang / 100.0 AS amount, c.name as category_name, c.color as category_color, c.icon as category_icon FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.deleted_at IS NULL ORDER BY t.date DESC'
    )
    .all()
}

export function addTransaction(data: {
  type: string
  amount: number
  category_id: number
  date: string
  note?: string
}): unknown {
  assertCategoryType(data.category_id, data.type)
  const insert = db.prepare(
    "INSERT INTO transactions (type, amount, amount_satang, category_id, date, note, updated_at, sync_id) VALUES (@type, 0, @amount_satang, @category_id, @date, @note, datetime('now','localtime'), @sync_id)"
  )
  return insert.run({ ...data, amount_satang: toSatang(data.amount), sync_id: randomUUID() })
}

export function updateTransaction(data: {
  id: number
  type: string
  amount: number
  category_id: number
  date: string
  note?: string
}): unknown {
  assertCategoryType(data.category_id, data.type)
  const update = db.prepare(
    "UPDATE transactions SET type = @type, amount_satang = @amount_satang, category_id = @category_id, date = @date, note = @note, updated_at = datetime('now','localtime') WHERE id = @id"
  )
  return update.run({ ...data, amount_satang: toSatang(data.amount) })
}

function assertCategoryType(categoryId: number, type: string): void {
  const category = db
    .prepare('SELECT type FROM categories WHERE id = ? AND deleted_at IS NULL')
    .get(categoryId) as { type: string } | undefined
  if (!category || category.type !== type)
    throw new Error('Category does not match transaction type')
}

export function deleteTransaction(id: number): unknown {
  return db
    .prepare(
      "UPDATE transactions SET deleted_at = datetime('now','localtime'), updated_at = datetime('now','localtime') WHERE id = ?"
    )
    .run(id)
}

export function getCategories(): unknown[] {
  return db.prepare('SELECT * FROM categories WHERE deleted_at IS NULL').all()
}

export function addCategory(data: {
  name: string
  type: string
  icon: string
  color: string
}): unknown {
  const insert = db.prepare(
    "INSERT INTO categories (name, type, icon, color, updated_at, sync_id) VALUES (@name, @type, @icon, @color, datetime('now','localtime'), @sync_id)"
  )
  return insert.run({ ...data, sync_id: randomUUID() })
}

export function updateCategory(data: {
  id: number
  name: string
  type: string
  icon: string
  color: string
}): unknown {
  const update = db.prepare(
    "UPDATE categories SET name = @name, type = @type, icon = @icon, color = @color, updated_at = datetime('now','localtime') WHERE id = @id"
  )
  return update.run(data)
}

export function deleteCategory(id: number): unknown {
  return db.transaction(() => {
    db.prepare(
      "UPDATE transactions SET category_id = NULL, updated_at = datetime('now','localtime') WHERE category_id = ?"
    ).run(id)
    return db
      .prepare(
        "UPDATE categories SET deleted_at = datetime('now','localtime'), updated_at = datetime('now','localtime') WHERE id = ?"
      )
      .run(id)
  })()
}

export function getBudget(month: string): unknown {
  return db
    .prepare('SELECT *, amount_satang / 100.0 AS amount FROM budgets WHERE month = ?')
    .get(month)
}

export function setBudget(data: { month: string; amount: number }): unknown {
  const stmt = db.prepare(
    "INSERT INTO budgets (month, amount, amount_satang, updated_at) VALUES (@month, 0, @amount_satang, datetime('now','localtime')) ON CONFLICT(month) DO UPDATE SET amount_satang = @amount_satang, updated_at = datetime('now','localtime')"
  )
  return stmt.run({ ...data, amount_satang: toSatang(data.amount) })
}

export function getAllData(): {
  transactions: {
    sync_id: string
    type: string
    amount: number
    category_sync_id: string | null
    date: string
    note?: string
    updated_at?: string
    deleted_at?: string
  }[]
  categories: {
    sync_id: string
    name: string
    type: string
    icon?: string
    color?: string
    updated_at?: string
    deleted_at?: string
  }[]
  budgets: { month: string; amount: number; updated_at?: string }[]
} {
  return {
    transactions: db
      .prepare(
        'SELECT t.sync_id, t.type, t.amount_satang / 100.0 AS amount, t.date, t.note, t.updated_at, t.deleted_at, c.sync_id AS category_sync_id FROM transactions t LEFT JOIN categories c ON t.category_id = c.id ORDER BY t.id'
      )
      .all(),
    categories: db
      .prepare(
        'SELECT sync_id, name, type, icon, color, updated_at, deleted_at FROM categories ORDER BY id'
      )
      .all(),
    budgets: db
      .prepare(
        'SELECT month, amount_satang / 100.0 AS amount, updated_at FROM budgets ORDER BY month'
      )
      .all()
  }
}

function validateSyncPayload(data: unknown): asserts data is {
  transactions: {
    sync_id: string
    type: string
    amount: number
    category_sync_id: string | null
    date: string
    note?: string
    updated_at?: string
    deleted_at?: string
  }[]
  categories: {
    sync_id: string
    name: string
    type: string
    icon?: string
    color?: string
    updated_at?: string
    deleted_at?: string
  }[]
  budgets: { month: string; amount: number; updated_at?: string }[]
} {
  if (!data || typeof data !== 'object') throw new Error('Invalid sync data: expected object')
  const d = data as Record<string, unknown>
  if (!Array.isArray(d.transactions))
    throw new Error('Invalid sync data: transactions must be an array')
  if (!Array.isArray(d.categories))
    throw new Error('Invalid sync data: categories must be an array')
  if (!Array.isArray(d.budgets)) throw new Error('Invalid sync data: budgets must be an array')
  for (const value of d.categories) {
    const item = value as Record<string, unknown>
    if (
      !item ||
      typeof item.sync_id !== 'string' ||
      !item.sync_id ||
      typeof item.name !== 'string' ||
      (item.type !== 'income' && item.type !== 'expense')
    ) {
      throw new Error('Invalid sync data: malformed category')
    }
  }
  for (const value of d.transactions) {
    const item = value as Record<string, unknown>
    if (
      !item ||
      typeof item.sync_id !== 'string' ||
      !item.sync_id ||
      (item.type !== 'income' && item.type !== 'expense') ||
      typeof item.amount !== 'number' ||
      !Number.isFinite(item.amount) ||
      typeof item.date !== 'string'
    ) {
      throw new Error('Invalid sync data: malformed transaction')
    }
  }
  for (const value of d.budgets) {
    const item = value as Record<string, unknown>
    if (!item || typeof item.month !== 'string' || typeof item.amount !== 'number') {
      throw new Error('Invalid sync data: malformed budget')
    }
  }
}

export function replaceAllData(data: unknown): void {
  validateSyncPayload(data)
  const t = db.transaction(() => {
    db.prepare('DELETE FROM transactions').run()
    db.prepare('DELETE FROM categories').run()
    db.prepare('DELETE FROM budgets').run()

    const insCat = db.prepare(
      "INSERT INTO categories (sync_id, name, type, icon, color, updated_at, deleted_at) VALUES (@sync_id, @name, @type, @icon, @color, COALESCE(@updated_at, datetime('now','localtime')), @deleted_at)"
    )
    for (const cat of data.categories) {
      insCat.run(cat)
    }

    const categoryIds = new Map(
      (
        db.prepare('SELECT id, sync_id FROM categories').all() as { id: number; sync_id: string }[]
      ).map((category) => [category.sync_id, category.id])
    )
    const insTx = db.prepare(
      "INSERT INTO transactions (sync_id, type, amount, amount_satang, category_id, date, note, updated_at, deleted_at) VALUES (@sync_id, @type, 0, @amount_satang, @category_id, @date, @note, COALESCE(@updated_at, datetime('now','localtime')), @deleted_at)"
    )
    for (const tx of data.transactions) {
      insTx.run({
        ...tx,
        amount_satang: toSatang(tx.amount),
        category_id: tx.category_sync_id ? (categoryIds.get(tx.category_sync_id) ?? null) : null
      })
    }

    const insBud = db.prepare(
      "INSERT INTO budgets (month, amount, amount_satang, updated_at) VALUES (@month, 0, @amount_satang, COALESCE(@updated_at, datetime('now','localtime')))"
    )
    for (const bud of data.budgets) {
      insBud.run({ ...bud, amount_satang: toSatang(bud.amount) })
    }
  })
  t()
}
