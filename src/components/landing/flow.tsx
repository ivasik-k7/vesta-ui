import { Ban, Cpu, Database, ShieldCheck, Wallet } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type ReactNode, useEffect, useState } from 'react'

import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'
import { cn } from '@/lib/utils'

type Step = {
  icon: ReactNode
  label: string
  lane: 'off' | 'hot'
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    icon: <Wallet className="size-4" aria-hidden />,
    label: 'refresh_eligibility',
    lane: 'off',
    title: 'Pay identity once — off the hot path',
    body: 'A wallet (or relayer) prepays the expensive check. Permissionless, bundleable, and only when the cache is missing or stale.',
  },
  {
    icon: <ShieldCheck className="size-4" aria-hidden />,
    label: 'aegis · verify',
    lane: 'off',
    title: 'A privacy-preserving verdict',
    body: 'aegis answers over on-chain commitments — region, KYC tier, age band, accreditation — and returns a Verdict via return-data. It never reverts and never exposes PII.',
  },
  {
    icon: <Database className="size-4" aria-hidden />,
    label: 'EligibilityCapability',
    lane: 'off',
    title: 'Cached as a versioned bitmap',
    body: 'The verdict is stored with a TTL, a policy epoch, and a screening epoch. A config change or a sanctions freeze invalidates it instantly, regardless of TTL.',
  },
  {
    icon: <Cpu className="size-4" aria-hidden />,
    label: 'execute',
    lane: 'hot',
    title: 'The hot path does zero CPI',
    body: 'Token-2022 fires the argus hook on every transfer. It reads the cached bitmap plus local caps/velocity in under 3k compute units — constant cost, no cross-program call.',
  },
  {
    icon: <Ban className="size-4" aria-hidden />,
    label: 'allow / fail-closed',
    lane: 'hot',
    title: 'Settle, or fail closed',
    body: 'Fresh and eligible → the transfer settles. Stale, revoked, degraded, or over a cap → it fails closed with a typed reason. There is no permissive fallback.',
  },
]

export function Flow() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    if (reduce || pinned) return
    const id = setInterval(() => setActive((v) => (v + 1) % STEPS.length), 3200)
    return () => clearInterval(id)
  }, [reduce, pinned])

  const step = STEPS[active] ?? STEPS[0]
  if (!step) return null

  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
        <SectionHeader
          kicker="How a guarded transfer clears"
          title="Pay identity once,"
          emphasis="then transfer cheaply"
          sub="The expensive identity decision is paid off the transfer path and cached; the hook itself does no cross-program call. It's the pattern that lets compliance ride on every transfer without taxing it."
        />

        {/* lane labels */}
        <Reveal delay={0.06} className="mt-14">
          <div className="mb-3 grid grid-cols-1 gap-2 font-mono text-[11px] text-muted-foreground sm:grid-cols-5">
            <span className="sm:col-span-3">— off the hot path · once per TTL —</span>
            <span className="sm:col-span-2 sm:text-right">— hot path · every transfer —</span>
          </div>

          {/* pipeline */}
          <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div
              aria-hidden
              className="absolute top-[1.35rem] right-4 left-4 hidden h-px bg-border sm:block"
            />
            {STEPS.map((s, i) => {
              const on = i === active
              return (
                <button
                  type="button"
                  key={s.label}
                  onClick={() => {
                    setActive(i)
                    setPinned(true)
                  }}
                  onMouseEnter={() => {
                    setActive(i)
                    setPinned(true)
                  }}
                  className="group relative z-10 flex flex-col items-center gap-2 text-center"
                >
                  <span
                    className={cn(
                      'grid size-11 place-items-center rounded-full border bg-card transition-colors',
                      on
                        ? 'border-flame text-flame'
                        : 'border-line-strong text-muted-foreground group-hover:border-flame/50',
                    )}
                  >
                    {s.icon}
                    {on && !reduce ? (
                      <motion.span
                        layoutId="flow-ring"
                        className="absolute inset-0 rounded-full ring-2 ring-flame/60"
                        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                      />
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      'font-mono text-[10px] leading-tight transition-colors',
                      on ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {s.label}
                  </span>
                </button>
              )
            })}
          </div>
        </Reveal>

        {/* detail panel */}
        <Reveal delay={0.12} className="mt-8">
          <div className="min-h-[7rem] rounded-2xl border border-border bg-card p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.label}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <p className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 font-mono text-[10px]',
                      step.lane === 'hot'
                        ? 'bg-flame/10 text-flame'
                        : 'bg-secondary text-muted-foreground',
                    )}
                  >
                    {step.lane === 'hot' ? 'hot path' : 'off hot path'}
                  </span>
                  <span className="font-heading font-semibold text-lg">{step.title}</span>
                </p>
                <p className="mt-2 max-w-2xl text-muted-foreground leading-relaxed">{step.body}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
