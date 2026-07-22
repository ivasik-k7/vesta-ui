import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'
import { cn } from '@/lib/utils'

type Trace = {
  label: string
  meta: string
  key: string
}

// The signature mechanic, staged as a transaction trace: identity is paid once
// off the hot path, cached, and the hook itself never crosses a program.
const TRACE: Trace[] = [
  { label: 'refresh_eligibility(mint, subject)', meta: 'off hot path · permissionless', key: 'd1' },
  { label: 'aegis::verify → verdict ok', meta: 'return-data · never reverts', key: 'd2' },
  { label: 'write EligibilityCapability', meta: 'bitmap · TTL · epochs', key: 'd3' },
  { label: 'token-2022 transfer → argus::execute', meta: 'hot path · every transfer', key: 'd4' },
  { label: 'allow — settled', meta: '2,801 CU · 0 CPI', key: 'd5' },
]

export function Flow() {
  const reduce = useReducedMotion()
  const { t } = useTranslation()
  const [active, setActive] = useState(0)
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    if (reduce || pinned) return
    const id = setInterval(() => setActive((v) => (v + 1) % TRACE.length), 3400)
    return () => clearInterval(id)
  }, [reduce, pinned])

  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24 md:py-32">
        <SectionHeader
          kicker={t('landing.flow.kicker')}
          title={t('landing.flow.title')}
          emphasis={t('landing.flow.emphasis')}
          sub={t('landing.flow.sub')}
        />

        <Reveal delay={0.08} className="mt-14">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 border-border/60 border-b px-4 py-2.5 font-mono text-muted-foreground text-xs">
              <span aria-hidden className="flex gap-1.5">
                <span className="size-2 rounded-full bg-border" />
                <span className="size-2 rounded-full bg-border" />
                <span className="size-2 rounded-full bg-flame/60" />
              </span>
              <span className="ml-1">tx trace · guarded transfer</span>
            </div>

            <div className="p-2 font-mono text-xs md:p-3">
              <p className="px-3 py-2 text-muted-foreground">
                $ vesta transfer --amount 25 --to friend
              </p>

              {TRACE.map((step, index) => {
                const done = index < active
                const on = index === active
                return (
                  <button
                    key={step.label}
                    type="button"
                    onClick={() => {
                      setActive(index)
                      setPinned(true)
                    }}
                    className={cn(
                      'block w-full rounded-lg px-3 py-2 text-left transition-colors',
                      on ? 'bg-background/70' : 'hover:bg-background/40',
                    )}
                  >
                    <span className="flex items-baseline gap-3">
                      <span
                        aria-hidden
                        className={cn(
                          'w-3 shrink-0',
                          done
                            ? 'text-flame-hover'
                            : on
                              ? 'text-flame'
                              : 'text-muted-foreground/40',
                        )}
                      >
                        {done ? '✓' : on ? '▸' : '·'}
                      </span>
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate',
                          done || on ? 'text-foreground/85' : 'text-muted-foreground/60',
                        )}
                      >
                        {step.label}
                      </span>
                      <span className="hidden shrink-0 text-muted-foreground/60 sm:inline">
                        {step.meta}
                      </span>
                    </span>

                    <AnimatePresence initial={false}>
                      {on ? (
                        <motion.span
                          key="detail"
                          initial={reduce ? false : { height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                          className="block overflow-hidden"
                        >
                          <span className="block max-w-2xl pt-2 pl-6 font-sans text-muted-foreground text-sm leading-relaxed">
                            {t(`landing.flow.${step.key}`)}
                          </span>
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </button>
                )
              })}

              <p aria-hidden className="px-3 py-2 text-flame">
                <span className="motion-safe:animate-blink">▍</span>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
