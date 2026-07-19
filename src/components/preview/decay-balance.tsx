import { Flame } from 'lucide-react'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

// Same visual acceleration as the landing demo: −20%/yr, sped up so the
// mechanic is visible. Preview-only — devnet wiring replaces this state.
const TICK_MS = 100
const DEMO_DECAY_PER_TICK = 0.99985

export function useDecayingBalance(initial: number) {
  const [balance, setBalance] = useState(initial)
  useEffect(() => {
    const id = setInterval(() => {
      setBalance((value) => Math.max(value * DEMO_DECAY_PER_TICK, 0))
    }, TICK_MS)
    return () => clearInterval(id)
  }, [])
  return { balance, checkIn: (amount: number) => setBalance((v) => v + amount) }
}

export function MerchantWalletCard({
  name,
  symbol,
  initial,
  streakDays,
  className,
}: {
  name: string
  symbol: string
  initial: number
  streakDays: number
  className?: string
}) {
  const { balance } = useDecayingBalance(initial)
  const multiplier = 1 + Math.min(streakDays, 30) * 0.02

  return (
    <div className={cn('rounded-2xl border border-border bg-card p-6', className)}>
      <div className="flex items-center justify-between">
        <p className="font-heading font-semibold">{name}</p>
        <Flame className="size-4 text-flame" aria-hidden />
      </div>
      <p className="mt-4 font-mono text-4xl tabular-nums tracking-tight">
        {balance.toFixed(2)} <span className="text-base text-muted-foreground">{symbol}</span>
      </p>
      <p className="mt-1 text-muted-foreground text-sm">cooling live · −20%/yr on-chain</p>
      <p className="mt-4 border-border border-t pt-3 font-mono text-muted-foreground text-xs tabular-nums">
        streak <span className="text-foreground">{streakDays}d</span> · earn multiplier{' '}
        <span className="text-flame">×{multiplier.toFixed(2)}</span>
      </p>
    </div>
  )
}
