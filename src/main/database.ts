import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

const userDataPath = app.getPath('userData')
const dbPath = join(userDataPath, 'nguennguen.sqlite')

// Initialize DB
const db = new Database(dbPath)

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id INTEGER,
      date TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL,
      amount REAL NOT NULL,
      UNIQUE(month)
    );
  `)

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

export function getTransactions(month?: string) {
  if (month) {
    return db
      .prepare(
        'SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.date LIKE ? ORDER BY t.date DESC'
      )
      .all(`${month}-%`)
  }
  return db
    .prepare(
      'SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon FROM transactions t LEFT JOIN categories c ON t.category_id = c.id ORDER BY t.date DESC'
    )
    .all()
}

export function addTransaction(data: any) {
  const insert = db.prepare(
    'INSERT INTO transactions (type, amount, category_id, date, note) VALUES (@type, @amount, @category_id, @date, @note)'
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
}) {
  const update = db.prepare(
    'UPDATE transactions SET type = @type, amount = @amount, category_id = @category_id, date = @date, note = @note WHERE id = @id'
  )
  return update.run(data)
}

export function deleteTransaction(id: number) {
  return db.prepare('DELETE FROM transactions WHERE id = ?').run(id)
}

export function getCategories() {
  return db.prepare('SELECT * FROM categories').all()
}

export function addCategory(data: { name: string; type: string; icon: string; color: string }) {
  const insert = db.prepare(
    'INSERT INTO categories (name, type, icon, color) VALUES (@name, @type, @icon, @color)'
  )
  return insert.run(data)
}

export function updateCategory(data: {
  id: number
  name: string
  type: string
  icon: string
  color: string
}) {
  const update = db.prepare(
    'UPDATE categories SET name = @name, type = @type, icon = @icon, color = @color WHERE id = @id'
  )
  return update.run(data)
}

export function deleteCategory(id: number) {
  return db.prepare('DELETE FROM categories WHERE id = ?').run(id)
}

export function getBudget(month: string) {
  return db.prepare('SELECT * FROM budgets WHERE month = ?').get(month)
}

export function setBudget(data: { month: string; amount: number }) {
  const stmt = db.prepare(`
    INSERT INTO budgets (month, amount) VALUES (@month, @amount)
    ON CONFLICT(month) DO UPDATE SET amount = @amount
  `)
  return stmt.run(data)
}
