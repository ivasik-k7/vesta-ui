import { createFileRoute, Link } from '@tanstack/react-router'
import { BadgeCheck, Coins, Compass, RefreshCw, Search, Store, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

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
const PAGE = 24

type SortBy = 'customers' | 'issued' | 'name'
const SORTS: { value: SortBy; label: string }[] = [
  { value: 'customers', label: 'Most customers' },
  { value: 'issued', label: 'Most issued' },
  { value: 'name', label: 'Name A–Z' },
]

// Built to scale to thousands of merchants: filtering/sorting happen over the
// in-memory set, but only a growing window of cards is ever rendered — more
// stream in lazily as you scroll.
function DiscoverPage() {
  const merchants = useMerchants()
  const holdings = useHoldings()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<number | null>(null)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [heldOnly, setHeldOnly] = useState(false)
  const [sort, setSort] = useState<SortBy>('customers')
  const [visible, setVisible] = useState(PAGE)

  const holdingByMint = useMemo(() => {
    const map = new Map<string, Holding>()
    for (const h of holdings.data ?? []) map.set(h.merchant.pointMint.toBase58(), h)
    return map
  }, [holdings.data])

  const filtered = useMemo(() => {
    const all = merchants.data ?? []
    const q = query.trim().toLowerCase()
    const out = all.filter((m) => {
      if (verifiedOnly && !m.verified) return false
      if (category !== null && m.category !== category) return false
      if (heldOnly && !holdingByMint.has(m.pointMint.toBase58())) return false
      if (
        q &&
        !m.name.toLowerCase().includes(q) &&
        !m.pointMint.toBase58().toLowerCase().includes(q)
      )
        return false
      return true
    })
    out.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'issued') return Number(b.lifetimePointsIssued - a.lifetimePointsIssued)
      return Number(b.customerCount - a.customerCount)
    })
    return out
  }, [merchants.data, query, category, verifiedOnly, heldOnly, sort, holdingByMint])

  // Reset the render window whenever the result set changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional window reset on filter change
  useEffect(() => setVisible(PAGE), [query, category, verifiedOnly, heldOnly, sort])

  const shown = filtered.slice(0, visible)
  const hasMore = filtered.length > visible

  // Lazy rendering: grow the window when the sentinel scrolls into view.
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible((v) => v + PAGE)
      },
      { rootMargin: '400px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore])

  // Categories actually present drive the chips (no dead filters).
  const presentCategories = useMemo(() => {
    const set = new Set<number>()
    for (const m of merchants.data ?? []) set.add(m.category)
    return [...set].sort()
  }, [merchants.data])

  return (
    <div>
      <PageHeader
        title="Discover"
        sub="Every merchant on the network, read live from the chain. Filter, sort, and scroll — cards stream in lazily so even thousands of brands stay fast."
      />

      {/* Controls */}
      <div className="mb-8 space-y-3 rounded-2xl border border-border bg-card/50 p-4 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.75)] ring-1 ring-foreground/[0.02] ring-inset backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background/60 px-3 shadow-inner transition-colors focus-within:border-flame/60">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or mint"
              className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/50"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortBy)}
            className="shrink-0 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm shadow-inner outline-none transition-colors focus:border-flame/60"
            aria-label="Sort"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip active={category === null} onClick={() => setCategory(null)}>
            All categories
          </FilterChip>
          {presentCategories.map((c) => (
            <FilterChip
              key={c}
              active={category === c}
              onClick={() => setCategory(category === c ? null : c)}
            >
              {CATEGORY_LABEL[c] ?? `Category ${c}`}
            </FilterChip>
          ))}
          <span aria-hidden className="mx-1 h-4 w-px bg-border" />
          <FilterChip active={verifiedOnly} onClick={() => setVerifiedOnly((v) => !v)}>
            <BadgeCheck className="size-3" aria-hidden /> Verified
          </FilterChip>
          <FilterChip active={heldOnly} onClick={() => setHeldOnly((v) => !v)}>
            <Coins className="size-3" aria-hidden /> I hold points
          </FilterChip>
        </div>
      </div>

      <Section
        icon={Compass}
        title="Merchants"
        desc="One loyalty token per brand — verified merchants carry the flame badge."
        right={
          merchants.data ? (
            <SectionMeta>
              {Math.min(visible, filtered.length)} of {filtered.length}
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
        ) : shown.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shown.map((m) => (
                <DiscoverCard
                  key={m.address.toBase58()}
                  merchant={m}
                  held={holdingByMint.has(m.pointMint.toBase58())}
                />
              ))}
            </div>
            <div ref={sentinelRef} className="flex items-center justify-center py-4">
              {hasMore ? (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs">
                  <RefreshCw className="size-3.5 animate-spin" aria-hidden />
                  Loading more…
                </span>
              ) : (
                <span className="font-mono text-[11px] text-muted-foreground/50 tabular-nums">
                  {filtered.length} merchant{filtered.length === 1 ? '' : 's'} shown
                </span>
              )}
            </div>
          </>
        ) : (
          <EmptySlate icon={Search}>No merchants match these filters.</EmptySlate>
        )}
      </Section>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors ${
        active
          ? 'bg-flame/10 font-medium text-flame ring-1 ring-flame/30 ring-inset'
          : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
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
