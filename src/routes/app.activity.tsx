import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Activity as ActivityIcon,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Coins,
  Layers,
  RefreshCw,
  Search,
  User,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { fmtCount, Metric } from '@/components/app/metric'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { Skeleton } from '@/components/ui/skeleton'
import { CATEGORY_META, type Category, type DecodedIx } from '@/lib/vesta/decoder'
import { type ActivityRecord, useActivityPages } from '@/lib/vesta/queries'
import { explorerTx } from '@/lib/vesta/tx'

export const Route = createFileRoute('/app/activity')({
  component: ActivityPage,
})

type StatusFilter = 'all' | 'success' | 'failed'
type GroupBy = 'none' | 'day' | 'category'

// Wallet-only history: small pages stream in lazily as you scroll, and only
// the newest ~160 records are kept in memory (older pages are dropped).
function ActivityPage() {
  const { publicKey } = useWallet()
  const feed = useActivityPages('wallet', 20, 8)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [cats, setCats] = useState<Set<Category>>(new Set())
  const [group, setGroup] = useState<GroupBy>('day')

  const records = useMemo(() => (feed.data?.pages ?? []).flatMap((p) => p.records), [feed.data])

  // Lazy loading: fetch the next page when the sentinel scrolls into view.
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage) {
          void feed.fetchNextPage()
        }
      },
      { rootMargin: '240px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [feed.hasNextPage, feed.isFetchingNextPage, feed.fetchNextPage])

  const presentCats = useMemo(() => {
    const set = new Set<Category>()
    for (const r of records) for (const a of r.actions) set.add(a.category)
    return [...set].filter((c) => c !== 'other' && c !== 'system').sort()
  }, [records])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return records.filter((r) => {
      if (status === 'success' && r.err) return false
      if (status === 'failed' && !r.err) return false
      if (cats.size > 0 && !r.actions.some((a) => cats.has(a.category))) return false
      if (q) {
        const hay = [r.signature, ...r.actions.map((a) => a.label)].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [records, search, status, cats])

  const stats = useMemo(() => summarize(filtered), [filtered])

  const toggleCat = (c: Category) =>
    setCats((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })

  return (
    <div>
      <PageHeader
        title="My transactions"
        sub="Everything your wallet has signed — gifts, redeems, swaps, transfers — decoded instruction by instruction, streaming in lazily from the chain."
      />

      {!publicKey ? (
        <ConnectPrompt message="Connect a devnet wallet to analyze its transactions." />
      ) : feed.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-64" />
        </div>
      ) : feed.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/[0.04] p-10 text-center">
          <XCircle className="size-6 text-red-400" aria-hidden />
          <p className="max-w-md text-muted-foreground text-sm leading-relaxed">
            Couldn't load your history — the RPC is likely rate-limiting. Set a private RPC in
            Account → Wallet &amp; funds, or retry.
          </p>
          <p className="max-w-md break-all font-mono text-[11px] text-red-400/80">
            {feed.error instanceof Error ? feed.error.message.slice(0, 160) : String(feed.error)}
          </p>
          <button
            type="button"
            onClick={() => feed.refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-flame/40 px-3 py-1.5 text-flame text-sm transition-colors hover:bg-flame/10"
          >
            <RefreshCw className="size-3.5" aria-hidden /> Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Analysis over the loaded window (respects filters) */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={ActivityIcon} label="Transactions" value={fmtCount(stats.total)} accent />
            <Metric
              icon={CheckCircle2}
              label="Success rate"
              value={`${stats.successRate}%`}
              hint={`${stats.failed} failed`}
            />
            <Metric
              icon={Layers}
              label="Instructions"
              value={fmtCount(stats.ixns)}
              hint={`${stats.distinctActions} distinct actions`}
            />
            <Metric
              icon={User}
              label="Top action"
              value={stats.topAction ?? '—'}
              hint={`${(stats.fees / 1e9).toFixed(5)} SOL fees`}
            />
          </div>

          {/* Controls */}
          <div className="space-y-3 rounded-2xl border border-border bg-card/50 p-4 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.75)] ring-1 ring-foreground/[0.02] ring-inset backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background/60 px-3 shadow-inner transition-colors focus-within:border-flame/60">
                <Search className="size-4 text-muted-foreground" aria-hidden />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search signature or action…"
                  className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <Segmented
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'success', label: 'OK' },
                    { value: 'failed', label: 'Failed' },
                  ]}
                />
                <button
                  type="button"
                  onClick={() => feed.refetch()}
                  className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Refresh"
                >
                  <RefreshCw className={`size-4 ${feed.isFetching ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {presentCats.map((c) => {
                const on = cats.has(c)
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCat(c)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors ${
                      on
                        ? CATEGORY_META[c].chip
                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${CATEGORY_META[c].dot}`} aria-hidden />
                    {CATEGORY_META[c].label}
                  </button>
                )
              })}
              {cats.size > 0 ? (
                <button
                  type="button"
                  onClick={() => setCats(new Set())}
                  className="ml-1 text-muted-foreground text-xs underline-offset-2 hover:underline"
                >
                  clear
                </button>
              ) : null}

              <div className="ml-auto">
                <Segmented
                  value={group}
                  onChange={setGroup}
                  options={[
                    { value: 'day', label: 'Day' },
                    { value: 'category', label: 'Action' },
                    { value: 'none', label: 'Flat' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-border border-dashed bg-card/40 p-10 text-center text-muted-foreground text-sm">
              {records.length === 0
                ? 'No transactions for this wallet yet.'
                : 'No transactions match these filters.'}
            </p>
          ) : (
            <Grouped records={filtered} group={group} />
          )}

          {/* Lazy-load sentinel */}
          <div ref={sentinelRef} className="flex items-center justify-center gap-3 py-2">
            <span className="font-mono text-[11px] text-muted-foreground/60 tabular-nums">
              {records.length} in view
            </span>
            {feed.isFetchingNextPage ? (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs">
                <RefreshCw className="size-3.5 animate-spin" aria-hidden />
                Loading older…
              </span>
            ) : feed.hasNextPage ? (
              <button
                type="button"
                onClick={() => feed.fetchNextPage()}
                className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:border-flame/40 hover:text-flame"
              >
                Load older
              </button>
            ) : (
              <span className="text-[11px] text-muted-foreground/60">end of history</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function summarize(records: ActivityRecord[]) {
  const total = records.length
  const failed = records.filter((r) => r.err).length
  const ixns = records.reduce((a, r) => a + r.actions.length, 0)
  const fees = records.reduce((a, r) => a + r.fee, 0)
  const actionCounts = new Map<string, number>()
  for (const r of records) {
    const label = r.primary?.label
    if (label) actionCounts.set(label, (actionCounts.get(label) ?? 0) + 1)
  }
  const topAction = [...actionCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const distinctActions = new Set(records.flatMap((r) => r.actions.map((a) => a.label))).size
  return {
    total,
    failed,
    ixns,
    fees,
    topAction,
    distinctActions,
    successRate: total === 0 ? 100 : Math.round(((total - failed) / total) * 100),
  }
}

function Grouped({ records, group }: { records: ActivityRecord[]; group: GroupBy }) {
  if (group === 'none') {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card/50 ring-1 ring-foreground/[0.02] ring-inset backdrop-blur-sm">
        {records.map((r, i) => (
          <Row key={r.signature} record={r} last={i === records.length - 1} />
        ))}
      </div>
    )
  }

  const groups = new Map<string, ActivityRecord[]>()
  for (const r of records) {
    const key =
      group === 'day'
        ? r.blockTime
          ? new Date(r.blockTime * 1000).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })
          : 'Unknown date'
        : (r.primary?.label ?? 'Other')
    const list = groups.get(key) ?? []
    list.push(r)
    groups.set(key, list)
  }

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([key, rows]) => (
        <div key={key}>
          <div className="mb-2 flex items-center gap-2 px-1">
            <p className="font-medium font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]">
              {key}
            </p>
            <span className="rounded-full border border-border bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground tabular-nums">
              {rows.length}
            </span>
            <div className="ml-2 h-px flex-1 bg-border/60" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card/50 ring-1 ring-foreground/[0.02] ring-inset backdrop-blur-sm">
            {rows.map((r, i) => (
              <Row key={r.signature} record={r} last={i === rows.length - 1} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Row({ record, last }: { record: ActivityRecord; last: boolean }) {
  const [open, setOpen] = useState(false)
  const when = record.blockTime
    ? new Date(record.blockTime * 1000).toLocaleTimeString()
    : `slot ${record.slot}`
  const primary = record.primary

  return (
    <div className={last ? '' : 'border-border border-b'}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-flame/[0.05]"
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
        {record.err ? (
          <XCircle className="size-4 shrink-0 text-red-400" aria-hidden />
        ) : (
          <CheckCircle2 className="size-4 shrink-0 text-emerald-400" aria-hidden />
        )}

        <span className="flex min-w-0 items-center gap-2">
          {primary ? (
            <span
              className={`shrink-0 rounded-md px-2 py-0.5 font-medium text-xs ${CATEGORY_META[primary.category].chip}`}
            >
              {primary.label}
            </span>
          ) : (
            <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 font-medium text-muted-foreground text-xs">
              <Coins className="mr-1 inline size-3" aria-hidden />
              System
            </span>
          )}
          {record.actions.length > 1 ? (
            <span className="shrink-0 text-muted-foreground text-xs">
              +{record.actions.length - 1}
            </span>
          ) : null}
        </span>

        <span className="ml-auto flex shrink-0 items-center gap-3 text-muted-foreground text-xs">
          <span className="hidden font-mono sm:inline">
            {record.signature.slice(0, 6)}…{record.signature.slice(-6)}
          </span>
          <span>{when}</span>
        </span>
      </button>

      {open ? (
        <div className="space-y-3 border-border/60 border-t bg-background/40 px-5 py-4">
          <div>
            <p className="mb-1.5 font-medium font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]">
              Instructions ({record.actions.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {record.actions.map((ix, idx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: instruction order is the identity
                <IxChip key={`${idx}-${ix.label}`} ix={ix} />
              ))}
            </div>
          </div>
          <div className="grid gap-2 font-mono text-muted-foreground text-xs sm:grid-cols-2">
            <span>slot {record.slot.toLocaleString()}</span>
            <span>fee {(record.fee / 1e9).toFixed(6)} SOL</span>
            <span>{record.computeUnits.toLocaleString()} CU</span>
          </div>
          <a
            href={explorerTx(record.signature)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-flame text-sm hover:text-flame-hover"
          >
            Open in explorer <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </div>
      ) : null}
    </div>
  )
}

function IxChip({ ix }: { ix: DecodedIx }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs ${CATEGORY_META[ix.category].chip}`}
    >
      <span className={`size-1.5 rounded-full ${CATEGORY_META[ix.category].dot}`} aria-hidden />
      {ix.label}
    </span>
  )
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="inline-flex shrink-0 rounded-lg border border-border p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
            value === o.value
              ? 'bg-flame text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
