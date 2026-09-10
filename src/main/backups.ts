import { app, dialog } from 'electron'
import { mkdirSync, writeFileSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createBackup, parseBackup } from './backupFormat'
import { getAllData, replaceAllData } from './database'

let busy = false

export function saveRecoveryBackup(): string {
  const directory = join(app.getPath('userData'), 'backups')
  mkdirSync(directory, { recursive: true })
  const path = join(directory, `before-restore-${Date.now()}-${randomUUID()}.json`)
  writeFileSync(path, createBackup(getAllData()), { encoding: 'utf8', flag: 'wx', mode: 0o600 })
  return path
}

export async function exportBackup(): Promise<string | null> {
  if (busy) throw new Error('Backup operation already in progress')
  busy = true
  try {
    const result = await dialog.showSaveDialog({
      defaultPath: `nguennguen-backup-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'NguenNguen backup', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return null
    writeFileSync(result.filePath, createBackup(getAllData()), { encoding: 'utf8', mode: 0o600 })
    return result.filePath
  } finally {
    busy = false
  }
}

export async function importBackup(): Promise<string | null> {
  if (busy) throw new Error('Backup operation already in progress')
  busy = true
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'NguenNguen backup', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePaths[0]) return null
    const path = result.filePaths[0]
    if (statSync(path).size > 50 * 1024 * 1024) throw new Error('Backup exceeds 50 MB')
    const data = parseBackup(readFileSync(path, 'utf8'))
    const th = app.getLocale().startsWith('th')
    const confirmation = await dialog.showMessageBox({
      type: 'warning',
      buttons: th ? ['ยกเลิก', 'กู้คืนและแทนที่ข้อมูล'] : ['Cancel', 'Restore and replace'],
      defaultId: 0,
      cancelId: 0,
      message: th
        ? 'แทนที่ข้อมูลปัจจุบันด้วยไฟล์สำรองนี้หรือไม่?'
        : 'Replace current data with this backup?',
      detail: `${path}\n${data.transactions.length} transactions / ${data.categories.length} categories / ${data.budgets.length} budgets\n${th ? 'ระบบจะสำรองข้อมูลปัจจุบันก่อนกู้คืน ข้อมูลบนคลาวด์จะไม่ถูกเปลี่ยนแปลง' : 'A recovery backup will be saved first. Cloud data will not be changed.'}`
    })
    if (confirmation.response !== 1) return null
    const recovery = saveRecoveryBackup()
    replaceAllData(data)
    return recovery
  } finally {
    busy = false
  }
}
