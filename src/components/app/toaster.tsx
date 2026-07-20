import { ArrowUpRight, CheckCircle2, Info, X, XCircle } from 'lucide-react'

import { type NotifyKind, useNotify } from '@/lib/notify/context'
import { explorerTx } from '@/lib/vesta/tx'

const TONE: Record<NotifyKind, { icon: typeof Info; ring: string; color: string }> = {
  success: { icon: CheckCircle2, ring: 'border-l-emerald-400', color: 'text-emerald-400' },
  error: { icon: XCircle, ring: 'border-l-red-400', color: 'text-red-400' },
  info: { icon: Info, ring: 'border-l-flame', color: 'text-flame' },
}

/** Fixed, theme-matched toast stack. Mounted once, near the app root. */
export function Toaster() {
  const { toasts, dismissToast } = useNotify()
  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end">
      {toasts.map((t) => {
        const Icon = TONE[t.kind].icon
        return (
          <div
            key={t.id}
            className={`pointer-events-auto w-full max-w-sm animate-in slide-in-from-bottom-2 fade-in overflow-hidden rounded-xl border border-border border-l-2 bg-card/95 shadow-xl backdrop-blur-md ${TONE[t.kind].ring}`}
          >
            <div className="flex items-start gap-3 p-4">
              <Icon className={`mt-0.5 size-4 shrink-0 ${TONE[t.kind].color}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{t.title}</p>
                {t.message ? (
                  <p className="mt-0.5 break-words text-muted-foreground text-xs leading-relaxed">
                    {t.message}
                  </p>
                ) : null}
                {t.txSig ? (
                  <a
                    href={explorerTx(t.txSig)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-flame text-xs hover:text-flame-hover"
                  >
                    View on explorer <ArrowUpRight className="size-3" aria-hidden />
                  </a>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="shrink-0 text-muted-foreground/60 transition-colors hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
