'use client'
import { useI18n } from '@/lib/i18n/context'

export function LanguageToggle() {
  const { locale, setLocale } = useI18n()

  return (
    <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
      {(['en', 'am'] as const).map(l => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
            locale === l
              ? 'bg-white text-[#1A3A6B]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          {l === 'en' ? 'EN' : 'አማ'}
        </button>
      ))}
    </div>
  )
}
