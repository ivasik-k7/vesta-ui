import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * The single boundary between the string-typed Action Registry and TanStack's
 * typed router. Registry routes are validated at runtime by the router (unknown
 * → 404); we deliberately cast `to` here, in one place, rather than couple the
 * registry to generated route literals.
 */
export interface NavItemProps {
  to: string
  label: string
  icon: LucideIcon
  /** Exact-match active (roots like /app, /app/console). */
  exact?: boolean
  /** Trailing meta — a count or a small status node. */
  trailing?: ReactNode
  onNavigate?: () => void
}

export function NavItem({ to, label, icon: Icon, exact, trailing, onNavigate }: NavItemProps) {
  return (
    <Link
      to={to as never}
      onClick={onNavigate}
      activeOptions={{ exact }}
      className="group relative flex items-center gap-3 rounded-lg py-2 pr-3 pl-4 text-[13.5px] text-muted-foreground transition-all hover:bg-secondary/70 hover:text-foreground data-[status=active]:bg-flame/10 data-[status=active]:font-medium data-[status=active]:text-flame"
    >
      <span
        aria-hidden
        className="-translate-y-1/2 absolute top-1/2 left-0 h-4 w-[3px] scale-y-0 rounded-full bg-flame transition-transform duration-200 group-data-[status=active]:scale-y-100"
      />
      <Icon className="size-[17px] shrink-0 text-muted-foreground/70 transition-colors group-hover:text-foreground group-data-[status=active]:text-flame" />
      <span className="flex-1 truncate">{label}</span>
      {trailing ? (
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground/60 tabular-nums">
          {trailing}
        </span>
      ) : null}
    </Link>
  )
}
