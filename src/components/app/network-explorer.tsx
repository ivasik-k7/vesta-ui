import { ArrowUpRight, Award, Flame, Repeat, ShieldX, Store, Ticket, Users } from 'lucide-react'

import { fmtCount, fmtPoints, Metric } from '@/components/app/metric'
import { Skeleton } from '@/components/ui/skeleton'
import type { Alliance, Merchant } from '@/lib/vesta/decode'
import { useAlliances, useMerchants, useNetworkStats } from '@/lib/vesta/queries'

const explorer = (k: string) => `https://explorer.solana.com/address/${k}?cluster=devnet`

/** Protocol-wide explorer: live KPIs, leading merchants, alliances. */
export function NetworkExplorer() {
  const { data, isLoading } = useNetworkStats()
  const merchants = useMerchants()
  const alliances = useAlliances()

  return (
    <div className="space-y-10">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={Store}
          label="Merchants"
          value={data?.merchants ?? '—'}
          hint={data ? `${data.verified} verified` : undefined}
          loading={isLoading}
          accent
        />
        <Metric
          icon={Users}
          label="Customers reached"
          value={data ? fmtCount(data.totalCustomers) : '—'}
          loading={isLoading}
        />
        <Metric
          icon={Flame}
          label="Points issued"
          value={data ? fmtPoints(data.totalPointsIssued) : '—'}
          hint="lifetime"
          loading={isLoading}
          accent
        />
        <Metric
          icon={Ticket}
          label="Redemptions"
          value={data ? fmtCount(data.totalRedemptions) : '—'}
          loading={isLoading}
        />
        <Metric icon={Users} label="Alliances" value={data?.alliances ?? '—'} loading={isLoading} />
        <Metric
          icon={Repeat}
          label="Alliance swaps"
          value={data ? fmtCount(data.allianceSwaps) : '—'}
          loading={isLoading}
        />
        <Metric
          icon={Award}
          label="Badges minted"
          value={data ? fmtCount(data.totalBadges) : '—'}
          hint="soulbound"
          loading={isLoading}
        />
        <Metric
          icon={ShieldX}
          label="Clawed back"
          value={data ? fmtPoints(data.totalClawedBack) : '—'}
          hint="audited"
          loading={isLoading}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <TopMerchants merchants={merchants.data ?? []} loading={merchants.isLoading} />
        <Alliances
          alliances={alliances.data ?? []}
          merchants={merchants.data ?? []}
          loading={alliances.isLoading}
        />
      </div>
    </div>
  )
}

function TopMerchants({ merchants, loading }: { merchants: Merchant[]; loading: boolean }) {
  const top = [...merchants].sort((a, b) => Number(b.customerCount - a.customerCount)).slice(0, 8)
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-1.5 font-heading font-semibold text-lg">
        <Store className="size-4 text-flame" aria-hidden /> Leading merchants
      </h2>
      {loading ? (
        <Skeleton className="h-64" />
      ) : top.length === 0 ? (
        <p className="text-muted-foreground text-sm">No merchants yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          {top.map((m, i) => (
            <a
              key={m.address.toBase58()}
              href={explorer(m.pointMint.toBase58())}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 border-border border-b bg-card px-5 py-3.5 transition-colors last:border-0 hover:bg-secondary"
            >
              <span className="w-5 font-mono text-muted-foreground/60 text-sm tabular-nums">
                {i + 1}
              </span>
              <span className="truncate font-medium text-sm">{m.name}</span>
              {m.verified ? <Award className="size-3.5 shrink-0 text-flame" aria-hidden /> : null}
              <span className="ml-auto flex items-center gap-4 text-muted-foreground text-xs tabular-nums">
                <span>{fmtCount(m.customerCount)} customers</span>
                <span className="hidden sm:inline">{fmtPoints(m.lifetimePointsIssued)} issued</span>
                <ArrowUpRight className="size-3.5 text-muted-foreground/40" aria-hidden />
              </span>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}

function Alliances({
  alliances,
  merchants,
  loading,
}: {
  alliances: Alliance[]
  merchants: Merchant[]
  loading: boolean
}) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-1.5 font-heading font-semibold text-lg">
        <Users className="size-4 text-flame" aria-hidden /> Alliances
      </h2>
      {loading ? (
        <Skeleton className="h-64" />
      ) : alliances.length === 0 ? (
        <p className="text-muted-foreground text-sm">No alliances yet.</p>
      ) : (
        <div className="space-y-3">
          {alliances.map((a) => {
            const members = merchants.filter((m) => m.joinedAlliance?.equals(a.address))
            return (
              <div
                key={a.address.toBase58()}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-medium">{a.name || 'Alliance'}</p>
                  <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                    {a.memberCount} members · {fmtCount(a.totalSwaps)} swaps
                  </span>
                </div>
                {members.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {members.map((m) => (
                      <span
                        key={m.address.toBase58()}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs"
                      >
                        <Store className="size-3 text-flame" aria-hidden />
                        {m.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
