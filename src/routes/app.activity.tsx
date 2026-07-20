import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'

import { PageHeader } from '@/components/app/shell'
import { Skeleton } from '@/components/ui/skeleton'
import { type ActivityEntry, useActivity, useDecodedTransaction } from '@/lib/vesta/queries'

export const Route = createFileRoute('/app/activity')({
  component: ActivityPage,
})

function ActivityPage() {
  const activity = useActivity(25)

  return (
    <div>
      <PageHeader
        title="Activity"
        sub="Recent protocol transactions from getSignaturesForAddress on vesta_core. Expand any row to decode its instructions, fee, and compute — live, straight from the chain."
      />
      {activity.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => `ask-${i}`).map((k) => (
            <Skeleton key={k} className="h-12" />
          ))}
        </div>
      ) : activity.data && activity.data.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border">
          {activity.data.map((entry, i) => (
            <Row key={entry.signature} entry={entry} last={i === activity.data.length - 1} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No transactions yet.</p>
      )}
    </div>
  )
}

function Row({ entry, last }: { entry: ActivityEntry; last: boolean }) {
  const [open, setOpen] = useState(false)
  const tx = useDecodedTransaction(open ? entry.signature : null)
  const when = entry.blockTime
    ? new Date(entry.blockTime * 1000).toLocaleString()
    : `slot ${entry.slot}`

  return (
    <div className={last ? '' : 'border-border border-b'}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 bg-card px-5 py-3 text-left transition-colors hover:bg-secondary"
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
        {entry.err ? (
          <XCircle className="size-4 shrink-0 text-red-400" aria-hidden />
        ) : (
          <CheckCircle2 className="size-4 shrink-0 text-flame" aria-hidden />
        )}
        <span className="font-mono text-sm">
          {entry.signature.slice(0, 8)}…{entry.signature.slice(-8)}
        </span>
        <span className="ml-auto text-muted-foreground text-xs">{when}</span>
      </button>

      {open ? (
        <div className="space-y-3 border-border/60 border-t bg-background/40 px-5 py-4">
          {tx.isLoading ? (
            <p className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Decoding transaction…
            </p>
          ) : tx.data ? (
            <>
              <div>
                <p className="mb-1.5 font-medium text-[11px] text-muted-foreground/70 uppercase tracking-wide">
                  Instructions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tx.data.decoded.map((ix, idx) => (
                    <span
                      // order is meaningful and stable for a fetched tx
                      // biome-ignore lint/suspicious/noArrayIndexKey: instruction order is the identity here
                      key={`${idx}-${ix.label}`}
                      className={`rounded-md px-2 py-1 font-mono text-xs ${
                        ix.program === 'vesta_core'
                          ? 'bg-flame/15 text-flame'
                          : ix.program === 'argus'
                            ? 'bg-flame/10 text-flame-hover'
                            : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {ix.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-6 font-mono text-muted-foreground text-xs">
                <span>fee {(tx.data.fee / 1e9).toFixed(6)} SOL</span>
                <span>{tx.data.computeUnits.toLocaleString()} CU</span>
              </div>
              <a
                href={`https://explorer.solana.com/tx/${entry.signature}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-flame text-sm hover:text-flame-hover"
              >
                Open in explorer
                <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Could not load transaction.</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
