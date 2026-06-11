import { useState, useEffect, type ReactNode } from 'react'
import { LanguageContext, createT, type Lang } from './index'

const STORAGE_KEY = 'nguennguen-lang'

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'en' || stored === 'th') return stored
    }
    return 'en'
  })

  const setLang = (l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l)
    setLangState(l)
  }

  const t = createT(lang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, t, setLang }}>{children}</LanguageContext.Provider>
  )
}
