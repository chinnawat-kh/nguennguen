import { createContext, useContext } from 'react'
import en from './en'
import th from './th'

export type Lang = 'en' | 'th'

const locales = { en, th }

export type TranslationKeys = keyof typeof en

function resolve(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj as unknown)
}

export function createT(
  lang: Lang
): (key: string, params?: Record<string, string | number>) => string {
  const dict = locales[lang]
  return (key: string, params?: Record<string, string | number>): string => {
    const value = resolve(dict, key)
    let str = typeof value === 'string' ? value : key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{{${k}}}`, String(v))
      }
    }
    return str
  }
}

export type T = (key: string, params?: Record<string, string | number>) => string

export interface LanguageContextValue {
  lang: Lang
  t: T
  setLang: (l: Lang) => void
}

export const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  t: createT('en'),
  setLang: () => {}
})

export function useL(): LanguageContextValue {
  return useContext(LanguageContext)
}
