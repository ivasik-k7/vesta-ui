import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Coins } from 'lucide-react'
import { useEffect, useState } from 'react'

import { TokenCard } from '@/components/app/flame-balance'
import { useMoney } from '@/components/app/money'
import { EmptySlate, Section, SectionMeta } from '@/components/app/section'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { Skeleton } from '@/components/ui/skeleton'
import { liveUiAmount } from '@/lib/vesta/decay'
import { type Holding, useHoldings } from '@/lib/vesta/queries'

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
        <div className="section-scope space-y-10">
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
