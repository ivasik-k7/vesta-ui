import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'
import { Button } from '@/components/ui/button'

// §1.9 — three numbered steps, one sentence each; step 1 doubles as the CTA.
const STEPS = [
  { number: '1', text: 'Open the app and connect a devnet wallet.' },
  { number: '2', text: 'Watch your flame cool live — then check in and feel the streak.' },
  { number: '3', text: 'Gift within the cap, swap across merchants, redeem an offer.' },
] as const

export function Steps() {
  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
        <SectionHeader kicker="Enter VESTA" title="Lit in" emphasis="three steps" />

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <Reveal key={step.number} delay={0.08 + index * 0.08}>
              <p className="font-bold font-heading text-4xl text-flame">{step.number}</p>
              <p className="mt-3 max-w-xs text-muted-foreground leading-relaxed">{step.text}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3} className="mt-12">
          <Button asChild size="lg" className="group">
            <Link to="/app">
              Launch app
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  )
}
