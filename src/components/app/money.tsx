import { useSettings } from '@/lib/settings/context'

const MASK = '••••'

function compactNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`
  return Math.round(n).toLocaleString()
}

/**
 * Display helpers that honor the user's banking-style preferences:
 * `hideBalances` masks any monetary value; `compact` rounds/abbreviates.
 * Non-monetary counts should keep using fmtCount directly.
 */
export function useMoney() {
  const { hideBalances, compact } = useSettings()
  const format = (value: number, opts?: { digits?: number }) => {
    if (hideBalances) return MASK
    if (compact) return compactNumber(value)
    const digits = opts?.digits ?? 2
    return value.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  }
  return { format, hideBalances, compact }
}

/** A monetary value that masks/rounds per user preference, with a unit suffix. */
export function Money({
  value,
  suffix,
  digits,
  className,
}: {
  value: number
  suffix?: string
  digits?: number
  className?: string
}) {
  const { format } = useMoney()
  return (
    <span className={className}>
      {format(value, { digits })}
      {suffix ? <span className="ml-1 text-muted-foreground text-[0.7em]">{suffix}</span> : null}
    </span>
  )
}
