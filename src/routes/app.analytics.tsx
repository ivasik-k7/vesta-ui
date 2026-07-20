import { createFileRoute } from '@tanstack/react-router'
import { Activity, BarChart3, Coins, Cpu, Flame, Store, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'

import { fmtCount, fmtPoints, Metric } from '@/components/app/metric'
import { PageHeader } from '@/components/app/shell'
import { Skeleton } from '@/components/ui/skeleton'
import { CATEGORY_META, type Category } from '@/lib/vesta/decoder'
import {
  type ActivityRecord,
  useActivityFeed,
  useMyMerchant,
  useNetworkStats,
} from '@/lib/vesta/queries'

export const Route = createFileRoute('/app/analytics')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const feed = useActivityFeed('protocol', 50)
  const net = useNetworkStats()
  const merchant = useMyMerchant()
  const records = feed.data ?? []

  const catCounts = useMemo(() => countCategories(records), [records])
  const daily = useMemo(() => countByDay(records), [records])
  const fees = records.reduce((a, r) => a + r.fee, 0)
  const cu = records.reduce((a, r) => a + r.computeUnits, 0)
  const failed = records.filter((r) => r.err).length

  return (
    <div>
      <PageHeader
        title="Analytics"
        sub="On-chain analytics computed live from the transaction stream and account state — action mix, throughput over time, protocol composition, and your own business."
      />

      {feed.isLoading || net.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              icon={Activity}
              label="Transactions"
              value={fmtCount(records.length)}
              hint="last 50"
              accent
            />
            <Metric
              icon={TrendingUp}
              label="Success rate"
              value={`${records.length ? Math.round(((records.length - failed) / records.length) * 100) : 100}%`}
            />
            <Metric
              icon={Coins}
              label="Fees burned"
              value={`${(fees / 1e9).toFixed(5)}`}
              hint="SOL"
            />
            <Metric icon={Cpu} label="Compute" value={fmtCount(cu)} hint="total CU" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel icon={BarChart3} title="Action mix" hint="by instruction category">
              {catCounts.length === 0 ? (
                <Empty />
              ) : (
                <BarList
                  items={catCounts.map((c) => ({
                    label: CATEGORY_META[c.category].label,
                    value: c.count,
                    dot: CATEGORY_META[c.category].dot,
                  }))}
                />
              )}
            </Panel>

            <Panel icon={Activity} title="Throughput" hint="transactions per day">
              {daily.length === 0 ? <Empty /> : <Columns data={daily} />}
            </Panel>
          </div>

          <Panel icon={Flame} title="Protocol composition" hint="lifetime, across all merchants">
            {net.data ? (
              <BarList
                items={[
                  {
                    label: 'Points issued',
                    value: pointsNum(net.data.totalPointsIssued),
                    dot: 'bg-flame',
                    fmt: 'points',
                  },
                  {
                    label: 'Alliance volume',
                    value: pointsNum(net.data.allianceVolume),
                    dot: 'bg-indigo-400',
                    fmt: 'points',
                  },
                  {
                    label: 'Clawed back',
                    value: pointsNum(net.data.totalClawedBack),
                    dot: 'bg-red-400',
                    fmt: 'points',
                  },
                  {
                    label: 'Redemptions',
                    value: Number(net.data.totalRedemptions),
                    dot: 'bg-sky-400',
                  },
                  {
                    label: 'Badges minted',
                    value: Number(net.data.totalBadges),
                    dot: 'bg-yellow-400',
                  },
                  {
                    label: 'Customers',
                    value: Number(net.data.totalCustomers),
                    dot: 'bg-emerald-400',
                  },
                ]}
              />
            ) : (
              <Empty />
            )}
          </Panel>

          {merchant.data ? (
            <Panel icon={Store} title="Your business" hint={merchant.data.name}>
              <BarList
                items={[
                  {
                    label: 'Points issued',
                    value: pointsNum(merchant.data.lifetimePointsIssued),
                    dot: 'bg-flame',
                    fmt: 'points',
                  },
                  {
                    label: 'Clawed back',
                    value: pointsNum(merchant.data.lifetimeClawedBack),
                    dot: 'bg-red-400',
                    fmt: 'points',
                  },
                  {
                    label: 'Customers',
                    value: Number(merchant.data.customerCount),
                    dot: 'bg-emerald-400',
                  },
                  {
                    label: 'Redemptions',
                    value: Number(merchant.data.lifetimeRedemptions),
                    dot: 'bg-sky-400',
                  },
                  {
                    label: 'Badges issued',
                    value: Number(merchant.data.badgesIssued),
                    dot: 'bg-yellow-400',
                  },
                ]}
              />
            </Panel>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ── data shaping ──────────────────────────────────────────────────────────────

function countCategories(records: ActivityRecord[]): { category: Category; count: number }[] {
  const counts = new Map<Category, number>()
  for (const r of records) {
    for (const a of r.actions) {
      if (a.category === 'system' || a.category === 'other') continue
      counts.set(a.category, (counts.get(a.category) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

function countByDay(records: ActivityRecord[]): { label: string; value: number }[] {
  const counts = new Map<string, number>()
  for (const r of records) {
    if (!r.blockTime) continue
    const d = new Date(r.blockTime * 1000)
    const key = `${d.getMonth() + 1}/${d.getDate()}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  // Chronological: rely on insertion order being newest-first, so reverse.
  return [...counts.entries()].map(([label, value]) => ({ label, value })).reverse()
}

const pointsNum = (raw: bigint) => Number(raw) / 100 // DECIMALS = 2

// ── presentational ──────────────────────────────────────────────────────────

function Panel({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card/50 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.75)] ring-1 ring-foreground/[0.02] ring-inset backdrop-blur-sm transition-colors duration-300 hover:border-line-strong">
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2.5">
        <span className="grid size-6 shrink-0 place-items-center rounded-lg border border-flame/20 bg-flame/10 text-flame">
          <Icon className="size-3.5" aria-hidden />
        </span>
        <h2 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.16em]">
          {title}
        </h2>
        {hint ? (
          <span className="ml-auto font-mono text-[11px] text-muted-foreground/60">{hint}</span>
        ) : null}
      </div>
      <div
        aria-hidden
        className="mx-4 h-px bg-gradient-to-r from-border via-border/50 to-transparent"
      />
      <div className="px-4 py-4">{children}</div>
    </section>
  )
}

function BarList({
  items,
}: {
  items: { label: string; value: number; dot: string; fmt?: 'points' }[]
}) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-muted-foreground text-sm">{item.label}</span>
          <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-secondary/50">
            <div
              className={`h-full rounded-md ${item.dot} opacity-80`}
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </div>
          <span className="w-20 shrink-0 text-right font-mono text-sm tabular-nums">
            {item.fmt === 'points'
              ? fmtPoints(BigInt(Math.round(item.value * 100)))
              : fmtCount(item.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function Columns({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex h-48 items-end gap-1.5">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-gradient-to-t from-flame/40 to-flame transition-all hover:from-flame/60"
              style={{ height: `${Math.max(3, (d.value / max) * 100)}%` }}
              title={`${d.value} txns`}
            />
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function Empty() {
  return (
    <p className="py-6 text-center text-muted-foreground text-sm">No data in this window yet.</p>
  )
}
