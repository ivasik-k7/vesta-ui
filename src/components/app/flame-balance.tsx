import { Flame } from 'lucide-react'
import { useEffect, useState } from 'react'
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
        {ui.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        <span className="ml-2 text-base text-muted-foreground">pts</span>
      </p>
      <p className="relative mt-1 text-muted-foreground text-sm">
        {holding.raw.toString()} raw · {holding.mint.rateBps / 100}%/yr decay
      </p>
    </div>
  )
}
