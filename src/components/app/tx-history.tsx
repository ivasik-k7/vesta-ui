import type { PublicKey } from '@solana/web3.js'
import { ArrowUpRight, CircleDot } from 'lucide-react'

import { EmptySlate, Section, SectionMeta } from '@/components/app/section'
import { Skeleton } from '@/components/ui/skeleton'
import { useAddressActivity } from '@/lib/vesta/queries'
import { explorerTx } from '@/lib/vesta/tx'

/** Recent on-chain transactions touching an address (a mint, a merchant PDA),
 *  rendered in the standard section language. Read live from the chain. */
export function TxHistory({
  address,
  title = 'Transaction history',
  desc = 'The newest transactions touching this account, straight from the chain.',
  limit = 12,
}: {
  address: PublicKey
  title?: string
  desc?: string
  limit?: number
}) {
  const activity = useAddressActivity(address, limit)
  const rows = activity.data ?? []

  return (
    <Section
      icon={CircleDot}
      title={title}
      desc={desc}
      right={rows.length > 0 ? <SectionMeta>{rows.length}</SectionMeta> : undefined}
    >
      {activity.isLoading ? (
        <Skeleton className="h-40" />
      ) : rows.length === 0 ? (
        <EmptySlate icon={CircleDot}>No transactions yet.</EmptySlate>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card/50 ring-1 ring-foreground/[0.02] ring-inset backdrop-blur-sm">
          <div className="divide-y divide-border/40">
            {rows.map((entry) => (
              <a
                key={entry.signature}
                href={explorerTx(entry.signature)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-flame/[0.05]"
              >
                <CircleDot
                  className={entry.err ? 'size-3.5 text-red-400' : 'size-3.5 text-emerald-400'}
                  aria-hidden
                />
                <span className="font-mono text-muted-foreground text-xs">
                  {entry.signature.slice(0, 8)}…{entry.signature.slice(-8)}
                </span>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground/70 tabular-nums">
                  {entry.blockTime
                    ? new Date(entry.blockTime * 1000).toLocaleString()
                    : `slot ${entry.slot}`}
                </span>
                <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/40" aria-hidden />
              </a>
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}
