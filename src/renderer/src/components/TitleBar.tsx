import { useState, useEffect, type JSX } from 'react'
import { Minus, Maximize2, Minimize2, X, Globe, Sun, Moon, Settings } from 'lucide-react'
import { useL } from '../i18n'
import logo from '../assets/logo.png'

interface TitleBarProps {
  minimal?: boolean
  lang?: string
  onToggleLang?: () => void
  darkMode?: boolean
  onToggleDark?: () => void
  onOpenSettings?: () => void
}

export default function TitleBar({
  minimal,
  lang,
  onToggleLang,
  darkMode,
  onToggleDark,
  onOpenSettings
}: TitleBarProps): JSX.Element {
  const { t } = useL()
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.api.windowIsMaximized().then(setIsMaximized)
    const unsub = window.api.onWindowStateChange((maximized) => setIsMaximized(maximized))
    return () => unsub()
  }, [])

  return (
    <div
      className="titlebar h-11 flex-shrink-0 flex items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 select-none"
      onDoubleClick={() => window.api.windowMaximize()}
    >
      {!minimal ? (
        <div className="flex items-center gap-2 pl-3">
          <img src={logo} alt="" className="w-6 h-6" />
          <span className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-white">
            {t('app.name')}
          </span>
        </div>
      ) : (
        <div className="flex items-center pl-3">
          <img src={logo} alt="" className="w-5 h-5" />
        </div>
      )}

      <div className="flex-1" />

      <div className="flex items-center h-full">
        {!minimal && (
          <>
            <button
              className="titlebar-btn flex items-center gap-1 px-2.5 h-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold transition-colors"
              onClick={onToggleLang}
            >
              <Globe size={13} />
              <span>{lang === 'en' ? 'EN' : 'TH'}</span>
            </button>
            <button
              className="titlebar-btn px-2.5 h-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              onClick={onToggleDark}
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              className="titlebar-btn px-2.5 h-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              onClick={onOpenSettings}
              aria-label={t('nav.syncSettings')}
            >
              <Settings size={14} />
            </button>
          </>
        )}

        <button
          className="titlebar-btn px-3.5 h-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors flex items-center justify-center"
          onClick={() => window.api.windowMinimize()}
        >
          <Minus size={14} />
        </button>
        <button
          className="titlebar-btn px-3.5 h-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors flex items-center justify-center"
          onClick={() => window.api.windowMaximize()}
        >
          {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
        <button
          className="titlebar-btn px-3.5 h-full hover:bg-red-500 hover:text-white text-gray-600 dark:text-gray-300 transition-colors flex items-center justify-center"
          onClick={() => window.api.windowClose()}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
