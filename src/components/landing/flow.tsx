import { motion, useReducedMotion } from 'motion/react'

import { Reveal } from '@/components/landing/reveal'

const STEPS = [
  {
    number: '01',
    title: 'Merchant lights a mint',
    body: 'Two-minute onboarding. vesta_core CPIs into Token-2022 and composes decay, metadata, hook, and clawback into one mint.',
  },
  {
    number: '02',
    title: 'Customer earns at the counter',
    body: 'Scan a QR, points land in under a second for a fraction of a cent. The merchant pays the fee — no wallet gymnastics.',
  },
  {
    number: '03',
    title: 'The flame ticks',
    body: 'Balances cool on-chain via a negative interest rate. Streaks and quests mint multipliers that keep devoted customers ahead.',
  },
  {
    number: '04',
    title: 'Swap, gift, redeem',
    body: 'Trade points across the alliance, gift within limits, burn for perks. Every path is a public instruction anyone can compose.',
  },
] as const

export function Flow() {
  const reduce = useReducedMotion()
  return (
    <section className="border-border/40 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-24">
        <Reveal>
          <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.25em]">
            the loop
          </p>
          <h2 className="mt-3 font-heading font-semibold text-3xl tracking-tight md:text-4xl">
            From first visit to devotion
          </h2>
        </Reveal>

        <div className="relative mt-14">
          <motion.div
            aria-hidden
            className="absolute top-[5px] hidden h-px w-full origin-left bg-gradient-to-r from-solana-purple via-solana-green to-transparent md:block"
            initial={reduce ? undefined : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
          <div className="grid gap-10 md:grid-cols-4 md:gap-6">
            {STEPS.map((step, index) => (
              <Reveal key={step.number} delay={0.1 + index * 0.1}>
                <div className="relative">
                  <div
                    aria-hidden
                    className="-top-[0px] absolute hidden size-[11px] rounded-full border border-solana-green/60 bg-background md:block"
                  />
                  <p className="font-mono text-solana-green text-xs md:pt-6">{step.number}</p>
                  <h3 className="mt-2 font-heading font-semibold text-lg">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
