import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, CornerDownLeft, Search, Store } from 'lucide-react'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

import { type AppAction, paletteActionsFor } from '@/lib/nav/actions'
import { useMerchants } from '@/lib/vesta/queries'
import { useWorkspace } from '@/lib/workspace/context'

interface PaletteState {
  open: () => void
  close: () => void
  isOpen: boolean
}
const Ctx = createContext<PaletteState | null>(null)

export function useCommandPalette(): PaletteState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCommandPalette must be used within CommandPaletteProvider')
  return ctx
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const open = useCallback(() => setOpen(true), [])
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const value = useMemo<PaletteState>(() => ({ open, close, isOpen }), [open, close, isOpen])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

type Result =
  | { kind: 'action'; action: AppAction }
  | { kind: 'merchant'; label: string; address: string }

function score(haystack: string, q: string): number {
  const h = haystack.toLowerCase()
  const query = q.toLowerCase().trim()
  if (!query) return 1
  if (h.startsWith(query)) return 3
  if (h.includes(query)) return 2
  // token-subsequence fallback
  let i = 0
  for (const ch of query) {
    i = h.indexOf(ch, i)
    if (i === -1) return 0
    i++
  }
  return 1
}

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette()
  const { active } = useWorkspace()
  const navigate = useNavigate()
  const merchants = useMerchants()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const actions = useMemo(() => paletteActionsFor(active.kind), [active.kind])

  const results = useMemo<Result[]>(() => {
    const actionHits = actions
      .map((a) => ({ a, s: Math.max(score(a.label, q), score(a.hint ?? '', q) - 0.5) }))
      .filter((x) => x.s > 0)
      .sort((x, y) => y.s - x.s)
      .map<Result>((x) => ({ kind: 'action', action: x.a }))

    const merchHits: Result[] = (merchants.data ?? [])
      .map((m) => ({ m, s: score(m.name, q) }))
      .filter((x) => x.s > 0 && q.trim().length > 0)
      .sort((x, y) => y.s - x.s)
      .slice(0, 5)
      .map((x) => ({ kind: 'merchant', label: x.m.name, address: x.m.address.toBase58() }))

    return [...actionHits, ...merchHits]
  }, [actions, merchants.data, q])

  // Reset + focus on open.
  useEffect(() => {
    if (isOpen) {
      setQ('')
      setSel(0)
      const id = setTimeout(() => inputRef.current?.focus(), 20)
      return () => clearTimeout(id)
    }
  }, [isOpen])

  useEffect(() => {
    setSel(0)
  }, [])

  const go = useCallback(
    (r: Result) => {
      close()
      if (r.kind === 'action') navigate({ to: r.action.route as never })
      else navigate({ to: '/app/merchant/$address', params: { address: r.address } })
    },
    [close, navigate],
  )

  if (!isOpen) return null

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel((s) => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const r = results[sel]
      if (r) go(r)
    } else if (e.key === 'Escape') {
      close()
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-start justify-center p-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="fixed inset-0 animate-in fade-in bg-background/70 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl border border-border bg-popover shadow-panel-lg duration-150">
        <div className="flex items-center gap-2.5 border-border/60 border-b px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search actions, pages, merchants…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">
            esc
          </kbd>
        </div>

        <div className="scrollbar-flame max-h-[52vh] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-muted-foreground text-sm">No matches.</p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.kind === 'action' ? r.action.id : `m-${r.address}`}
                type="button"
                onClick={() => go(r)}
                onMouseMove={() => setSel(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                  i === sel ? 'bg-flame/10' : 'hover:bg-secondary'
                }`}
              >
                {r.kind === 'action' ? (
                  <r.action.icon
                    className={`size-4 shrink-0 ${i === sel ? 'text-flame' : 'text-muted-foreground'}`}
                    aria-hidden
                  />
                ) : (
                  <Store
                    className={`size-4 shrink-0 ${i === sel ? 'text-flame' : 'text-muted-foreground'}`}
                    aria-hidden
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">
                    {r.kind === 'action' ? r.action.label : r.label}
                  </span>
                  {r.kind === 'action' && r.action.hint ? (
                    <span className="block truncate text-muted-foreground text-xs">
                      {r.action.hint}
                    </span>
                  ) : (
                    <span className="block truncate text-muted-foreground text-xs">Merchant</span>
                  )}
                </span>
                {i === sel ? (
                  <CornerDownLeft className="size-3.5 shrink-0 text-flame" aria-hidden />
                ) : (
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/30" aria-hidden />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
