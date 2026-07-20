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
    <div className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-line-strong">
      <div className="flex items-center justify-between">
        <p className="font-medium text-[13px] text-muted-foreground">{label}</p>
        {Icon ? (
          <Icon className={accent ? 'size-4 text-flame' : 'size-4 text-muted-foreground/50'} />
        ) : null}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-24" />
      ) : (
        <p className="mt-2 font-heading font-semibold text-3xl tabular-nums tracking-tight">
          {value}
        </p>
      )}
      {hint ? <p className="mt-1 text-muted-foreground/70 text-xs">{hint}</p> : null}
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
