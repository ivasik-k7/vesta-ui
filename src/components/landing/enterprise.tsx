import { BadgeCheck, Coins, FileCheck2, ShieldHalf, UsersRound } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'
import { cn } from '@/lib/utils'

type Control = {
  id: string
  icon: ReactNode
}

const CONTROLS: Control[] = [
  { id: 'identity', icon: <BadgeCheck className="size-4" aria-hidden /> },
  { id: 'reserve', icon: <Coins className="size-4" aria-hidden /> },
  { id: 'duties', icon: <UsersRound className="size-4" aria-hidden /> },
  { id: 'governed', icon: <FileCheck2 className="size-4" aria-hidden /> },
  { id: 'segments', icon: <ShieldHalf className="size-4" aria-hidden /> },
]

export function Enterprise() {
  const reduce = useReducedMotion()
  const { t } = useTranslation()
  const [active, setActive] = useState('identity')
  const control = CONTROLS.find((c) => c.id === active) ?? CONTROLS[0]
  if (!control) return null

  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24 md:py-32">
        <SectionHeader
          kicker={t('landing.enterprise.kicker')}
          title={t('landing.enterprise.title')}
          emphasis={t('landing.enterprise.emphasis')}
          sub={t('landing.enterprise.sub')}
        />

        <div className="mt-14 grid gap-4 md:grid-cols-[16rem_1fr] md:gap-8">
          {/* tabs */}
          <Reveal>
            <div
              role="tablist"
              aria-label="Enterprise controls"
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0"
            >
              {CONTROLS.map((c) => {
                const on = c.id === active
                return (
                  <button
                    key={c.id}
                    role="tab"
                    aria-selected={on}
                    type="button"
                    onClick={() => setActive(c.id)}
                    className={cn(
                      'relative flex shrink-0 items-center gap-2.5 rounded-xl border px-4 py-3 text-left font-medium text-sm transition-colors md:shrink',
                      on
                        ? 'border-flame/40 bg-card text-foreground'
                        : 'border-transparent text-muted-foreground hover:bg-card/60 hover:text-foreground',
                    )}
                  >
                    <span className={on ? 'text-flame' : 'text-muted-foreground'}>{c.icon}</span>
                    <span className="whitespace-nowrap">{t(`landing.enterprise.${c.id}.tab`)}</span>
                    {on && !reduce ? (
                      <motion.span
                        layoutId="ent-active"
                        className="absolute inset-0 rounded-xl ring-1 ring-flame/40"
                        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                      />
                    ) : null}
                  </button>
                )
              })}
            </div>
          </Reveal>

          {/* panel */}
          <div className="min-h-[16rem] rounded-2xl border border-border bg-card p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={control.id}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.26 }}
              >
                <h3 className="max-w-xl font-heading font-semibold text-2xl tracking-tight">
                  {t(`landing.enterprise.${control.id}.title`)}
                </h3>
                <p className="mt-3 max-w-xl text-muted-foreground leading-relaxed">
                  {t(`landing.enterprise.${control.id}.body`)}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {['p1', 'p2', 'p3'].map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm">
                      <BadgeCheck className="mt-0.5 size-4 shrink-0 text-flame" aria-hidden />
                      <span className="text-foreground/85">
                        {t(`landing.enterprise.${control.id}.${point}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
