import { createFileRoute, Link } from '@tanstack/react-router'
import { BadgeCheck, Coins, Compass, Search, Store, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import { fmtCount, fmtPoints } from '@/components/app/metric'
import { EmptySlate, Section, SectionMeta } from '@/components/app/section'
import { PageHeader } from '@/components/app/shell'
import { Skeleton } from '@/components/ui/skeleton'
import type { Merchant } from '@/lib/vesta/decode'
import { type Holding, useHoldings, useMerchants } from '@/lib/vesta/queries'

export const Route = createFileRoute('/app/discover')({
  component: DiscoverPage,
})

const CATEGORY_LABEL = ['General', 'Food & Drink', 'Retail', 'Services', 'Entertainment', 'Travel']

function DiscoverPage() {
  const merchants = useMerchants()
  const holdings = useHoldings()
  const [query, setQuery] = useState('')

  const holdingByMint = useMemo(() => {
    const map = new Map<string, Holding>()
    for (const h of holdings.data ?? []) map.set(h.merchant.pointMint.toBase58(), h)
    return map
  }, [holdings.data])

  const filtered = useMemo(() => {
    const all = merchants.data ?? []
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter(
      (m) => m.name.toLowerCase().includes(q) || m.pointMint.toBase58().toLowerCase().includes(q),
    )
  }, [merchants.data, query])

  return (
    <div>
      <PageHeader
        title="Discover"
        sub="Every merchant on the network, read live from the chain. Open a profile to see offers and campaigns — and claim rewards with the points you hold."
      />

      {/* Standardized search */}
      <div className="mb-8 flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 shadow-inner transition-colors focus-within:border-flame/60 md:max-w-sm">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or mint"
          className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      <Section
        icon={Compass}
        title="Merchants"
        desc="One loyalty token per brand — verified merchants carry the flame badge."
        right={
          merchants.data ? (
            <SectionMeta>
              {filtered.length} of {merchants.data.length}
            </SectionMeta>
          ) : undefined
        }
      >
        {merchants.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => `sk-${i}`).map((k) => (
              <Skeleton key={k} className="h-44" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <DiscoverCard
                key={m.address.toBase58()}
                merchant={m}
                held={holdingByMint.has(m.pointMint.toBase58())}
              />
            ))}
          </div>
        ) : (
          <EmptySlate icon={Search}>No merchants match your search.</EmptySlate>
        )}
      </Section>
    </div>
  )
}

/** Standardized directory card — same anatomy and height as wallet TokenCards. */
function DiscoverCard({ merchant, held }: { merchant: Merchant; held: boolean }) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/50 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.75)] ring-1 ring-foreground/[0.02] ring-inset backdrop-blur-sm transition-colors duration-300 hover:border-flame/40">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5">
        <span
          aria-hidden
          className="h-3.5 w-1 shrink-0 rounded-full bg-gradient-to-b from-flame to-flame-deep"
        />
        <p className="min-w-0 truncate font-semibold text-sm">{merchant.name}</p>
        {merchant.verified ? (
          <BadgeCheck className="size-3.5 shrink-0 text-flame" aria-label="Verified" />
        ) : null}
        {held ? (
          <span className="ml-auto shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">
            Held
          </span>
        ) : null}
      </div>
      <div
        aria-hidden
        className="mx-4 h-px bg-gradient-to-r from-border via-border/50 to-transparent"
      />

      {/* Body */}
      <div className="flex-1 space-y-1.5 px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
            {CATEGORY_LABEL[merchant.category] ?? 'General'}
          </span>
          {merchant.joinedAlliance ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              <Users className="size-3" aria-hidden /> Alliance
            </span>
          ) : null}
        </div>
        <p className="font-mono text-[11px] text-muted-foreground/70">
          {fmtCount(merchant.customerCount)} customers · {merchant.decayRateBps / 100}%/yr decay
        </p>
        <p className="font-mono text-[11px] text-muted-foreground/70">
          {fmtPoints(merchant.lifetimePointsIssued)} pts issued lifetime
        </p>
      </div>

      {/* Uniform footer cells */}
      <div className="grid grid-cols-2 divide-x divide-border/40 border-border/40 border-t">
        <Link
          to="/app/merchant/$address"
          params={{ address: merchant.address.toBase58() }}
          className="flex items-center justify-center gap-1.5 py-2.5 text-muted-foreground text-xs transition-colors hover:bg-flame/[0.05] hover:text-flame"
        >
          <Store className="size-3.5" aria-hidden />
          Profile
        </Link>
        <Link
          to="/app/token/$mint"
          params={{ mint: merchant.pointMint.toBase58() }}
          className="flex items-center justify-center gap-1.5 py-2.5 text-muted-foreground text-xs transition-colors hover:bg-flame/[0.05] hover:text-flame"
        >
          <Coins className="size-3.5" aria-hidden />
          Token
        </Link>
      </div>
    </div>
  )
}
