import { createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react'

import { PageHeader } from '@/components/app/shell'
import { type ActivityEntry, useActivity } from '@/lib/vesta/queries'

export const Route = createFileRoute('/app/activity')({
  component: ActivityPage,
})

function ActivityPage() {
  const activity = useActivity(25)

  return (
    <div>
      <PageHeader
        title="Activity"
        sub="The protocol's most recent transactions, straight from getSignaturesForAddress on vesta_core. Live, not cached demo data."
      />
      {activity.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading recent signatures…</p>
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
  const when = entry.blockTime
    ? new Date(entry.blockTime * 1000).toLocaleString()
    : `slot ${entry.slot}`
  return (
    <a
      href={`https://explorer.solana.com/tx/${entry.signature}?cluster=devnet`}
      target="_blank"
      rel="noreferrer"
      className={`group flex items-center gap-3 bg-card px-5 py-3 transition-colors hover:bg-secondary ${
        last ? '' : 'border-border border-b'
      }`}
    >
      {entry.err ? (
        <XCircle className="size-4 shrink-0 text-red-400" aria-hidden />
      ) : (
        <CheckCircle2 className="size-4 shrink-0 text-flame" aria-hidden />
      )}
      <span className="font-mono text-sm">
        {entry.signature.slice(0, 8)}…{entry.signature.slice(-8)}
      </span>
      <span className="ml-auto text-muted-foreground text-xs">{when}</span>
      <ArrowUpRight
        className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </a>
  )
}
