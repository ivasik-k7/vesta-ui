import { Link } from '@tanstack/react-router'
import { BadgeCheck, Flame, Settings2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMoney } from '@/components/app/money'
import { ShareButton } from '@/components/app/share-button'
import { decayHealth, liveUiAmount } from '@/lib/vesta/decay'
import type { Holding } from '@/lib/vesta/queries'

// Recompute the on-chain interest-bearing value against the wall clock every
// 250ms — a real balance genuinely cooling, straight from the mint's config.
function useNow(intervalMs = 250) {
  const [now, setNow] = useState(() => Date.now() / 1000)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / 1000), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export function FlameBalanceCard({ holding }: { holding: Holding }) {
  const now = useNow()
  const { format } = useMoney()
  const ui = liveUiAmount(holding.raw, holding.mint, now)
  const health = decayHealth(holding.mint, now)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
      <div
        aria-hidden
        className="-right-8 -top-8 absolute size-32 rounded-full bg-flame/15 blur-3xl transition-opacity duration-1000"
        style={{ opacity: 0.3 + health * 0.7 }}
      />
      <div className="relative flex items-center justify-between">
        <p className="font-heading font-semibold">{holding.merchant.name}</p>
        <Flame
          className="size-5 text-flame drop-shadow-[0_0_10px_rgb(226_71_10/0.4)]"
          aria-hidden
          style={{ opacity: 0.4 + health * 0.6 }}
        />
      </div>
      <p className="relative mt-4 font-mono text-4xl tabular-nums tracking-tight">
        {format(ui)}
        <span className="ml-2 text-base text-muted-foreground">pts</span>
      </p>
      <p className="relative mt-1 text-muted-foreground text-sm">
        {holding.raw.toString()} raw · {holding.mint.rateBps / 100}%/yr decay
      </p>
    </div>
  )
}

/**
 * Standardized wallet token card: identical anatomy and height for every
 * holding — header (brand + live flame), balance block, uniform footer cells.
 */
export function TokenCard({ holding }: { holding: Holding }) {
  const now = useNow()
  const { format } = useMoney()
  const ui = liveUiAmount(holding.raw, holding.mint, now)
  const health = decayHealth(holding.mint, now)
  const mint = holding.merchant.pointMint.toBase58()

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/50 shadow-panel ring-1 ring-foreground/[0.02] ring-inset backdrop-blur-sm transition-colors duration-300 hover:border-flame/40">
      <div
        aria-hidden
        className="-right-10 -top-10 pointer-events-none absolute size-28 rounded-full bg-flame/10 blur-3xl transition-opacity duration-1000"
        style={{ opacity: 0.2 + health * 0.8 }}
      />

      {/* Header */}
      <div className="relative flex items-center gap-2 px-4 pt-3.5 pb-2.5">
        <span
          aria-hidden
          className="h-3.5 w-1 shrink-0 rounded-full bg-gradient-to-b from-flame to-flame-deep"
        />
        <p className="min-w-0 truncate font-semibold text-sm">{holding.merchant.name}</p>
        {holding.merchant.verified ? (
          <BadgeCheck className="size-3.5 shrink-0 text-flame" aria-label="Verified" />
        ) : null}
        <Flame
          className="ml-auto size-4 shrink-0 text-flame"
          aria-hidden
          style={{ opacity: 0.35 + health * 0.65 }}
        />
      </div>
      <div
        aria-hidden
        className="mx-4 h-px bg-gradient-to-r from-border via-border/50 to-transparent"
      />

      {/* Balance */}
      <div className="relative flex-1 px-4 py-3">
        <p className="font-mono text-3xl tabular-nums tracking-tight">
          {format(ui)}
          <span className="ml-1.5 text-muted-foreground text-sm">pts</span>
        </p>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground/70">
          {holding.mint.rateBps / 100}%/yr decay · cooling live
        </p>
      </div>

      {/* Uniform footer cells */}
      <div className="relative grid grid-cols-2 divide-x divide-border/40 border-border/40 border-t">
        <Link
          to="/app/token/$mint"
          params={{ mint }}
          className="flex items-center justify-center gap-1.5 py-2.5 text-muted-foreground text-xs transition-colors hover:bg-flame/[0.05] hover:text-flame"
        >
          <Settings2 className="size-3.5" aria-hidden />
          Manage
        </Link>
        <ShareButton
          value={mint}
          what="Mint"
          label="Share"
          className="flex w-full items-center justify-center gap-1.5 py-2.5 text-muted-foreground text-xs transition-colors hover:bg-flame/[0.05] hover:text-flame"
        />
      </div>
    </div>
  )
}
