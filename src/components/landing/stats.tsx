import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'

// §1.6 — numbers that matter, all verifiable: the instruction surface, the
// adversarial test suite, the hot-path compute bound, and the privacy stance.
const METRICS = [
  { value: 108, suffix: '', key: 'm1' },
  { value: 83, suffix: '', key: 'm2' },
  { value: 3, prefix: '<', suffix: 'k', key: 'm3' },
  { value: 0, suffix: '', key: 'm4' },
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
  const { t } = useTranslation()
  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24 md:py-32">
        <SectionHeader
          kicker={t('landing.stats.kicker')}
          title={t('landing.stats.title')}
          emphasis={t('landing.stats.emphasis')}
          sub={t('landing.stats.sub')}
        />

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((metric, index) => (
            <Reveal key={metric.key} delay={0.06 + index * 0.06}>
              <p className="font-bold font-heading text-6xl text-flame tracking-tight">
                <Counter
                  to={metric.value}
                  prefix={'prefix' in metric ? metric.prefix : ''}
                  suffix={metric.suffix}
                />
              </p>
              <p className="mt-2 max-w-[16rem] text-muted-foreground text-sm leading-relaxed">
                {t(`landing.stats.${metric.key}`)}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
