import { useState, useEffect, useCallback, type JSX } from 'react'
import { RotateCw, RefreshCw, DownloadCloud, ExternalLink } from 'lucide-react'
import { useL } from '../i18n'
import logo from '../assets/logo.png'

interface AboutSectionProps {
  version: string
}

export default function AboutSection({ version }: AboutSectionProps): JSX.Element {
  const { t } = useL()
  const [updateState, setUpdateState] = useState<
    'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'no-update' | 'error'
  >('idle')
  const [progress, setProgress] = useState(0)
  const [updateVersion, setUpdateVersion] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const cleanup = window.api.onUpdateEvent((event) => {
      switch (event.type) {
        case 'checking':
          setUpdateState('checking')
          break
        case 'available':
          setUpdateState('available')
          setUpdateVersion(event.data?.version || '')
          break
        case 'not-available':
          setUpdateState('no-update')
          break
        case 'progress':
          setUpdateState('downloading')
          setProgress(Math.round(event.data?.percent || 0))
          break
        case 'downloaded':
          setUpdateState('downloaded')
          break
        case 'error':
          setUpdateState('error')
          setErrorMsg(event.data || t('update.downloadError'))
          break
      }
    })
    return () => cleanup()
  }, [t])

  const handleCheck = useCallback((): void => {
    setUpdateState('checking')
    window.api.checkForUpdates()
  }, [])

  const handleDownload = useCallback((): void => {
    setUpdateState('downloading')
    setProgress(0)
    window.api.downloadUpdate()
  }, [])

  const handleInstall = useCallback((): void => {
    window.api.installUpdate()
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
        <img src={logo} alt="" className="w-10 h-10" />
        <div className="flex-1">
          <p className="text-sm font-medium">{t('about.title')}</p>
          <p className="text-xs font-mono bg-white dark:bg-gray-600 inline-block px-2 py-0.5 rounded mt-1">
            {t('about.version', { version })}
          </p>
        </div>
      </div>

      {updateState === 'idle' && (
        <button
          onClick={handleCheck}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-sm font-medium transition-all duration-300"
        >
          <RotateCw size={16} />
          {t('nav.checkUpdates')}
        </button>
      )}

      {updateState === 'checking' && (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500">
          <RefreshCw size={16} className="animate-spin" />
          {t('update.checking')}
        </div>
      )}

      {updateState === 'available' && (
        <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-900/20 space-y-3">
          <p className="text-sm font-medium text-teal-700 dark:text-teal-400">
            {t('update.available', { version: updateVersion })}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-all duration-300"
            >
              {t('update.restart')}
            </button>
            <button
              onClick={() => setUpdateState('idle')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm transition-all duration-300"
            >
              {t('update.later')}
            </button>
          </div>
        </div>
      )}

      {updateState === 'downloading' && (
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 space-y-2">
          <p className="text-sm text-center">{t('update.downloading', { percent: progress })}</p>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {updateState === 'downloaded' && (
        <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 space-y-3">
          <div className="flex items-center gap-2">
            <DownloadCloud size={18} className="text-green-500" />
            <p className="text-sm font-medium">{t('update.downloaded')}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-all duration-300"
            >
              {t('update.restart')}
            </button>
            <button
              onClick={() => setUpdateState('idle')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm transition-all duration-300"
            >
              {t('update.later')}
            </button>
          </div>
        </div>
      )}

      {updateState === 'no-update' && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('update.noUpdate')}</p>
          <button
            onClick={handleCheck}
            className="text-xs text-teal-500 hover:text-teal-600 font-medium"
          >
            {t('update.checkAgain')}
          </button>
        </div>
      )}

      {updateState === 'error' && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 space-y-2">
          <p className="text-sm text-rose-600 dark:text-rose-400">
            {t('update.error', { msg: errorMsg })}
          </p>
          <button
            onClick={handleCheck}
            className="flex items-center gap-1 text-xs text-teal-500 hover:text-teal-600 font-medium"
          >
            <RotateCw size={12} />
            {t('update.checkAgain')}
          </button>
        </div>
      )}

      <a
        href="https://github.com/chinnawat-kh/nguennguen"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 text-sm text-teal-500 hover:text-teal-600 transition-colors"
      >
        <ExternalLink size={14} />
        {t('about.github')}
      </a>
    </div>
  )
}
