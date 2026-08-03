import type Database from 'better-sqlite3'

export const SCHEMA_VERSION = 3

export function migrateDatabase(db: Database.Database): void {
  const schemaVersion = db.pragma('user_version', { simple: true }) as number
  db.transaction(() => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        updated_at TEXT DEFAULT (datetime('now','localtime')),
        sync_id TEXT,
        deleted_at TEXT
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        category_id INTEGER,
        date TEXT NOT NULL,
        note TEXT,
        updated_at TEXT DEFAULT (datetime('now','localtime')),
        sync_id TEXT,
        deleted_at TEXT,
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

    for (const table of ['transactions', 'categories', 'budgets']) {
      try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN updated_at TEXT`)
      } catch {
        // column already exists
      }
      db.exec(
        `UPDATE ${table} SET updated_at = datetime('now','localtime') WHERE updated_at IS NULL`
      )
    }

    for (const table of ['transactions', 'categories']) {
      for (const column of ['sync_id TEXT', 'deleted_at TEXT']) {
        try {
          db.exec(`ALTER TABLE ${table} ADD COLUMN ${column}`)
        } catch {
          // column already exists
        }
      }
      db.exec(`UPDATE ${table} SET sync_id = 'legacy-${table}-' || id WHERE sync_id IS NULL`)
      db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_${table}_sync_id ON ${table}(sync_id)`)
    }

    if (schemaVersion < 3) {
      for (const table of ['transactions', 'budgets']) {
        try {
          db.exec(`ALTER TABLE ${table} ADD COLUMN amount_satang INTEGER`)
        } catch {
          // column already exists
        }
        db.exec(
          `UPDATE ${table} SET amount_satang = ROUND(amount * 100) WHERE amount_satang IS NULL`
        )
      }
    }
    db.pragma(`user_version = ${SCHEMA_VERSION}`)
  })()
}
