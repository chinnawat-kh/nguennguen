import { test, expect, _electron as electron } from '@playwright/test'
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('Electron transaction entry, focus, historical filters and persistence', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'nguennguen-ui-'))
  const env: NodeJS.ProcessEnv = { ...process.env, NGUENNGUEN_TEST_DIR: directory }
  delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ args: ['tests/electron-entry.cjs'], env })
  try {
    const page = await app.firstWindow()
    await page.evaluate(() => localStorage.setItem('nguennguen-lang', 'en'))
    await page.reload()
    await page.locator('aside').getByRole('button', { name: 'Transactions', exact: true }).click()
    await page.getByRole('button', { name: 'Add new', exact: true }).click()
    const form = page.getByRole('dialog')
    await form.getByRole('spinbutton').fill('123.45')
    const note = form.getByPlaceholder('Additional details (optional)')
    await note.pressSequentially('Historical grocery')
    await expect(note).toBeFocused()
    await page.keyboard.press('Control+n')
    await expect(note).toHaveValue('Historical grocery')
    await form.locator('select').selectOption({ label: 'Food' })
    await form.getByRole('textbox', { name: 'Date', exact: true }).fill('31/2/2000')
    await form.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(form.getByText('Enter a valid date.')).toBeVisible()
    await form.getByRole('textbox', { name: 'Date', exact: true }).fill('29/2/2000')
    await form.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(form).toHaveCount(0)
    await page.getByRole('combobox', { name: 'Period' }).selectOption('all')
    await expect(page.locator('table').getByText('Historical grocery')).toBeVisible()
    const dates = page.getByRole('textbox', { name: 'Date', exact: true })
    await dates.nth(0).fill('1/2/2000')
    await dates.nth(1).fill('29/2/2000')
    await dates.nth(1).press('Tab')
    await expect(page.getByRole('combobox', { name: 'Period' })).toHaveValue('custom')
    await expect(page.locator('table').getByText('Historical grocery')).toBeVisible()
    await dates.nth(0).fill('1/3/2000')
    await dates.nth(0).press('Tab')
    await expect(page.getByRole('alert')).toContainText('Enter valid dates')
    await page.reload()
    await page.getByRole('combobox', { name: 'Period' }).selectOption('all')
    await expect(page.locator('table').getByText('Historical grocery')).toBeVisible()
    await page.screenshot({ path: 'test-results/transactions-desktop.png', animations: 'disabled' })
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(560, 740))
    await page.screenshot({ path: 'test-results/transactions-mobile.png', animations: 'disabled' })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true)
  } finally {
    await app.close()
  }
})

test('budget estimate, edit/delete and backup restore use the real database', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'nguennguen-backup-ui-'))
  const env: NodeJS.ProcessEnv = { ...process.env, NGUENNGUEN_TEST_DIR: directory }
  delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ args: ['tests/electron-entry.cjs'], env })
  try {
    const page = await app.firstWindow()
    await page.evaluate(() => localStorage.setItem('nguennguen-lang', 'en'))
    await page.reload()
    await page.getByRole('button', { name: 'Set budget now' }).click()
    await page.getByRole('dialog').getByRole('spinbutton').fill('3000')
    await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.locator('main select').selectOption('yearly')
    await expect(page.getByRole('heading', { name: 'Estimated annual budget' })).toBeVisible()
    await expect(page.getByText(/This month’s budget × 12/)).toBeVisible()

    await page.locator('aside').getByRole('button', { name: 'Transactions', exact: true }).click()
    await page.getByRole('button', { name: 'Add new', exact: true }).click()
    const form = page.getByRole('dialog')
    await form.getByRole('spinbutton').fill('50')
    await form.locator('select').selectOption({ label: 'Food' })
    await form.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(form).toHaveCount(0)
    await page.locator('table').getByRole('button', { name: 'Edit Food' }).click()
    await form.getByRole('spinbutton').fill('75')
    await form.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(form).toHaveCount(0)
    await expect
      .poll(() => page.evaluate(async () => (await window.api.getTransactions())[0].amount))
      .toBe(75)

    const filePath = join(directory, 'saved.json')
    await app.evaluate(({ dialog }, path) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: path })
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false })
    }, filePath)
    await page.getByRole('button', { name: 'Sync Settings', exact: true }).click()
    await page.getByRole('button', { name: 'Save backup', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Backup saved:' })).toBeVisible()
    const backup = JSON.parse(await readFile(filePath, 'utf8'))
    expect(backup.data.transactions[0].amount).toBe(75)
    expect(backup.data.budgets[0].amount).toBe(3000)
    await page.keyboard.press('Escape')
    await page.locator('table').getByRole('button', { name: 'Confirm Food' }).click()
    await page.locator('table').getByRole('button', { name: 'Confirm', exact: true }).click()
    await expect
      .poll(() => page.evaluate(async () => (await window.api.getTransactions()).length))
      .toBe(0)
    await page.getByRole('button', { name: 'Sync Settings', exact: true }).click()
    await page.getByRole('button', { name: 'Restore backup', exact: true }).click()
    const restored = page.getByRole('status').filter({ hasText: 'Data restored.' })
    await expect(restored).toBeVisible()
    await expect
      .poll(() => page.evaluate(async () => (await window.api.getTransactions())[0]?.amount))
      .toBe(75)
    const recoveryPath = (await restored.innerText()).split('Previous data saved at: ')[1]
    const recovery = JSON.parse(await readFile(recoveryPath, 'utf8'))
    expect(recovery.data.transactions[0].deleted_at).toBeTruthy()
    expect(recovery.data.categories.length).toBe(backup.data.categories.length)
    await writeFile(filePath, '{"format":"invalid"}')
    await page.getByRole('button', { name: 'Restore backup', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Could not complete')
    expect(await page.evaluate(async () => (await window.api.getTransactions())[0].amount)).toBe(75)
    expect((await readdir(join(directory, 'backups'))).length).toBe(1)
  } finally {
    await app.close()
  }
})

test('migration snapshots preserve the old database before schema upgrades', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'nguennguen-migration-ui-'))
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NGUENNGUEN_TEST_DIR: directory,
    NGUENNGUEN_SEED_LEGACY: '1'
  }
  delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ args: ['tests/electron-entry.cjs'], env })
  try {
    const page = await app.firstWindow()
    await expect
      .poll(() => page.evaluate(async () => (await window.api.getTransactions())[0]?.amount))
      .toBe(12.34)
    const snapshots = await readdir(join(directory, 'backups'))
    expect(snapshots).toHaveLength(1)
    const bytes = await readFile(join(directory, 'backups', snapshots[0]))
    expect(bytes.subarray(0, 15).toString()).toBe('SQLite format 3')
    expect(bytes.readUInt32BE(60)).toBe(0) // SQLite user_version in the untouched v0 header.
  } finally {
    await app.close()
  }
})

test('dirty category and budget forms stay open when discard is cancelled', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'nguennguen-guards-ui-'))
  const env: NodeJS.ProcessEnv = { ...process.env, NGUENNGUEN_TEST_DIR: directory }
  delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ args: ['tests/electron-entry.cjs'], env })
  try {
    const page = await app.firstWindow()
    await page.evaluate(() => localStorage.setItem('nguennguen-lang', 'en'))
    await page.reload()
    await page.evaluate(() => {
      window.confirm = () => false
    })
    await page.getByRole('button', { name: 'Set budget now' }).click()
    const form = page.getByRole('dialog')
    await form.getByRole('spinbutton').fill('999')
    await page.keyboard.press('Escape')
    await expect(form.getByRole('spinbutton')).toHaveValue('999')
    await page.evaluate(() => {
      window.confirm = () => true
    })
    await form.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(form).toHaveCount(0)
    await page.locator('aside').getByRole('button', { name: 'Categories', exact: true }).click()
    await page.getByRole('button', { name: 'Add category', exact: true }).click()
    await form.getByPlaceholder('e.g. Food, Transport, Salary').fill('Unsaved category')
    await page.evaluate(() => {
      window.confirm = () => false
    })
    await form.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(form.getByPlaceholder('e.g. Food, Transport, Salary')).toHaveValue(
      'Unsaved category'
    )
    await form.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(form).toHaveCount(0)
    await expect(page.locator('table').getByText('Unsaved category')).toBeVisible()
    // Inject an IPC failure only in this isolated test process to verify pending-save guards.
    await app.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('add-category')
      ipcMain.handle('add-category', async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        throw new Error('Simulated database write failure')
      })
    })
    await page.getByRole('button', { name: 'Add category', exact: true }).click()
    const name = form.getByPlaceholder('e.g. Food, Transport, Salary')
    await name.fill('Keep after failure')
    await form.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(form.getByRole('button', { name: 'Cancel', exact: true })).toBeDisabled()
    await page.keyboard.press('Escape')
    await expect(form).toBeVisible()
    await expect(name).toBeEnabled()
    await expect(name).toHaveValue('Keep after failure')
    await expect(
      page.getByText('Could not save. Your entries are still here; please try again.')
    ).toBeVisible()
  } finally {
    await app.close()
  }
})
