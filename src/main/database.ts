import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

const userDataPath = app.getPath('userData')
const dbPath = join(userDataPath, 'nguennguen.sqlite')

// Initialize DB
const db = new Database(dbPath)

export function initDB(): void {
  const migration = db.transaction(() => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        updated_at TEXT DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        category_id INTEGER,
        date TEXT NOT NULL,
        note TEXT,
        updated_at TEXT DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (category_id) REFERENCES categories (id)
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT NOT NULL,
        amount REAL NOT NULL,
        updated_at TEXT DEFAULT (datetime('now','localtime')),
        UNIQUE(month)
      );
    `)

    // Migration: add updated_at to existing tables
    for (const table of ['transactions', 'categories', 'budgets']) {
      try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN updated_at TEXT`)
        db.exec(
          `UPDATE ${table} SET updated_at = datetime('now','localtime') WHERE updated_at IS NULL`
        )
      } catch {
        // column already exists — ignore
      }
    }
  })
  migration()

  const count = db.prepare('SELECT count(*) as count FROM categories').get() as { count: number }
  if (count.count === 0) {
    const insert = db.prepare(
      'INSERT INTO categories (name, type, icon, color) VALUES (@name, @type, @icon, @color)'
    )
    const defaultCategories = [
      { name: 'Food', type: 'expense', icon: 'Utensils', color: '#ef4444' },
      { name: 'Travel', type: 'expense', icon: 'Car', color: '#3b82f6' },
      { name: 'Salary', type: 'income', icon: 'Banknote', color: '#10b981' },
      { name: 'Entertainment', type: 'expense', icon: 'Film', color: '#a855f7' }
    ]
    for (const cat of defaultCategories) {
      insert.run(cat)
    }
  }
}

function getNextMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 1).toISOString().substring(0, 7)
}

export function getTransactions(month?: string): unknown[] {
  if (month) {
    const start = `${month}-01`
    const end = `${getNextMonth(month)}-01`
    return db
      .prepare(
        'SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.date >= ? AND t.date < ? ORDER BY t.date DESC'
      )
      .all(start, end)
  }
  return db
    .prepare(
      'SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon FROM transactions t LEFT JOIN categories c ON t.category_id = c.id ORDER BY t.date DESC'
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
  const insert = db.prepare(
    "INSERT INTO transactions (type, amount, category_id, date, note, updated_at) VALUES (@type, @amount, @category_id, @date, @note, datetime('now','localtime'))"
  )
  return insert.run(data)
}

export function updateTransaction(data: {
  id: number
  type: string
  amount: number
  category_id: number
  date: string
  note?: string
}): unknown {
  const update = db.prepare(
    "UPDATE transactions SET type = @type, amount = @amount, category_id = @category_id, date = @date, note = @note, updated_at = datetime('now','localtime') WHERE id = @id"
  )
  return update.run(data)
}

export function deleteTransaction(id: number): unknown {
  return db.prepare('DELETE FROM transactions WHERE id = ?').run(id)
}

export function getCategories(): unknown[] {
  return db.prepare('SELECT * FROM categories').all()
}

export function addCategory(data: {
  name: string
  type: string
  icon: string
  color: string
}): unknown {
  const insert = db.prepare(
    "INSERT INTO categories (name, type, icon, color, updated_at) VALUES (@name, @type, @icon, @color, datetime('now','localtime'))"
  )
  return insert.run(data)
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
  return db.prepare('DELETE FROM categories WHERE id = ?').run(id)
}

export function getBudget(month: string): unknown {
  return db.prepare('SELECT * FROM budgets WHERE month = ?').get(month)
}

export function setBudget(data: { month: string; amount: number }): unknown {
  const stmt = db.prepare(
    "INSERT INTO budgets (month, amount, updated_at) VALUES (@month, @amount, datetime('now','localtime')) ON CONFLICT(month) DO UPDATE SET amount = @amount, updated_at = datetime('now','localtime')"
  )
  return stmt.run(data)
}

export function getAllData(): {
  transactions: {
    id: number
    type: string
    amount: number
    category_id: number
    date: string
    note?: string
    updated_at?: string
  }[]
  categories: {
    id: number
    name: string
    type: string
    icon?: string
    color?: string
    updated_at?: string
  }[]
  budgets: { id: number; month: string; amount: number; updated_at?: string }[]
} {
  return {
    transactions: db.prepare('SELECT * FROM transactions ORDER BY id').all(),
    categories: db.prepare('SELECT * FROM categories ORDER BY id').all(),
    budgets: db.prepare('SELECT * FROM budgets ORDER BY month').all()
  }
}

function validateSyncPayload(data: unknown): asserts data is {
  transactions: {
    type: string
    amount: number
    category_id: number
    date: string
    note?: string
    updated_at?: string
  }[]
  categories: {
    id: number
    name: string
    type: string
    icon?: string
    color?: string
    updated_at?: string
  }[]
  budgets: { id: number; month: string; amount: number; updated_at?: string }[]
} {
  if (!data || typeof data !== 'object') throw new Error('Invalid sync data: expected object')
  const d = data as Record<string, unknown>
  if (!Array.isArray(d.transactions))
    throw new Error('Invalid sync data: transactions must be an array')
  if (!Array.isArray(d.categories))
    throw new Error('Invalid sync data: categories must be an array')
  if (!Array.isArray(d.budgets)) throw new Error('Invalid sync data: budgets must be an array')
}

export function replaceAllData(data: unknown): void {
  validateSyncPayload(data)
  const t = db.transaction(() => {
    db.prepare('DELETE FROM transactions').run()
    db.prepare('DELETE FROM categories').run()
    db.prepare('DELETE FROM budgets').run()

    const insTx = db.prepare(
      "INSERT INTO transactions (type, amount, category_id, date, note, updated_at) VALUES (@type, @amount, @category_id, @date, @note, COALESCE(@updated_at, datetime('now','localtime')))"
    )
    for (const tx of data.transactions) {
      insTx.run(tx)
    }

    const insCat = db.prepare(
      "INSERT INTO categories (name, type, icon, color, updated_at) VALUES (@name, @type, @icon, @color, COALESCE(@updated_at, datetime('now','localtime')))"
    )
    for (const cat of data.categories) {
      insCat.run(cat)
    }

    const insBud = db.prepare(
      "INSERT INTO budgets (month, amount, updated_at) VALUES (@month, @amount, COALESCE(@updated_at, datetime('now','localtime'))) ON CONFLICT(month) DO UPDATE SET amount = @amount, updated_at = COALESCE(@updated_at, datetime('now','localtime'))"
    )
    for (const bud of data.budgets) {
      insBud.run(bud)
    }
  })
  t()
}
