import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Coins, Compass, Send, Ticket } from 'lucide-react'
import { useEffect, useState } from 'react'

import { TokenCard } from '@/components/app/flame-balance'
import { GiftFlow, RedeemFlow, SwapFlow } from '@/components/app/flows'
import { useMoney } from '@/components/app/money'
import { EmptySlate, Section, SectionMeta } from '@/components/app/section'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { Skeleton } from '@/components/ui/skeleton'
import { liveUiAmount } from '@/lib/vesta/decay'
import { type Holding, useHoldings, useOffers } from '@/lib/vesta/queries'

export const Route = createFileRoute('/app/wallet')({
  component: WalletPage,
})

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now() / 1000)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / 1000), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

// The customer journey, in order: see what you hold → move it → spend it.
function WalletPage() {
  const { publicKey } = useWallet()
  const holdings = useHoldings()
  const items = holdings.data ?? []
  const [selIdx, setSelIdx] = useState(0)
  const sel = items.length > 0 ? items[Math.min(selIdx, items.length - 1)] : undefined

  return (
    <div>
      <PageHeader
        title="Wallet"
        sub="Your point balances across every brand — hold them (they cool over time), move them, and spend them. Every action is a real signed devnet transaction."
      />

      {!publicKey ? (
        <ConnectPrompt message="Connect a devnet wallet to manage your points." />
      ) : holdings.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => `sk-${i}`).map((k) => (
              <Skeleton key={k} className="h-44" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <EmptySlate icon={Coins}>
          No points in this wallet yet. Merchants issue them when you spend — browse the{' '}
          <Link to="/app/discover" className="text-flame hover:text-flame-hover">
            directory
          </Link>{' '}
          to find brands to earn with.
        </EmptySlate>
      ) : (
        <div className="space-y-10">
          <PortfolioHero items={items} />

          {/* 1 — Hold */}
          <Section
            icon={Coins}
            title="Your points"
            desc="One token per brand, each cooling at its own on-chain decay rate."
            right={
              <SectionMeta>
                {items.length} token{items.length > 1 ? 's' : ''}
              </SectionMeta>
            }
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((h) => (
                <TokenCard key={h.merchant.pointMint.toBase58()} holding={h} />
              ))}
            </div>
          </Section>

          {/* 2 — Move */}
          <Section
            icon={Send}
            title="Move points"
            desc="Gift to a friend within the daily cap, or swap across the alliance — the argus guard validates every transfer live."
            right={
              items.length > 1 ? (
                <BrandSelect
                  items={items}
                  value={Math.min(selIdx, items.length - 1)}
                  onChange={setSelIdx}
                />
              ) : undefined
            }
          >
            <div className="grid items-stretch gap-4 md:grid-cols-2">
              {sel ? <GiftFlow key={sel.merchant.pointMint.toBase58()} holding={sel} /> : null}
              {items.length > 1 ? (
                <SwapFlow holdings={items} />
              ) : (
                <EmptySlate icon={Compass}>
                  Hold points from two alliance merchants to unlock cross-brand swaps.{' '}
                  <Link to="/app/discover" className="text-flame hover:text-flame-hover">
                    Discover more brands
                  </Link>
                  .
                </EmptySlate>
              )}
            </div>
          </Section>

          {/* 3 — Spend */}
          {sel ? <RedeemSection holding={sel} /> : null}
        </div>
      )}
    </div>
  )
}

/** Standardized hero: total live value, privacy-aware, ticking in real time. */
function PortfolioHero({ items }: { items: Holding[] }) {
  const now = useNow()
  const { format } = useMoney()
  const total = items.reduce((sum, h) => sum + liveUiAmount(h.raw, h.mint, now), 0)
  const top = [...items].sort(
    (a, b) => liveUiAmount(b.raw, b.mint, now) - liveUiAmount(a.raw, a.mint, now),
  )[0]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-flame/30 bg-gradient-to-br from-flame/[0.06] to-transparent p-5">
      <div
        aria-hidden
        className="-right-12 -top-12 pointer-events-none absolute size-40 rounded-full bg-flame/10 blur-3xl"
      />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-medium font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]">
            Live portfolio value
          </p>
          <p className="mt-1 font-heading font-semibold text-4xl tabular-nums tracking-tight">
            {format(total)}
            <span className="ml-2 text-base text-muted-foreground">pts</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <p className="text-muted-foreground text-xs">
            across <span className="text-foreground">{items.length}</span> brand
            {items.length > 1 ? 's' : ''}
          </p>
          {top ? (
            <p className="text-muted-foreground text-xs">
              biggest: <span className="text-foreground">{top.merchant.name}</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/** Standardized brand selector used by the Move / Redeem sections. */
function BrandSelect({
  items,
  value,
  onChange,
}: {
  items: Holding[]
  value: number
  onChange: (v: number) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-lg border border-border bg-background/60 px-2.5 py-1 text-xs shadow-inner outline-none transition-colors focus:border-flame/60"
      aria-label="Brand"
    >
      {items.map((h, i) => (
        <option key={h.merchant.pointMint.toBase58()} value={i}>
          {h.merchant.name}
        </option>
      ))}
    </select>
  )
}

function RedeemSection({ holding }: { holding: Holding }) {
  const offers = useOffers(holding.merchant.address)

  return (
    <Section
      icon={Ticket}
      title="Redeem rewards"
      desc={`Burn ${holding.merchant.name} points for live offers — priced in decayed value, converted on-chain.`}
      right={
        offers.data && offers.data.length > 0 ? (
          <SectionMeta>
            {offers.data.length} offer{offers.data.length > 1 ? 's' : ''}
          </SectionMeta>
        ) : undefined
      }
    >
      {offers.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : offers.data && offers.data.length > 0 ? (
        <div className="grid items-stretch gap-4 md:grid-cols-2">
          {offers.data.slice(0, 4).map((offer) => (
            <RedeemFlow
              key={offer.address.toBase58()}
              holding={holding}
              offer={offer}
              redemptionIndex={0}
            />
          ))}
        </div>
      ) : (
        <EmptySlate icon={Ticket}>
          {holding.merchant.name} has no active offers right now.{' '}
          <Link
            to="/app/merchant/$address"
            params={{ address: holding.merchant.address.toBase58() }}
            className="inline-flex items-center gap-0.5 text-flame hover:text-flame-hover"
          >
            View their profile <ArrowRight className="size-3" aria-hidden />
          </Link>
        </EmptySlate>
      )}
    </Section>
  )
}
