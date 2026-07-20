import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Activity as ActivityIcon,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers,
  RefreshCw,
  Search,
  User,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { fmtCount, Metric } from '@/components/app/metric'
import { PageHeader } from '@/components/app/shell'
import { Skeleton } from '@/components/ui/skeleton'
import { CATEGORY_META, type Category, type DecodedIx } from '@/lib/vesta/decoder'
import { type ActivityRecord, type ActivityScope, useActivityFeed } from '@/lib/vesta/queries'
import { explorerTx } from '@/lib/vesta/tx'

export const Route = createFileRoute('/app/activity')({
  component: ActivityPage,
})

type StatusFilter = 'all' | 'success' | 'failed'
type GroupBy = 'none' | 'day' | 'category'

function ActivityPage() {
  const { publicKey } = useWallet()
  const [scope, setScope] = useState<ActivityScope>(publicKey ? 'wallet' : 'protocol')
  const feed = useActivityFeed(scope, 100)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [cats, setCats] = useState<Set<Category>>(new Set())
  const [group, setGroup] = useState<GroupBy>('day')

  const records = feed.data ?? []

  // Which categories actually appear in this window → drive the chip filter.
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
        const hay = [r.signature, r.feePayer ?? '', ...r.actions.map((a) => a.label)]
          .join(' ')
          .toLowerCase()
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
        title="Transaction history"
        sub="Your full on-chain history, or the whole protocol's — searchable, filterable by action, grouped by day, with every instruction decoded. Read straight from the chain, no indexer."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmented
          value={scope}
          onChange={setScope}
          options={[
            { value: 'wallet', label: 'My wallet' },
            { value: 'protocol', label: 'Protocol' },
          ]}
        />
        <span className="text-muted-foreground text-xs">
          {scope === 'wallet'
            ? publicKey
              ? 'Every transaction signed by your wallet — gifts, redeems, swaps, transfers.'
              : 'Connect a wallet to see your history.'
            : 'Every vesta_core protocol transaction across all users.'}
        </span>
      </div>

      {feed.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary stats over the current filter */}
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
              label="Signers"
              value={fmtCount(stats.signers)}
              hint={`${(stats.fees / 1e9).toFixed(5)} SOL fees`}
            />
          </div>

          {/* Controls */}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
                <Search className="size-4 text-muted-foreground" aria-hidden />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search signature, wallet, or action…"
                  className="w-full bg-transparent py-2 text-sm outline-none"
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
              No transactions match these filters.
            </p>
          ) : (
            <Grouped records={filtered} group={group} mine={publicKey?.toBase58() ?? null} />
          )}
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
  const signers = new Set(records.map((r) => r.feePayer).filter(Boolean)).size
  const distinctActions = new Set(records.flatMap((r) => r.actions.map((a) => a.label))).size
  return {
    total,
    failed,
    ixns,
    fees,
    signers,
    distinctActions,
    successRate: total === 0 ? 100 : Math.round(((total - failed) / total) * 100),
  }
}

function Grouped({
  records,
  group,
  mine,
}: {
  records: ActivityRecord[]
  group: GroupBy
  mine: string | null
}) {
  if (group === 'none') {
    return (
      <div className="overflow-hidden rounded-2xl border border-border">
        {records.map((r, i) => (
          <Row key={r.signature} record={r} mine={mine} last={i === records.length - 1} />
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
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {key}
            </p>
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {rows.length}
            </span>
            <div className="ml-2 h-px flex-1 bg-border/60" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-border">
            {rows.map((r, i) => (
              <Row key={r.signature} record={r} mine={mine} last={i === rows.length - 1} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Row({
  record,
  mine,
  last,
}: {
  record: ActivityRecord
  mine: string | null
  last: boolean
}) {
  const [open, setOpen] = useState(false)
  const when = record.blockTime
    ? new Date(record.blockTime * 1000).toLocaleTimeString()
    : `slot ${record.slot}`
  const primary = record.primary
  const isMine = mine && record.feePayer === mine

  return (
    <div className={last ? '' : 'border-border border-b'}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 bg-card px-4 py-3 text-left transition-colors hover:bg-secondary"
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
          ) : null}
          {record.actions.length > 1 ? (
            <span className="shrink-0 text-muted-foreground text-xs">
              +{record.actions.length - 1}
            </span>
          ) : null}
        </span>

        <span className="ml-auto flex shrink-0 items-center gap-3 text-muted-foreground text-xs">
          {isMine ? (
            <span className="rounded-full bg-flame/10 px-1.5 py-0.5 text-[10px] text-flame">
              you
            </span>
          ) : null}
          <span className="hidden font-mono sm:inline">
            {record.signature.slice(0, 6)}…{record.signature.slice(-6)}
          </span>
          <span>{when}</span>
        </span>
      </button>

      {open ? (
        <div className="space-y-3 border-border/60 border-t bg-background/40 px-5 py-4">
          <div>
            <p className="mb-1.5 font-medium text-[11px] text-muted-foreground/70 uppercase tracking-wide">
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
            <span>signer {record.feePayer ? short(record.feePayer) : '—'}</span>
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

const short = (k: string) => `${k.slice(0, 6)}…${k.slice(-6)}`
