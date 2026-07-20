import { ArrowUpRight, Bell, Check, CheckCheck, Info, Trash2, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { type AppNotification, type NotifyKind, useNotify } from '@/lib/notify/context'
import { explorerTx } from '@/lib/vesta/tx'

const ICON: Record<NotifyKind, { icon: typeof Info; color: string }> = {
  success: { icon: Check, color: 'text-emerald-400' },
  error: { icon: XCircle, color: 'text-red-400' },
  info: { icon: Info, color: 'text-flame' },
}

export function NotificationBell() {
  const { notifications, unread, markAllSeen, removeNotification, clearAll } = useNotify()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && unread > 0) markAllSeen()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="-right-0.5 -top-0.5 absolute flex min-w-4 items-center justify-center rounded-full bg-flame px-1 font-medium text-[10px] text-primary-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
          <div className="flex items-center justify-between border-border/60 border-b px-4 py-2.5">
            <p className="font-medium text-sm">Notifications</p>
            {notifications.length > 0 ? (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
              >
                <CheckCheck className="size-3.5" aria-hidden /> Clear all
              </button>
            ) : null}
          </div>

          <div className="scrollbar-flame max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Bell className="size-6 text-muted-foreground/40" aria-hidden />
                <p className="text-muted-foreground text-sm">No notifications yet.</p>
                <p className="text-muted-foreground/60 text-xs">
                  Signed transactions and errors show up here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <Item key={n.id} n={n} onRemove={() => removeNotification(n.id)} />
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Item({ n, onRemove }: { n: AppNotification; onRemove: () => void }) {
  const { icon: Icon, color } = ICON[n.kind]
  return (
    <div
      className={`group flex items-start gap-3 border-border/40 border-b px-4 py-3 last:border-0 ${
        n.seen ? '' : 'bg-flame/[0.04]'
      }`}
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-sm">{n.title}</p>
          {!n.seen ? (
            <span className="size-1.5 shrink-0 rounded-full bg-flame" aria-hidden />
          ) : null}
        </div>
        {n.message ? (
          <p className="mt-0.5 break-words text-muted-foreground text-xs leading-relaxed">
            {n.message}
          </p>
        ) : null}
        <div className="mt-1 flex items-center gap-3">
          <span className="text-muted-foreground/60 text-[11px]">{ago(n.at)}</span>
          {n.txSig ? (
            <a
              href={explorerTx(n.txSig)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-[11px] text-flame hover:text-flame-hover"
            >
              explorer <ArrowUpRight className="size-2.5" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground/40 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
        aria-label="Remove"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

function ago(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(ts).toLocaleDateString()
}
