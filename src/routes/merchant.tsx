import { createFileRoute } from '@tanstack/react-router'
import { Eye, Flame, Medal, Megaphone, ShieldCheck, Undo2 } from 'lucide-react'

import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'

export const Route = createFileRoute('/merchant')({
  component: MerchantDashboard,
})

// Content mirrors docs/TECHNICAL_SPEC.md §2.1–§2.2, §3.2–§3.5, §4.
const ONBOARDING_ROWS = [
  { label: 'Point name / symbol', value: 'Kavarna Points · PTS' },
  { label: 'Decay rate', value: '−20%/yr (tunable −100%..0 at registration)' },
  { label: 'Earn rate', value: '1.00 pt per currency unit (1–1 000 raw/cent)' },
  { label: 'One-time cost', value: '≈ 0.012 SOL — mint, treasury, guard, metadata' },
  { label: 'Per new customer', value: '≈ 0.0036 SOL — profile + token account, paid by you' },
] as const

const TOOLS = [
  {
    icon: Megaphone,
    title: 'Campaigns',
    body: 'Time-boxed earn multipliers up to ×2.0, stacking with streaks under a hard ×2.4 joint cap. Closable anytime — rent comes back to you.',
  },
  {
    icon: Medal,
    title: 'Achievements',
    body: 'Define lifetime-earnings thresholds; grant soulbound kleos badges your regulars can never lose the credit for — even if they burn the token.',
  },
  {
    icon: Eye,
    title: 'Transfer guard',
    body: 'Two-step: initialize the policy account, then finalize — which burns the hook authority forever. Not even you can repoint the rules afterwards.',
  },
  {
    icon: Undo2,
    title: 'Clawback',
    body: 'Refund and fraud handling via permanent delegate. Every clawback is a public, reason-coded, guard-audited transaction — disclosed to customers, by design.',
  },
] as const

function MerchantDashboard() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
      <SectionHeader
        kicker="Merchant dashboard · interactive preview"
        title="Run a program that"
        emphasis="runs itself"
        sub="Registration wiring lands with the client build; everything below reflects the deployed on-chain rules, not a roadmap."
      />

      <Reveal delay={0.08} className="mt-12 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-flame" aria-hidden />
            <h3 className="font-heading font-semibold">Two-minute onboarding</h3>
          </div>
          <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
            One transaction composes your point mint: metadata, decay, transfer guard, and clawback
            delegate — all Token-2022 extensions, all verifiable.
          </p>
          <dl className="mt-5 space-y-3">
            {ONBOARDING_ROWS.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-6 border-border/60 border-b pb-2 last:border-0"
              >
                <dt className="shrink-0 text-muted-foreground text-sm">{row.label}</dt>
                <dd className="text-right font-mono text-sm">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-flame" aria-hidden />
            <h3 className="font-heading font-semibold">What you can never do</h3>
          </div>
          <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
            Trust is a feature. These are enforced by the protocol, not promised by us:
          </p>
          <ul className="mt-4 space-y-3 text-muted-foreground text-sm leading-relaxed">
            <li>Freeze customer accounts — the freeze authority is never created.</li>
            <li>Repoint the transfer guard after finalize — the authority is burned.</li>
            <li>Mint badge duplicates — badge supply is frozen at one, forever.</li>
            <li>Claw back invisibly — every clawback is public and reason-coded.</li>
          </ul>
        </div>
      </Reveal>

      <Reveal delay={0.12} className="mt-4 grid gap-4 md:grid-cols-2">
        {TOOLS.map((tool) => (
          <div key={tool.title} className="rounded-2xl border border-border bg-card p-6">
            <tool.icon className="size-5 text-flame" aria-hidden />
            <h3 className="mt-3 font-heading font-semibold">{tool.title}</h3>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{tool.body}</p>
          </div>
        ))}
      </Reveal>
    </main>
  )
}
