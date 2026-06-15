import { app, BrowserWindow, net } from 'electron'
import { createServer, type Server } from 'http'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import * as crypto from 'crypto'

// --- Config ---
const REDIRECT_PORT_START = 18888
const SCOPES = ['https://www.googleapis.com/auth/drive.file']
const CONFIG_PATH = join(app.getPath('userData'), 'sync-config.json')
const TOKEN_PATH = join(app.getPath('userData'), 'sync-tokens.json')
const FILE_NAME = 'nguennguen-sync.json'

let cachedDriveFileId: string | null = null
let activeRedirectPort = REDIRECT_PORT_START

async function findAvailablePort(start: number): Promise<number> {
  const maxAttempts = 10
  for (let port = start; port < start + maxAttempts; port++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const s = createServer()
        s.listen(port, '127.0.0.1', () => {
          s.close()
          resolve()
        })
        s.on('error', reject)
      })
      return port
    } catch {
      // port in use — try next
    }
  }
  throw new Error(`No available port found in range ${start}-${start + maxAttempts - 1}`)
}

// --- Types ---
interface Tokens {
  access_token: string
  refresh_token?: string
  expiry_date?: number
}

interface TransactionRecord {
  id: number
  type: string
  amount: number
  category_id: number
  date: string
  note?: string
  updated_at?: string
}

interface CategoryRecord {
  id: number
  name: string
  type: string
  icon?: string
  color?: string
  updated_at?: string
}

interface BudgetRecord {
  id: number
  month: string
  amount: number
  updated_at?: string
}

export interface SyncPayload {
  version: number
  syncedAt: string
  transactions: TransactionRecord[]
  categories: CategoryRecord[]
  budgets: BudgetRecord[]
}

// --- Client ID management ---
export function getClientId(): string | null {
  try {
    if (existsSync(CONFIG_PATH)) {
      const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
      return config.clientId || null
    }
  } catch {
    console.error('[sync] Corrupted config file')
  }
  return null
}

export function setClientId(clientId: string): void {
  writeFileSync(CONFIG_PATH, JSON.stringify({ clientId }, null, 2))
}

function requireClientId(): string {
  const id = getClientId()
  if (!id) throw new Error('Google Client ID not configured. Set it in Sync Settings.')
  return id
}

// --- PKCE helpers ---
function base64URLEncode(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function generateCodeVerifier(): string {
  return base64URLEncode(crypto.randomBytes(32))
}

function generateCodeChallenge(verifier: string): string {
  return base64URLEncode(crypto.createHash('sha256').update(verifier).digest())
}

// --- Token storage ---
function loadTokens(): Tokens | null {
  try {
    if (existsSync(TOKEN_PATH)) {
      return JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'))
    }
  } catch {
    console.error('[sync] Corrupted token file')
  }
  return null
}

function saveTokens(tokens: Tokens): void {
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2))
}

export function clearTokens(): void {
  cachedDriveFileId = null
  try {
    if (existsSync(TOKEN_PATH)) unlinkSync(TOKEN_PATH)
  } catch {
    // file doesn't exist — ignore
  }
}

export function isSignedIn(): boolean {
  const tokens = loadTokens()
  return !!(tokens && tokens.access_token)
}

async function exchangeCode(code: string, codeVerifier: string): Promise<Tokens> {
  const clientId = requireClientId()
  const redirectUri = `http://localhost:${activeRedirectPort}/callback`
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier
  })

  const response = await net.fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  })

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status} ${await response.text()}`)
  }

  const data = await response.json()
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: Date.now() + (data.expires_in || 3600) * 1000
  }
}

async function refreshAccessToken(refreshToken: string): Promise<Tokens> {
  const clientId = requireClientId()
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    grant_type: 'refresh_token'
  })

  const response = await net.fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  })

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`)
  }

  const data = await response.json()
  const tokens: Tokens = {
    access_token: data.access_token,
    refresh_token: refreshToken,
    expiry_date: Date.now() + (data.expires_in || 3600) * 1000
  }
  saveTokens(tokens)
  return tokens
}

async function getValidAccessToken(): Promise<string> {
  const tokens = loadTokens()
  if (!tokens) throw new Error('Not signed in')

  if (tokens.expiry_date && tokens.expiry_date > Date.now() + 60000) {
    return tokens.access_token
  }

  if (tokens.refresh_token) {
    const refreshed = await refreshAccessToken(tokens.refresh_token)
    return refreshed.access_token
  }

  throw new Error('No refresh token available')
}

// --- OAuth Sign In ---
export async function signIn(): Promise<boolean> {
  const clientId = requireClientId()
  activeRedirectPort = await findAvailablePort(REDIRECT_PORT_START)
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)
  const redirectUri = `http://localhost:${activeRedirectPort}/callback`

  const authUrl =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(SCOPES.join(' '))}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256` +
    `&access_type=offline` +
    `&prompt=consent`

  const server: Server = createServer()
  await new Promise<void>((resolve) => server.listen(activeRedirectPort, '127.0.0.1', resolve))

  const authWindow = new BrowserWindow({
    width: 600,
    height: 700,
    title: 'Sign in with Google',
    autoHideMenuBar: true,
    webPreferences: { sandbox: false }
  })

  try {
    const code = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Sign-in timed out'))
      }, 120000)

      server.on('request', (req, res) => {
        const url = new URL(req.url || '/', `http://127.0.0.1:${activeRedirectPort}`)
        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' })
          res.end('<html><body><p>Access denied. You can close this window.</p></body></html>')
          clearTimeout(timeout)
          reject(new Error('User denied access'))
          return
        }

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(
            '<html><body><p>Signed in successfully! You can close this window.</p></body></html>'
          )
          clearTimeout(timeout)
          resolve(code)
        }
      })

      authWindow.loadURL(authUrl)

      authWindow.on('closed', () => {
        clearTimeout(timeout)
        reject(new Error('Sign-in window closed'))
      })
    })

    const tokens = await exchangeCode(code, codeVerifier)
    saveTokens(tokens)
    return true
  } finally {
    authWindow.close()
    server.close()
  }
}

// --- Google Drive API ---
async function driveRequest(
  accessToken: string,
  path: string,
  options: { method?: string; body?: string; headers?: Record<string, string> } = {}
): Promise<Record<string, unknown>> {
  const { method = 'GET', body, headers = {} } = options

  const url = `https://www.googleapis.com/drive/v3${path}`

  const response = await net.fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...headers
    },
    body
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Drive API error (${response.status}): ${text}`)
  }

  return response.json()
}

async function findSyncFile(accessToken: string): Promise<string | null> {
  if (cachedDriveFileId) return cachedDriveFileId
  const data = await driveRequest(
    accessToken,
    `/files?q=name='${FILE_NAME}' and trashed=false&fields=files(id,name,modifiedTime)`
  )
  const files = (data as { files?: Array<{ id: string }> }).files || []
  const id = files.length > 0 ? files[0].id : null
  if (id) cachedDriveFileId = id
  return id
}

async function createSyncFile(accessToken: string): Promise<string> {
  const boundary = '----boundary' + Date.now()
  const metadata = JSON.stringify({ name: FILE_NAME, mimeType: 'application/json' })
  const body = [
    `--${boundary}\r\n`,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    metadata,
    `\r\n--${boundary}\r\n`,
    'Content-Type: application/json\r\n\r\n',
    '{}',
    `\r\n--${boundary}--\r\n`
  ].join('')

  const data = await driveRequest(accessToken, '/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body
  })

  return (data as { id: string }).id
}

async function readSyncFile(accessToken: string, fileId: string): Promise<SyncPayload | null> {
  try {
    const response = await net.fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!response.ok) return null
    return (await response.json()) as SyncPayload
  } catch (e) {
    console.error('[sync] Failed to read Drive file:', e)
    return null
  }
}

async function writeSyncFile(
  accessToken: string,
  fileId: string,
  payload: SyncPayload
): Promise<void> {
  const body = JSON.stringify(payload)

  await driveRequest(accessToken, `/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body
  })
}

// --- Public sync functions ---
export async function pushData(localData: {
  transactions: TransactionRecord[]
  categories: CategoryRecord[]
  budgets: BudgetRecord[]
}): Promise<{ syncedAt: string }> {
  const accessToken = await getValidAccessToken()

  let fileId = await findSyncFile(accessToken)
  if (!fileId) {
    fileId = await createSyncFile(accessToken)
  }

  const payload: SyncPayload = {
    version: 1,
    syncedAt: new Date().toISOString(),
    transactions: localData.transactions,
    categories: localData.categories,
    budgets: localData.budgets
  }

  await writeSyncFile(accessToken, fileId, payload)
  return { syncedAt: payload.syncedAt }
}

export async function pullData(): Promise<SyncPayload | null> {
  const accessToken = await getValidAccessToken()

  const fileId = await findSyncFile(accessToken)
  if (!fileId) return null

  return readSyncFile(accessToken, fileId)
}

export async function getSyncStatus(): Promise<{
  signedIn: boolean
  lastSyncedAt?: string
  lastModifiedAt?: string
}> {
  const signedIn = isSignedIn()
  if (!signedIn) return { signedIn: false }

  try {
    const accessToken = await getValidAccessToken()
    const fileId = await findSyncFile(accessToken)
    if (fileId) {
      const data = await driveRequest(accessToken, `/files/${fileId}?fields=modifiedTime`)
      return {
        signedIn: true,
        lastModifiedAt: (data as { modifiedTime?: string }).modifiedTime
      }
    }
    return { signedIn: true }
  } catch (e) {
    console.error('[sync] Failed to get sync status:', e)
    return { signedIn: false }
  }
}
