import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'

// §1.6 — three big honest numbers, N+ format, no paragraphs.
const STATS = [
  { value: '3', label: 'programs · one-directional trust' },
  { value: '83', label: 'adversarial tests green' },
  { value: '0', label: 'bytes of PII on-chain' },
] as const

export function Stats() {
  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
        <SectionHeader kicker="Verified, then shipped" title="On-chain." emphasis="At depth." />

        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {STATS.map((stat, index) => (
            <Reveal key={stat.label} delay={0.08 + index * 0.08}>
              <p className="font-bold font-heading text-6xl text-flame tabular-nums tracking-tight">
                {stat.value}
              </p>
              <p className="mt-2 text-muted-foreground">{stat.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
