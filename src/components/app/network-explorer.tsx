import {
  ArrowUpRight,
  Award,
  BadgeCheck,
  Flame,
  Globe,
  Repeat,
  ShieldX,
  Store,
  Ticket,
  Users,
} from 'lucide-react'

import { fmtCount, fmtPoints, Metric } from '@/components/app/metric'
import { EmptySlate, Section, SectionMeta } from '@/components/app/section'
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
      <Section
        icon={Globe}
        title="Protocol totals"
        desc="Aggregated live from every Merchant and Alliance account — no backend, no cache."
      >
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
          <Metric
            icon={Users}
            label="Alliances"
            value={data?.alliances ?? '—'}
            loading={isLoading}
          />
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
      </Section>

      <div className="grid items-start gap-8 lg:grid-cols-2">
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
    <Section
      icon={Store}
      title="Leading merchants"
      desc="Ranked by customers reached."
      right={top.length > 0 ? <SectionMeta>top {top.length}</SectionMeta> : undefined}
    >
      {loading ? (
        <Skeleton className="h-64" />
      ) : top.length === 0 ? (
        <EmptySlate icon={Store}>No merchants yet.</EmptySlate>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card/50 ring-1 ring-foreground/[0.02] ring-inset backdrop-blur-sm">
          <div className="divide-y divide-border/40">
            {top.map((m, i) => (
              <a
                key={m.address.toBase58()}
                href={explorer(m.pointMint.toBase58())}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-flame/[0.05]"
              >
                <span className="w-5 font-mono text-muted-foreground/60 text-sm tabular-nums">
                  {i + 1}
                </span>
                <span className="truncate font-medium text-sm">{m.name}</span>
                {m.verified ? (
                  <BadgeCheck className="size-3.5 shrink-0 text-flame" aria-hidden />
                ) : null}
                <span className="ml-auto flex items-center gap-4 font-mono text-[11px] text-muted-foreground/70 tabular-nums">
                  <span>{fmtCount(m.customerCount)} customers</span>
                  <span className="hidden sm:inline">
                    {fmtPoints(m.lifetimePointsIssued)} issued
                  </span>
                  <ArrowUpRight className="size-3.5 text-muted-foreground/40" aria-hidden />
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </Section>
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
    <Section
      icon={Users}
      title="Alliances"
      desc="Cross-brand swap groups with governed rates."
      right={alliances.length > 0 ? <SectionMeta>{alliances.length}</SectionMeta> : undefined}
    >
      {loading ? (
        <Skeleton className="h-64" />
      ) : alliances.length === 0 ? (
        <EmptySlate icon={Users}>No alliances yet.</EmptySlate>
      ) : (
        <div className="space-y-3">
          {alliances.map((a) => {
            const members = merchants.filter((m) => m.joinedAlliance?.equals(a.address))
            return (
              <div
                key={a.address.toBase58()}
                className="overflow-hidden rounded-2xl border border-border bg-card/50 ring-1 ring-foreground/[0.02] ring-inset backdrop-blur-sm transition-colors hover:border-line-strong"
              >
                <div className="flex items-center gap-2 px-4 pt-3 pb-2.5">
                  <span
                    aria-hidden
                    className="h-3.5 w-1 shrink-0 rounded-full bg-gradient-to-b from-flame to-flame-deep"
                  />
                  <p className="min-w-0 truncate font-medium text-sm">{a.name || 'Alliance'}</p>
                  <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground/70 tabular-nums">
                    {a.memberCount} members · {fmtCount(a.totalSwaps)} swaps
                  </span>
                </div>
                {members.length > 0 ? (
                  <>
                    <div
                      aria-hidden
                      className="mx-4 h-px bg-gradient-to-r from-border via-border/50 to-transparent"
                    />
                    <div className="flex flex-wrap gap-1.5 px-4 py-3">
                      {members.map((m) => (
                        <span
                          key={m.address.toBase58()}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/50 px-2.5 py-1 text-xs"
                        >
                          <Store className="size-3 text-flame" aria-hidden />
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </Section>
  )
}
