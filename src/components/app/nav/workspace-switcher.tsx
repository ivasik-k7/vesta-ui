import { useNavigate } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { BadgeCheck, Check, ChevronsUpDown, Gauge, Plus, Store, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useCreateMerchant } from '@/components/app/create-merchant'
import { identityGradient as glyph } from '@/lib/ui/gradient'
import { useWorkspace, type Workspace, type WorkspaceKind } from '@/lib/workspace/context'

const KIND_ICON: Record<WorkspaceKind, LucideIcon> = {
  customer: User,
  merchant: Store,
  issuer: BadgeCheck,
  admin: Gauge,
}

const KIND_WORD: Record<WorkspaceKind, string> = {
  customer: 'Customer',
  merchant: 'Merchant',
  issuer: 'Issuer',
  admin: 'Admin',
}

/** Solflare-style context switcher: the active role/brand identity, expanding
 *  to every workspace the wallet qualifies for (Customer, each owned Merchant,
 *  Issuer, Admin) plus a "launch a program" affordance. */
export function WorkspaceSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const { workspaces, active, setActiveId, homeOf } = useWorkspace()
  const navigate = useNavigate()
  const createMerchant = useCreateMerchant()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const select = (w: Workspace) => {
    setActiveId(w.id)
    setOpen(false)
    onNavigate?.()
    navigate({ to: homeOf(w.id) as never })
  }

  const merchants = workspaces.filter((w) => w.kind === 'merchant')
  const singleton = workspaces.length === 1

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !singleton && setOpen((v) => !v)}
        className={`flex w-full items-center gap-2.5 rounded-xl border border-border bg-background/60 px-2.5 py-2 text-left transition-colors ${
          singleton ? 'cursor-default' : 'hover:border-flame/40'
        }`}
      >
        <span
          className="size-8 shrink-0 rounded-lg ring-1 ring-flame/30"
          style={{ background: glyph(active.seed) }}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-[13.5px] leading-tight">
            {active.label}
          </span>
          <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-[0.12em]">
            {KIND_WORD[active.kind]}
          </span>
        </span>
        {!singleton ? (
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground/60" aria-hidden />
        ) : null}
      </button>

      {open ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-border bg-popover shadow-panel-lg">
          <div className="max-h-[60vh] overflow-y-auto p-1.5">
            <Row label="Customer">
              {workspaces
                .filter((w) => w.kind === 'customer')
                .map((w) => (
                  <WorkspaceRow key={w.id} w={w} active={w.id === active.id} onSelect={select} />
                ))}
            </Row>
            {merchants.length > 0 ? (
              <Row label={merchants.length > 1 ? 'Your programs' : 'Your program'}>
                {merchants.map((w) => (
                  <WorkspaceRow key={w.id} w={w} active={w.id === active.id} onSelect={select} />
                ))}
              </Row>
            ) : null}
            {workspaces.some((w) => w.kind === 'issuer' || w.kind === 'admin') ? (
              <Row label="Advanced">
                {workspaces
                  .filter((w) => w.kind === 'issuer' || w.kind === 'admin')
                  .map((w) => (
                    <WorkspaceRow key={w.id} w={w} active={w.id === active.id} onSelect={select} />
                  ))}
              </Row>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onNavigate?.()
              createMerchant.open()
            }}
            className="flex w-full items-center gap-2 border-border/60 border-t px-3.5 py-2.5 text-left text-flame text-xs transition-colors hover:bg-flame/[0.06]"
          >
            <Plus className="size-3.5" aria-hidden />
            Launch a new program
          </button>
        </div>
      ) : null}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-2.5 py-1 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[0.12em]">
        {label}
      </p>
      {children}
    </div>
  )
}

function WorkspaceRow({
  w,
  active,
  onSelect,
}: {
  w: Workspace
  active: boolean
  onSelect: (w: Workspace) => void
}) {
  const Icon = KIND_ICON[w.kind]
  return (
    <button
      type="button"
      onClick={() => onSelect(w)}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-secondary"
    >
      <span
        className="size-6 shrink-0 rounded-md ring-1 ring-flame/25"
        style={{ background: glyph(w.seed) }}
        aria-hidden
      />
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="truncate text-sm">{w.label}</span>
      </span>
      {active ? <Check className="size-3.5 shrink-0 text-flame" aria-hidden /> : null}
    </button>
  )
}
