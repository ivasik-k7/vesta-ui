import { Link } from '@tanstack/react-router'
import { ChevronDown, Flame, X } from 'lucide-react'
import { useState } from 'react'

import { NavItem } from '@/components/app/nav/nav-link'
import { WorkspaceSwitcher } from '@/components/app/nav/workspace-switcher'
import { COLLAPSED_GROUPS, GROUP_ORDER, navActionsFor, sharedNavActions } from '@/lib/nav/actions'
import { useWorkspace } from '@/lib/workspace/context'

const EXACT_ROOTS = new Set(['/app', '/app/console', '/app/issuer', '/app/admin'])

/** The full sidebar body: brand → workspace switcher → grouped registry nav →
 *  shared protocol group. Rendered on desktop and inside the mobile drawer. */
export function Sidebar({
  onNavigate,
  onClose,
}: {
  onNavigate?: () => void
  onClose?: () => void
}) {
  const { active } = useWorkspace()
  const kind = active.kind
  const groups = GROUP_ORDER[kind]
  const actions = navActionsFor(kind)

  return (
    <div className="relative flex h-full flex-col overflow-hidden border-border border-r bg-gradient-to-b from-card/60 via-card/30 to-background">
      <div
        aria-hidden
        className="-top-16 -left-10 pointer-events-none absolute size-48 rounded-full bg-flame/10 blur-3xl"
      />

      {/* Brand header */}
      <div className="relative flex h-16 shrink-0 items-center gap-2.5 px-5">
        <Link
          to="/"
          className="group flex items-center gap-2.5 font-heading font-semibold text-[15px] tracking-tight"
        >
          <span className="relative grid size-8 place-items-center rounded-xl border border-flame/25 bg-flame/10">
            <Flame className="relative size-4 text-flame" aria-hidden />
          </span>
          VESTA
        </Link>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </div>

      {/* Workspace switcher */}
      <div className="relative px-3 pb-1">
        <WorkspaceSwitcher onNavigate={onNavigate} />
      </div>

      <div className="relative mx-4 mt-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Grouped navigation (from the Action Registry) */}
      <nav className="scrollbar-flame relative flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {groups.map((group) => {
          const items = actions.filter((a) => a.group === group)
          if (items.length === 0) return null
          return (
            <SidebarGroup key={group} label={group} collapsible={COLLAPSED_GROUPS.has(group)}>
              {items.map((a) => (
                <NavItem
                  key={a.id}
                  to={a.route}
                  label={a.label}
                  icon={a.icon}
                  exact={EXACT_ROOTS.has(a.route)}
                  onNavigate={onNavigate}
                />
              ))}
            </SidebarGroup>
          )
        })}

        <SidebarGroup label="Protocol">
          {sharedNavActions().map((a) => (
            <NavItem
              key={a.id}
              to={a.route}
              label={a.label}
              icon={a.icon}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarGroup>
      </nav>
    </div>
  )
}

export function SidebarGroup({
  label,
  collapsible,
  children,
}: {
  label: string
  collapsible?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(!collapsible)

  return (
    <div>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mb-1 flex w-full items-center gap-1.5 px-3 font-semibold text-[10px] text-muted-foreground/50 uppercase tracking-[0.12em] transition-colors hover:text-muted-foreground"
        >
          <span className="size-1 rounded-full bg-flame/40" aria-hidden />
          <span className="flex-1 text-left">{label}</span>
          <ChevronDown
            className={`size-3 transition-transform ${open ? '' : '-rotate-90'}`}
            aria-hidden
          />
        </button>
      ) : (
        <p className="mb-1 flex items-center gap-1.5 px-3 font-semibold text-[10px] text-muted-foreground/50 uppercase tracking-[0.12em]">
          <span className="size-1 rounded-full bg-flame/40" aria-hidden />
          {label}
        </p>
      )}
      {open ? <div className="space-y-0.5">{children}</div> : null}
    </div>
  )
}
