import { ArrowUpRight, Trophy, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const CHALLENGE_URL = 'https://superteam.fun/earn/listing/on-chain-loyalty-rewards-system-challenge'
const STORAGE_KEY = 'vesta:challenge-widget'

// A floating badge announcing this build is a Superteam Earn challenge entry.
// Collapsed to an unobtrusive pill; expands to a card on click. Dismissal
// persists so it never nags a returning visitor.
export function ChallengeWidget() {
  const reduce = useReducedMotion()
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const gone = localStorage.getItem(STORAGE_KEY) === 'dismissed'
    setDismissed(gone)
    if (gone) return
    // Auto-reveal the full card once for discovery, then settle to the pill.
    const reveal = setTimeout(() => setOpen(true), 2600)
    const settle = setTimeout(() => setOpen(false), 8200)
    return () => {
      clearTimeout(reveal)
      clearTimeout(settle)
    }
  }, [])

  if (dismissed) return null

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'dismissed')
    setDismissed(true)
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end sm:right-6 sm:bottom-6">
      <AnimatePresence mode="popLayout">
        {open ? (
          <motion.div
            key="card"
            initial={reduce ? false : { opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[19rem] overflow-hidden rounded-2xl border border-line-strong bg-card/95 p-5 shadow-2xl shadow-black/40 backdrop-blur"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-flame/70 to-transparent"
            />
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-flame/30 bg-flame/10 px-2.5 py-1 font-medium text-flame text-xs">
                <Trophy className="size-3.5" aria-hidden />
                {t('landing.challenge.badge')}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t('landing.challenge.collapse')}
                  className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <span aria-hidden className="-mt-1 text-base leading-none">
                    –
                  </span>
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label={t('landing.challenge.dismiss')}
                  className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>

            <p className="mt-3 font-heading font-semibold text-base leading-tight">
              {t('landing.challenge.title')}
            </p>
            <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">
              {t('landing.challenge.body')}
            </p>

            <a
              href={CHALLENGE_URL}
              target="_blank"
              rel="noreferrer"
              className="group mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-flame px-3 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-flame-hover"
            >
              {t('landing.challenge.cta')}
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </motion.div>
        ) : (
          <motion.button
            key="pill"
            type="button"
            onClick={() => setOpen(true)}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            whileHover={reduce ? undefined : { y: -2 }}
            className="group inline-flex items-center gap-2 rounded-full border border-line-strong bg-card/95 py-2 pr-3.5 pl-2.5 shadow-lg shadow-black/30 backdrop-blur transition-colors hover:border-flame/50"
          >
            <span className="relative grid size-6 place-items-center rounded-full bg-flame/10">
              <Trophy className="size-3.5 text-flame" aria-hidden />
              {reduce ? null : (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full ring-1 ring-flame/50 motion-safe:animate-ping"
                />
              )}
            </span>
            <span className="font-medium text-foreground text-xs">
              {t('landing.challenge.pill')}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
