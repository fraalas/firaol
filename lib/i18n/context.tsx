'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, type Locale, type TranslationKey } from './translations'

interface I18nCtx {
  locale: Locale
  t: (key: TranslationKey) => string
  setLocale: (l: Locale) => void
}

const I18nContext = createContext<I18nCtx>({
  locale: 'en',
  t: (k) => translations.en[k] as string,
  setLocale: () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const saved = localStorage.getItem('sanchos-locale') as Locale | null
    if (saved === 'en' || saved === 'am') setLocaleState(saved)
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    localStorage.setItem('sanchos-locale', l)
  }

  function t(key: TranslationKey): string {
    return (translations[locale][key] as string) ?? (translations.en[key] as string) ?? key
  }

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
