import { createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight, BadgeCheck, Search, Store, Ticket, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { fmtCount, fmtPoints } from '@/components/app/metric'
import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'
import { Skeleton } from '@/components/ui/skeleton'
import { DECIMALS } from '@/lib/vesta/constants'
import type { Merchant } from '@/lib/vesta/decode'
import { useMerchants, useOffers } from '@/lib/vesta/queries'

const CATEGORY_LABEL = ['General', 'Food & Drink', 'Retail', 'Services', 'Entertainment', 'Travel']

export const Route = createFileRoute('/merchant')({
  component: MerchantDirectory,
})

const addr = (k: string) => `${k.slice(0, 4)}…${k.slice(-4)}`
const explorer = (k: string) => `https://explorer.solana.com/address/${k}?cluster=devnet`

function MerchantDirectory() {
  const merchants = useMerchants()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const all = merchants.data ?? []
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.pointMint.toBase58().toLowerCase().includes(q) ||
        m.address.toBase58().toLowerCase().includes(q),
    )
  }, [merchants.data, query])

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
      <SectionHeader
        kicker="Merchant directory · live on devnet"
        title="Every merchant,"
        emphasis="read from the chain"
        sub="This is not a mock list — it's a getProgramAccounts scan of live Merchant PDAs. Each carries a Token-2022 mint with decay, a transfer guard, and a clawback delegate."
      />

      <div className="mt-8 flex items-center gap-2 rounded-lg border border-border bg-card px-3 md:max-w-sm">
        <Search className="size-4 text-muted-foreground" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or address"
          className="w-full bg-transparent py-2 text-sm outline-none"
        />
      </div>

      <div className="mt-6">
        {merchants.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => `msk-${i}`).map((k) => (
              <Skeleton key={k} className="h-44" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((merchant, i) => (
              <Reveal key={merchant.address.toBase58()} delay={0.04 * i}>
                <MerchantCard merchant={merchant} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border border-dashed bg-card/40 p-10 text-center text-muted-foreground text-sm">
            No merchants registered yet on this deployment.
          </div>
        )}
      </div>
    </main>
  )
}

function MerchantCard({ merchant }: { merchant: Merchant }) {
  const offers = useOffers(merchant.address)

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Store className="size-5 text-flame" aria-hidden />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-heading font-semibold">{merchant.name}</p>
              {merchant.verified ? (
                <BadgeCheck className="size-4 text-flame" aria-label="Verified" />
              ) : null}
            </div>
            <a
              href={explorer(merchant.pointMint.toBase58())}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-1 font-mono text-muted-foreground text-xs hover:text-foreground"
            >
              mint {addr(merchant.pointMint.toBase58())}
              <ArrowUpRight
                className="size-3 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </a>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-flame text-sm">{merchant.decayRateBps / 100}%/yr</p>
          <p className="text-muted-foreground text-xs">
            {fmtCount(merchant.customerCount)} customers
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground text-xs">
          {CATEGORY_LABEL[merchant.category] ?? 'General'}
        </span>
        {merchant.joinedAlliance ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground text-xs">
            <Users className="size-3" aria-hidden /> Alliance
          </span>
        ) : null}
        <span className="ml-auto font-mono text-muted-foreground text-xs">
          {fmtPoints(merchant.lifetimePointsIssued)} issued
        </span>
      </div>

      <div className="mt-4 border-border/60 border-t pt-4">
        <p className="flex items-center gap-1.5 font-medium text-[13px] text-muted-foreground">
          <Ticket className="size-3.5" aria-hidden />
          Offers
        </p>
        {offers.data && offers.data.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {offers.data.map((offer) => (
              <li
                key={offer.address.toBase58()}
                className="flex items-center justify-between font-mono text-sm"
              >
                <span className="text-muted-foreground">#{offer.id.toString()}</span>
                <span>{(Number(offer.pricePoints) / 10 ** DECIMALS).toFixed(2)} pts</span>
                <span className="text-muted-foreground text-xs">{offer.supplyRemaining} left</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-muted-foreground text-sm">No active offers.</p>
        )}
      </div>
    </div>
  )
}
