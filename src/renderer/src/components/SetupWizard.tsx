import { useState, type JSX } from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useL, type Lang } from '../i18n'
import logo from '../assets/logo.png'

function StepIndicator({ step }: { step: number }): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: 3 }, (_, i) => i + 1).map((s) => (
        <div
          key={s}
          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
            s === step
              ? 'bg-teal-500 w-6'
              : s < step
                ? 'bg-teal-300 dark:bg-teal-600'
                : 'bg-gray-300 dark:bg-gray-600'
          }`}
        />
      ))}
    </div>
  )
}

export default function SetupWizard({ onDone }: { onDone: (lang: Lang) => void }): JSX.Element {
  const { t, setLang } = useL()
  const [step, setStep] = useState(1)
  const [selectedLang, setSelectedLang] = useState<Lang>('en')
  const [agreed, setAgreed] = useState(false)

  const handleFinish = (): void => {
    setLang(selectedLang)
    onDone(selectedLang)
  }

  return (
    <div className="h-full w-full bg-gradient-to-br from-teal-600 via-emerald-500 to-green-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 animate-gradient bg-[length:200%_200%]">
      <div className="w-full max-w-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 animate-scale-in">
        <StepIndicator step={step} />

        {/* Step 1: Language */}
        {step === 1 && (
          <div className="text-center">
            <img src={logo} alt="NguenNguen" className="w-20 h-20 mx-auto mb-6" />
            <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-2">
              {t('setup.welcome')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">{t('setup.subtitle')}</p>

            <div className="space-y-4 mb-6">
              <button
                onClick={() => setSelectedLang('en')}
                className={`w-full py-4 px-6 rounded-2xl border-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-bold text-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                  selectedLang === 'en'
                    ? 'border-teal-500 dark:border-teal-400 shadow-lg shadow-teal-500/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-400'
                }`}
              >
                🇬🇧 {t('setup.english')}
              </button>
              <button
                onClick={() => setSelectedLang('th')}
                className={`w-full py-4 px-6 rounded-2xl border-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-bold text-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                  selectedLang === 'th'
                    ? 'border-teal-500 dark:border-teal-400 shadow-lg shadow-teal-500/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-400'
                }`}
              >
                🇹🇭 {t('setup.thai')}
              </button>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">{t('setup.later')}</p>

            <button
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold transition-all duration-300 hover:-translate-y-0.5"
            >
              {t('setup.continue')}
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Step 2: Privacy Consent */}
        {step === 2 && (
          <div className="text-left">
            <img src={logo} alt="" className="w-14 h-14 mx-auto mb-6" />
            <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2 text-center">
              {t('setup.consentTitle')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm text-center">
              {t('setup.consentDesc')}
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={12} className="text-teal-600" />
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t('setup.consentLocal')}
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={12} className="text-teal-600" />
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t('setup.consentNoTrack')}
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={12} className="text-teal-600" />
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t('setup.consentUpdate')}
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={12} className="text-teal-600" />
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t('setup.consentNetwork')}
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={12} className="text-teal-600" />
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{t('setup.consentSync')}</p>
              </div>
            </div>

            <label className="flex items-start gap-3 mb-8 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-teal-500 focus:ring-teal-400 cursor-pointer"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                {t('setup.consentAgree')}
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium transition-all duration-300"
              >
                <ChevronLeft size={20} />
                {t('common.cancel')}
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!agreed}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  agreed
                    ? 'bg-teal-500 hover:bg-teal-600 text-white hover:-translate-y-0.5'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {t('setup.continue')}
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Ready */}
        {step === 3 && (
          <div className="text-center">
            <img src={logo} alt="NguenNguen" className="w-20 h-20 mx-auto mb-6" />
            <div className="w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
              <Check size={24} className="text-green-500" />
            </div>
            <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-2">
              {t('setup.readyTitle')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">{t('setup.readyDesc')}</p>
            <button
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              {t('setup.start')}
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
