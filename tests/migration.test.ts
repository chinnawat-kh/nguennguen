import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import Database from 'better-sqlite3'
import { migrateDatabase, SCHEMA_VERSION } from '../src/main/migrations.ts'

test('v1 database migrates to satang and remains idempotent', () => {
  const directory = mkdtempSync(join(tmpdir(), 'nguennguen-migration-'))
  const path = join(directory, 'fixture.sqlite')
  const db = new Database(path)
  try {
    db.exec(`
      CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL, icon TEXT, color TEXT);
      CREATE TABLE transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, amount REAL NOT NULL, category_id INTEGER, date TEXT NOT NULL, note TEXT);
      CREATE TABLE budgets (id INTEGER PRIMARY KEY AUTOINCREMENT, month TEXT NOT NULL UNIQUE, amount REAL NOT NULL);
      INSERT INTO categories (name, type) VALUES ('Food', 'expense');
      INSERT INTO transactions (type, amount, category_id, date) VALUES ('expense', 10.01, 1, '2026-08-03');
      INSERT INTO budgets (month, amount) VALUES ('2026-08', 123.45);
    `)

    migrateDatabase(db)
    migrateDatabase(db)

    assert.equal(db.pragma('user_version', { simple: true }), SCHEMA_VERSION)
    assert.deepEqual(
      db.prepare('SELECT amount_satang, category_id, sync_id FROM transactions').get(),
      { amount_satang: 1001, category_id: 1, sync_id: 'legacy-transactions-1' }
    )
    assert.deepEqual(db.prepare('SELECT amount_satang FROM budgets').get(), {
      amount_satang: 12345
    })
    assert.equal(
      (db.prepare('SELECT sync_id FROM categories').get() as { sync_id: string }).sync_id,
      'legacy-categories-1'
    )
  } finally {
    db.close()
    rmSync(directory, { recursive: true, force: true })
  }
})
