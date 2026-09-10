/* eslint-disable @typescript-eslint/no-require-imports -- Electron test bootstrap is CommonJS. */
const { app } = require('electron')
const { isAbsolute } = require('node:path')
const directory = process.env.NGUENNGUEN_TEST_DIR
if (!directory || !isAbsolute(directory)) throw new Error('An isolated test directory is required')
app.setPath('userData', directory)
if (process.env.NGUENNGUEN_SEED_LEGACY === '1') {
  const Database = require('better-sqlite3')
  const { join } = require('node:path')
  const db = new Database(join(directory, 'nguennguen.sqlite'))
  db.exec(`
    CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL, icon TEXT, color TEXT);
    CREATE TABLE transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, amount REAL NOT NULL, category_id INTEGER, date TEXT NOT NULL, note TEXT);
    CREATE TABLE budgets (id INTEGER PRIMARY KEY AUTOINCREMENT, month TEXT NOT NULL UNIQUE, amount REAL NOT NULL);
    INSERT INTO categories (name, type, icon, color) VALUES ('Legacy', 'expense', 'Tag', '#ff0000');
    INSERT INTO transactions (type, amount, category_id, date, note) VALUES ('expense', 12.34, 1, '2000-01-01', 'legacy record');
  `)
  db.close()
}
require('../out/main/index.js')
