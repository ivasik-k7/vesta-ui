import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'

// §1.6 — numbers that matter, all verifiable: the instruction surface, the
// adversarial test suite, the hot-path compute bound, and the privacy stance.
const METRICS = [
  { value: 108, suffix: '', label: 'public instructions across 3 programs' },
  { value: 83, suffix: '', label: 'adversarial LiteSVM tests, all green' },
  { value: 3, prefix: '<', suffix: 'k', label: 'CU on the transfer hot path — zero CPI' },
  { value: 0, suffix: '', label: 'bytes of customer PII stored on-chain' },
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
      </div>
    </section>
  )
}
