import { useState, useEffect, type JSX } from 'react'
import {
  Download,
  Cloud,
  CloudOff,
  Upload,
  LogOut,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useL } from '../i18n'

const GOOGLE_GUIDE_URL = 'https://console.cloud.google.com/apis/credentials'

interface SyncSectionProps {
  onRefresh: () => void
}

export default function SyncSection({ onRefresh }: SyncSectionProps): JSX.Element {
  const { t } = useL()
  const [clientId, setLocalClientId] = useState('')
  const [savedClientId, setSavedClientId] = useState<string | null>(null)
  const [signedIn, setSignedIn] = useState(false)
  const [lastModifiedAt, setLastModifiedAt] = useState<string | undefined>()
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadStatus = async (): Promise<void> => {
    const [cid, status] = await Promise.all([
      window.api.getClientId(),
      window.api.getSyncStatus().catch(() => ({ signedIn: false }) as { signedIn: boolean })
    ])
    setSavedClientId(cid)
    setLocalClientId(cid || '')
    setSignedIn(status.signedIn)
    if ('lastModifiedAt' in status) {
      setLastModifiedAt(status.lastModifiedAt)
    }
  }

  useEffect(() => {
    const init = async (): Promise<void> => {
      await loadStatus()
    }
    init()
  }, [])

  const handleSaveClientId = async (): Promise<void> => {
    const trimmed = clientId.trim()
    if (!trimmed) {
      setMessage({ type: 'error', text: t('sync.clientIdRequired') })
      return
    }
    if (!trimmed.endsWith('.apps.googleusercontent.com')) {
      setMessage({ type: 'error', text: t('sync.clientIdInvalid') })
      return
    }
    await window.api.setClientId(trimmed)
    setSavedClientId(trimmed)
    setMessage({ type: 'success', text: t('sync.clientIdSaved') })
  }

  const handleSignIn = async (): Promise<void> => {
    setMessage(null)
    const result = await window.api.signInWithGoogle()
    if (result === true) {
      setMessage({ type: 'success', text: t('sync.success') })
      loadStatus()
    } else if (typeof result === 'object' && result && 'error' in result) {
      setMessage({ type: 'error', text: t('sync.error', { msg: result.error || 'Unknown error' }) })
    }
  }

  const handleSignOut = async (): Promise<void> => {
    await window.api.signOutGoogle()
    setSignedIn(false)
    setLastModifiedAt(undefined)
    setMessage({ type: 'success', text: t('sync.success') })
  }

  const handleSyncNow = async (): Promise<void> => {
    setSyncing(true)
    setMessage(null)
    const result = await window.api.syncNow()
    setSyncing(false)
    if (result.success) {
      setMessage({ type: 'success', text: t('sync.success') })
      loadStatus()
      onRefresh()
    } else {
      setMessage({ type: 'error', text: t('sync.error', { msg: result.error || 'Unknown error' }) })
    }
  }

  const handlePush = async (): Promise<void> => {
    setSyncing(true)
    setMessage(null)
    const result = await window.api.syncPush()
    setSyncing(false)
    if (result.success) {
      setMessage({ type: 'success', text: t('sync.success') })
      loadStatus()
    } else {
      setMessage({ type: 'error', text: t('sync.error', { msg: result.error || 'Unknown error' }) })
    }
  }

  const handlePull = async (): Promise<void> => {
    setSyncing(true)
    setMessage(null)
    const result = await window.api.syncPull()
    setSyncing(false)
    if (result.success) {
      setMessage({ type: 'success', text: t('sync.success') })
      loadStatus()
      onRefresh()
    } else {
      setMessage({ type: 'error', text: t('sync.error', { msg: result.error || 'Unknown error' }) })
    }
  }

  const formatTime = (iso: string | undefined): string => {
    if (!iso) return '-'
    try {
      const d = new Date(iso)
      return d.toLocaleString()
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={clientId}
          onChange={(e) => setLocalClientId(e.target.value)}
          placeholder={t('sync.clientIdPlaceholder')}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          onClick={handleSaveClientId}
          disabled={!clientId.trim() || clientId.trim() === (savedClientId || '')}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-all duration-300 disabled:cursor-not-allowed"
        >
          {t('common.save')}
        </button>
      </div>
      <a
        href={GOOGLE_GUIDE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-teal-500 hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-300"
      >
        <ExternalLink size={12} />
        {t('sync.clientIdGuide')}
      </a>

      {savedClientId && (
        <>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            {signedIn ? (
              <Cloud size={20} className="text-teal-500" />
            ) : (
              <CloudOff size={20} className="text-gray-400" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {signedIn ? t('sync.signedInAs') : t('sync.notSignedIn')}
              </p>
              {lastModifiedAt && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('sync.lastSync', { time: formatTime(lastModifiedAt) })}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {!signedIn ? (
              <button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium transition-all duration-300"
              >
                <Cloud size={16} />
                {t('sync.signIn')}
              </button>
            ) : (
              <>
                <button
                  onClick={handleSyncNow}
                  disabled={syncing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium transition-all duration-300 disabled:opacity-50"
                >
                  {syncing ? t('sync.syncing') : t('sync.syncNow')}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handlePush}
                    disabled={syncing}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-all duration-300 disabled:opacity-50"
                  >
                    <Upload size={14} />
                    {t('sync.pushData')}
                  </button>
                  <button
                    onClick={handlePull}
                    disabled={syncing}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-all duration-300 disabled:opacity-50"
                  >
                    <Download size={14} />
                    {t('sync.pullData')}
                  </button>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xs transition-all duration-300"
                >
                  <LogOut size={14} />
                  {t('sync.signOut')}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {message && (
        <div
          className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500">{t('sync.privacyNote')}</p>
    </div>
  )
}
