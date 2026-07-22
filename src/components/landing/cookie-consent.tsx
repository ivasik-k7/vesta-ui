import { Cookie } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const STORAGE_KEY = 'vesta:consent'

/** The gate a future analytics loader (GA) checks before setting anything. */
export function hasAnalyticsConsent(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'accepted'
}

// A minimal, terminal-styled consent card (bottom-left; the challenge widget
// owns bottom-right). Nothing is stored until the visitor decides; both choices
// persist so the card never re-asks.
export function CookieConsent() {
  const reduce = useReducedMotion()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
    const id = setTimeout(() => setOpen(true), 1400)
    return () => clearTimeout(id)
  }, [])

  const decide = (choice: 'accepted' | 'declined') => {
    localStorage.setItem(STORAGE_KEY, choice)
    setOpen(false)
    // GA bootstraps here later, gated on hasAnalyticsConsent().
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 z-50 w-[calc(100vw-2rem)] max-w-[21rem] sm:bottom-6 sm:left-6"
        >
          <div className="overflow-hidden rounded-2xl border border-line-strong bg-card/95 shadow-2xl shadow-black/40 backdrop-blur">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-flame/70 to-transparent"
            />
            <div className="flex items-center gap-2 border-border/60 border-b px-4 py-2.5 font-mono text-muted-foreground text-xs">
              <Cookie className="size-3.5 text-flame" aria-hidden />
              <span>{t('consent.header')}</span>
            </div>

            <div className="p-4">
              <p className="font-heading font-semibold text-sm">{t('consent.title')}</p>
              <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
                {t('consent.body')}
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => decide('declined')}
                  className="flex-1 rounded-lg border border-border py-2 text-muted-foreground text-xs transition-colors hover:text-foreground"
                >
                  {t('consent.decline')}
                </button>
                <button
                  type="button"
                  onClick={() => decide('accepted')}
                  className="flex-1 rounded-lg bg-flame py-2 font-medium text-primary-foreground text-xs transition-colors hover:bg-flame-hover"
                >
                  {t('consent.accept')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
