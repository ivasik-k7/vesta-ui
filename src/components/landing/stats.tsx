import { ArrowUpRight } from 'lucide-react'
import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'
import { env } from '@/env'

// §1.6 — numbers that matter, all verifiable: the instruction surface, the
// adversarial test suite, the hot-path compute bound, and the privacy stance.
const METRICS = [
  { value: 108, suffix: '', label: 'public instructions across 3 programs' },
  { value: 83, suffix: '', label: 'adversarial LiteSVM tests, all green' },
  { value: 3, prefix: '<', suffix: 'k', label: 'CU on the transfer hot path — zero CPI' },
  { value: 0, suffix: '', label: 'bytes of customer PII stored on-chain' },
] as const

const RECEIPTS = [
  { name: 'vesta_core', id: env.VITE_VESTA_CORE_PROGRAM_ID },
  { name: 'argus', id: env.VITE_ARGUS_PROGRAM_ID },
  { name: 'aegis', id: env.VITE_AEGIS_PROGRAM_ID },
] as const

function Counter({
  to,
  prefix = '',
  suffix = '',
}: {
  to: number
  prefix?: string
  suffix?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const reduce = useReducedMotion()
  const [value, setValue] = useState(reduce ? to : 0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setValue(to)
      return
    }
    const controls = animate(0, to, {
      duration: 1.3,
      ease: 'easeOut',
      onUpdate: (v) => setValue(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, to, reduce])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {value}
      {suffix}
    </span>
  )
}

export function Stats() {
  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
        <SectionHeader
          kicker="Numbers you can re-derive"
          title="Measured"
          emphasis="on-chain"
          sub="No vanity metrics — every figure below is reproducible from the public repo or the devnet explorer."
        />

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((metric, index) => (
            <Reveal key={metric.label} delay={0.06 + index * 0.06}>
              <p className="font-bold font-heading text-6xl text-flame tracking-tight">
                <Counter
                  to={metric.value}
                  prefix={'prefix' in metric ? metric.prefix : ''}
                  suffix={metric.suffix}
                />
              </p>
              <p className="mt-2 max-w-[16rem] text-muted-foreground text-sm leading-relaxed">
                {metric.label}
              </p>
            </Reveal>
          ))}
        </div>

        {/* receipts: the three deployed programs, straight to the explorer */}
        <Reveal delay={0.2} className="mt-14">
          <div className="grid gap-2 rounded-2xl border border-border bg-card p-3 sm:grid-cols-3">
            {RECEIPTS.map((program) => (
              <a
                key={program.name}
                href={`https://explorer.solana.com/address/${program.id}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary/60"
              >
                <span className="font-heading font-semibold text-flame text-sm">
                  {program.name}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-muted-foreground text-xs">
                  {program.id}
                </span>
                <ArrowUpRight
                  className="size-3.5 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-flame"
                  aria-hidden
                />
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
