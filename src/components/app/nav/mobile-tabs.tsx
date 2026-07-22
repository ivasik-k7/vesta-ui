import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'

import { navActionsFor } from '@/lib/nav/actions'
import { useWorkspace } from '@/lib/workspace/context'

const EXACT_ROOTS = new Set(['/app', '/app/console', '/app/issuer', '/app/admin'])

/** Thumb-reach bottom navigation on phones: the active workspace's primary
 *  destinations, plus a "More" that opens the full drawer. */
export function MobileTabBar({ onMore }: { onMore: () => void }) {
  const { active } = useWorkspace()
  const items = navActionsFor(active.kind).slice(0, 4)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-border border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      {items.map((a) => (
        <Link
          key={a.id}
          to={a.route as never}
          activeOptions={{ exact: EXACT_ROOTS.has(a.route) }}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground transition-colors data-[status=active]:text-flame"
        >
          <a.icon className="size-5" aria-hidden />
          <span className="max-w-full truncate px-1">{a.label}</span>
        </Link>
      ))}
      <button
        type="button"
        onClick={onMore}
        className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <Menu className="size-5" aria-hidden />
        <span>More</span>
      </button>
    </nav>
  )
}
