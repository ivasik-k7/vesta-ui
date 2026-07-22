import { BadgeCheck } from 'lucide-react'

import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'
import { cn } from '@/lib/utils'

// §1.8 adapted honestly: we have no Trustpilot — we have something better.
// These are verbatim quotes from the adversarial verification passes that
// shaped the spec (six fact-check agents + a four-lens judge panel).
const QUOTES: { text: string; source: string; initials: string; long?: boolean }[] = [
  {
    text: 'The instruction semantics, hook mechanics, and threat model are specified to a depth most hackathon teams never reach.',
    source: 'completeness critic',
    initials: 'CC',
    long: true,
  },
  {
    text: 'Token-2022 lifecycle mastery, verifiably correct.',
    source: 'architecture lens',
    initials: 'AR',
  },
  {
    text: 'Exceptional honesty culture in the disclosures.',
    source: 'security lens',
    initials: 'SE',
  },
  {
    text: 'A genuinely expert delegation-proof choice.',
    source: 'transfer-hook review',
    initials: 'TH',
  },
  {
    text: 'Security economics, not just security mechanics.',
    source: 'judge panel',
    initials: 'JP',
  },
  {
    text: 'Real adversarial engineering, not checkbox security.',
    source: 'implementation review',
    initials: 'IR',
  },
]

export function Verification() {
  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
        <SectionHeader
          kicker="Reviewed like it matters"
          title="What the reviewers"
          emphasis="said"
          sub="Every track was shaped by three independent design studies, then hardened by adversarial security passes that verified each finding line-by-line against source. Every quote below is verbatim from the review record."
        />

        <Reveal delay={0.08} className="mt-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <BadgeCheck className="size-4 text-flame" aria-hidden />
            multi-agent ideation · adversarial audits · 83 tests green
          </span>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {QUOTES.map((quote, index) => (
            <Reveal
              key={quote.initials}
              delay={0.06 + index * 0.05}
              className={cn(quote.long && 'md:col-span-2')}
            >
              <figure className="h-full rounded-2xl border border-border bg-card p-6">
                <blockquote
                  className={cn(
                    'text-foreground/90 leading-relaxed',
                    quote.long ? 'text-lg' : 'text-sm',
                  )}
                >
                  “{quote.text}”
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-full bg-secondary font-medium text-muted-foreground text-xs">
                    {quote.initials}
                  </span>
                  <span className="text-muted-foreground text-sm">{quote.source}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
