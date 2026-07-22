import { ArrowRight, Store, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'

import { useEnterApp } from '@/components/landing/launch'
import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'
import { Button } from '@/components/ui/button'

// §1.9 — two journeys, three steps each; the customer path doubles as the CTA.
const CUSTOMER = [
  'Connect a devnet wallet and open your flame.',
  'Watch it cool live — check in, and feel the streak outrun the burn.',
  'Gift within the cap, swap across brands, redeem a verified-only offer.',
] as const

const MERCHANT = [
  'Register a brand — mint decaying points in one transaction.',
  'Configure the guard, define verified segments, set roles & an issuance cap.',
  'Reward by attribute, run winbacks, and anchor an auditable statement.',
] as const

function Journey({
  icon,
  title,
  steps,
}: {
  icon: ReactNode
  title: string
  steps: readonly string[]
}) {
  return (
    <div>
      <p className="flex items-center gap-2 font-heading font-semibold text-lg">
        <span className="text-flame">{icon}</span>
        {title}
      </p>
      <ol className="mt-6 space-y-6">
        {steps.map((step, index) => (
          <Reveal key={step} delay={0.06 + index * 0.06}>
            <li className="flex gap-4">
              <span className="font-bold font-heading text-3xl text-flame tabular-nums leading-none">
                {index + 1}
              </span>
              <span className="mt-1 text-muted-foreground leading-relaxed">{step}</span>
            </li>
          </Reveal>
        ))}
      </ol>
    </div>
  )
}

export function Steps() {
  const enterApp = useEnterApp()
  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
        <SectionHeader
          kicker="Enter VESTA"
          title="Two journeys,"
          emphasis="one protocol"
          sub="Customers tend a living balance; merchants run an accredited, identity-aware program. Both start in the same app."
        />

        <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-16">
          <Journey
            icon={<Wallet className="size-5" aria-hidden />}
            title="For customers"
            steps={CUSTOMER}
          />
          <Journey
            icon={<Store className="size-5" aria-hidden />}
            title="For merchants"
            steps={MERCHANT}
          />
        </div>

        <Reveal delay={0.3} className="mt-14 flex flex-wrap gap-3">
          <Button size="lg" className="group" onClick={enterApp}>
            Launch app
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button size="lg" variant="outline" className="border-line-strong" onClick={enterApp}>
            <Store className="size-4" aria-hidden />
            Open the merchant console
          </Button>
        </Reveal>
      </div>
    </section>
  )
}
