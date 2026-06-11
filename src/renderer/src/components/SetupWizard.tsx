import { Globe } from 'lucide-react'
import { useL, type Lang } from '../i18n'

export default function SetupWizard({ onDone }: { onDone: (lang: Lang) => void }) {
  const { t, setLang } = useL()

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-600 via-blue-500 to-teal-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center">
          <Globe size={32} className="text-blue-500" />
        </div>

        <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-2">
          {t('setup.welcome')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">{t('setup.subtitle')}</p>

        <div className="space-y-3 mb-6">
          <button
            onClick={() => {
              setLang('en')
              onDone('en')
            }}
            className="w-full py-4 px-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-bold text-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            {t('setup.english')}
          </button>
          <button
            onClick={() => {
              setLang('th')
              onDone('th')
            }}
            className="w-full py-4 px-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-bold text-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            {t('setup.thai')}
          </button>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">{t('setup.later')}</p>
      </div>
    </div>
  )
}
