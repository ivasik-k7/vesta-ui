import { Check, Globe } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { LANGUAGES } from '@/lib/i18n'

/** Compact globe menu — language is discoverable everywhere, not just settings. */
export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const current = LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ?? LANGUAGES[0]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
        aria-label="Change language"
      >
        <Globe className="size-4" aria-hidden />
        <span className="hidden sm:inline">{current?.label}</span>
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                void i18n.changeLanguage(lang.code)
                setOpen(false)
              }}
              className="flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-secondary"
            >
              {lang.label}
              {i18n.resolvedLanguage === lang.code ? (
                <Check className="size-3.5 text-flame" aria-hidden />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
