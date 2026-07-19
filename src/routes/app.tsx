import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeftRight, Gift, Medal, Ticket } from 'lucide-react'

import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'
import { MerchantWalletCard } from '@/components/preview/decay-balance'

export const Route = createFileRoute('/app')({
  component: CustomerApp,
})

// Content mirrors docs/TECHNICAL_SPEC.md §2.1 constants and §3–§4 semantics.
const ACTIONS = [
  {
    icon: Gift,
    title: 'Gift',
    body: 'Send up to 500.00 pts per day to any friend. The guard travels with the token — omit its accounts and the transfer aborts, fail-closed.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Swap',
    body: 'Trade café points for bookstore points at alliance rates. Swaps price in UI value on both legs, so older mints never leak an arbitrage edge.',
  },
  {
    icon: Ticket,
    title: 'Redeem',
    body: 'Burn points for offers. Prices are quoted in decayed value with your slippage bound — the chain converts, you stay protected.',
  },
] as const

const BADGES = [
  {
    name: 'First Flame',
    state: 'Earned · 19 Jul 2026',
    detail:
      'Soulbound Token-2022 badge. Even if you burn it, the on-chain receipt proves you earned it.',
    earned: true,
  },
  {
    name: 'Regular',
    state: 'Locked · 742 / 1 000 pts lifetime',
    detail:
      'Granted once your lifetime earnings cross the threshold. No shortcuts — badges cannot be bought or transferred.',
    earned: false,
  },
] as const

function CustomerApp() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
      <SectionHeader
        kicker="Customer app · interactive preview"
        title="Your loyalty"
        emphasis="wallet"
        sub="Live mechanics with demo state — wallet connection and devnet wiring land with the client build. Every rule below is already enforced on-chain."
      />

      <Reveal delay={0.08} className="mt-12 grid gap-4 md:grid-cols-2">
        <MerchantWalletCard name="Kavarna" symbol="PTS" initial={128.4} streakDays={6} />
        <MerchantWalletCard name="Litera" symbol="BKS" initial={42.1} streakDays={2} />
      </Reveal>

      <Reveal delay={0.12} className="mt-4 grid gap-4 md:grid-cols-3">
        {ACTIONS.map((action) => (
          <div key={action.title} className="rounded-2xl border border-border bg-card p-6">
            <action.icon className="size-5 text-flame" aria-hidden />
            <h3 className="mt-3 font-heading font-semibold">{action.title}</h3>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{action.body}</p>
          </div>
        ))}
      </Reveal>

      <div className="mt-16">
        <SectionHeader
          kicker="Kleos badges"
          title="Proof you"
          emphasis="earned it"
          sub="Non-transferable Token-2022 mints, one per achievement. Any external dApp can gate on them without asking us."
        />
        <Reveal delay={0.08} className="mt-8 grid gap-4 md:grid-cols-2">
          {BADGES.map((badge) => (
            <div
              key={badge.name}
              className={`rounded-2xl border p-6 ${
                badge.earned ? 'border-flame/40 bg-card' : 'border-border bg-card/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold">{badge.name}</h3>
                <Medal
                  className={`size-5 ${badge.earned ? 'text-flame' : 'text-muted-foreground/50'}`}
                  aria-hidden
                />
              </div>
              <p className="mt-1 font-mono text-muted-foreground text-xs">{badge.state}</p>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{badge.detail}</p>
            </div>
          ))}
        </Reveal>
      </div>

      <Reveal delay={0.1} className="mt-16 rounded-2xl border border-border bg-card p-6">
        <p className="font-medium text-[13px] text-muted-foreground">The fine print, on-chain</p>
        <ul className="mt-3 grid gap-2 text-muted-foreground text-sm md:grid-cols-2">
          <li>Earning is gasless for you — the merchant signs and pays.</li>
          <li>Streaks compound +2%/day up to ×1.6; campaigns stack to a hard ×2.4 cap.</li>
          <li>Daily gift allowance: 500.00 pts per wallet per mint.</li>
          <li>Tiers count lifetime earnings at issue — decay never demotes you.</li>
        </ul>
      </Reveal>
    </main>
  )
}
