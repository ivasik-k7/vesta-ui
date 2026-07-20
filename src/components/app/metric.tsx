import type { ComponentType, ReactNode } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { DECIMALS } from '@/lib/vesta/constants'

type Icon = ComponentType<{ className?: string }>

/** A single KPI tile: icon, big tabular value, label, optional footnote. */
export function Metric({
  icon: Icon,
  label,
  value,
  hint,
  loading,
  accent,
}: {
  icon?: Icon
  label: string
  value: ReactNode
  hint?: ReactNode
  loading?: boolean
  accent?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.75)] ring-1 ring-foreground/[0.02] ring-inset backdrop-blur-sm transition-colors duration-300 hover:border-line-strong">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-medium font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]">
          {label}
        </p>
        {Icon ? (
          <Icon
            className={
              accent ? 'size-4 shrink-0 text-flame' : 'size-4 shrink-0 text-muted-foreground/40'
            }
          />
        ) : null}
      </div>
      {loading ? (
        <Skeleton className="mt-2.5 h-8 w-24" />
      ) : (
        <p className="mt-1.5 font-heading font-semibold text-2xl tabular-nums tracking-tight">
          {value}
        </p>
      )}
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground/60">{hint}</p> : null}
    </div>
  )
}

/** Format a raw (decimals-scaled) bigint as compact points (1.2K, 3.4M). */
export function fmtPoints(raw: bigint): string {
  return fmtCompact(Number(raw) / 10 ** DECIMALS)
}

/** Format a plain count bigint compactly. */
export function fmtCount(n: bigint | number): string {
  return fmtCompact(Number(n))
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}
