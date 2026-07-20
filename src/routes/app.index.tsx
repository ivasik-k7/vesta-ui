import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  CircleDot,
  Coins,
  Compass,
  Flame,
  Gift,
  Repeat,
  ShieldX,
  Store,
  Ticket,
  Undo2,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { fmtCount, fmtPoints, Metric } from '@/components/app/metric'
import { useMoney } from '@/components/app/money'
import { EmptySlate, Section } from '@/components/app/section'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { Skeleton } from '@/components/ui/skeleton'
import { decayHealth, liveUiAmount } from '@/lib/vesta/decay'
import type { Merchant } from '@/lib/vesta/decode'
import {
  type Holding,
  useActivity,
  useHoldings,
  useMyMerchant,
  useNetworkStats,
} from '@/lib/vesta/queries'
import { explorerTx } from '@/lib/vesta/tx'

export const Route = createFileRoute('/app/')({
  component: Overview,
})

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now() / 1000)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / 1000), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function Overview() {
  const { publicKey } = useWallet()

  return (
    <div>
      <PageHeader
        title="Dashboard"
        sub="Your command center for the living loyalty protocol — network health, your portfolio, and your business, all read live from Solana devnet."
      />
      {!publicKey ? (
        <ConnectPrompt message="Connect a devnet wallet to see the network, your points, and your merchant business." />
      ) : (
        <div className="space-y-10">
          <NetworkPulse />
          <Portfolio />
          <MyBusiness />
          <QuickActions />
          <RecentActivity />
        </div>
      )}
    </div>
  )
}

// ── network-wide KPIs ─────────────────────────────────────────────────────────

function NetworkPulse() {
  const { data, isLoading } = useNetworkStats()

  return (
    <Section
      icon={Activity}
      title="Network pulse"
      desc="Protocol-wide totals, aggregated live from every merchant and alliance account."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={Store}
          label="Merchants live"
          value={data?.merchants ?? '—'}
          hint={data ? `${data.verified} verified` : undefined}
          loading={isLoading}
          accent
        />
        <Metric
          icon={Users}
          label="Customers reached"
          value={data ? fmtCount(data.totalCustomers) : '—'}
          hint={data ? `${data.alliances} alliances` : undefined}
          loading={isLoading}
        />
        <Metric
          icon={Flame}
          label="Points issued"
          value={data ? fmtPoints(data.totalPointsIssued) : '—'}
          hint="lifetime, at issue"
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
          icon={Award}
          label="Badges minted"
          value={data ? fmtCount(data.totalBadges) : '—'}
          hint="soulbound kleos"
          loading={isLoading}
        />
        <Metric
          icon={Repeat}
          label="Alliance swaps"
          value={data ? fmtCount(data.allianceSwaps) : '—'}
          loading={isLoading}
        />
        <Metric
          icon={ArrowUpRight}
          label="Swap volume"
          value={data ? fmtPoints(data.allianceVolume) : '—'}
          hint="UI-denominated"
          loading={isLoading}
        />
        <Metric
          icon={ShieldX}
          label="Clawed back"
          value={data ? fmtPoints(data.totalClawedBack) : '—'}
          hint="audited, on-chain"
          loading={isLoading}
        />
      </div>
    </Section>
  )
}

// ── the connected wallet's holdings ──────────────────────────────────────────

function Portfolio() {
  const holdings = useHoldings()
  const now = useNow()
  const { format } = useMoney()

  const items = holdings.data ?? []
  const liveTotal = items.reduce((sum, h) => sum + liveUiAmount(h.raw, h.mint, now), 0)

  return (
    <Section
      icon={Flame}
      title="Your portfolio"
      desc="Live value across every brand you hold, cooling in real time."
      right={
        items.length > 0 ? (
          <Link
            to="/app/wallet"
            className="inline-flex items-center gap-1 text-flame text-xs hover:text-flame-hover"
          >
            Manage <ArrowRight className="size-3" />
          </Link>
        ) : undefined
      }
    >
      {holdings.isLoading ? (
        <Skeleton className="h-28" />
      ) : items.length === 0 ? (
        <EmptySlate icon={Coins}>
          No points yet. Merchants earn them to you at the counter — browse{' '}
          <Link to="/app/discover" className="text-flame hover:text-flame-hover">
            Discover
          </Link>{' '}
          or open your own console.
        </EmptySlate>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-flame/30 bg-gradient-to-br from-flame/[0.06] to-transparent p-5">
          <div
            aria-hidden
            className="-right-12 -top-12 pointer-events-none absolute size-40 rounded-full bg-flame/10 blur-3xl"
          />
          <div className="relative">
            <p className="font-medium font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]">
              Live value across {items.length} brand{items.length > 1 ? 's' : ''}
            </p>
            <p className="mt-1 font-heading font-semibold text-4xl tabular-nums tracking-tight">
              {format(liveTotal)}
              <span className="ml-2 text-base text-muted-foreground">pts</span>
            </p>
          </div>
          <div className="relative mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((h) => (
              <HoldingRow key={h.merchant.address.toBase58()} holding={h} now={now} />
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}

function HoldingRow({ holding, now }: { holding: Holding; now: number }) {
  const { format } = useMoney()
  const ui = liveUiAmount(holding.raw, holding.mint, now)
  const health = decayHealth(holding.mint, now)
  return (
    <Link
      to="/app/token/$mint"
      params={{ mint: holding.merchant.pointMint.toBase58() }}
      className="flex items-center gap-3 rounded-xl border border-border bg-background/50 px-4 py-3 transition-colors hover:border-flame/40"
    >
      <Flame
        className="size-4 shrink-0 text-flame"
        aria-hidden
        style={{ opacity: 0.4 + health * 0.6 }}
      />
      <span className="truncate text-sm">{holding.merchant.name}</span>
      <span className="ml-auto font-mono text-sm tabular-nums">{format(ui)}</span>
    </Link>
  )
}

// ── the connected wallet's merchant business ─────────────────────────────────

function MyBusiness() {
  const merchant = useMyMerchant()

  if (merchant.isLoading) {
    return (
      <Section icon={Store} title="Your business" desc="Your merchant program at a glance.">
        <Skeleton className="h-40" />
      </Section>
    )
  }

  if (!merchant.data) {
    return (
      <Section icon={Store} title="Your business" desc="Run a loyalty program of your own.">
        <EmptySlate icon={Store}>
          You haven't registered a merchant yet. Launch a Token-2022 loyalty program — decaying
          points, transfer guard, clawback — in one signed transaction from the{' '}
          <Link to="/app/console" className="text-flame hover:text-flame-hover">
            console
          </Link>
          .
        </EmptySlate>
      </Section>
    )
  }

  return <MerchantSummary merchant={merchant.data} />
}

function MerchantSummary({ merchant }: { merchant: Merchant }) {
  return (
    <Section
      icon={Store}
      title="Your business"
      desc="Lifetime figures for the program you run."
      right={
        <Link
          to="/app/console"
          className="inline-flex items-center gap-1 text-flame text-xs hover:text-flame-hover"
        >
          Manage <ArrowRight className="size-3" />
        </Link>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card/50 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.75)] ring-1 ring-foreground/[0.02] ring-inset backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2 px-4 pt-3.5 pb-2.5">
          <span
            aria-hidden
            className="h-3.5 w-1 shrink-0 rounded-full bg-gradient-to-b from-flame to-flame-deep"
          />
          <p className="font-semibold text-sm">{merchant.name}</p>
          {merchant.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-flame/10 px-2 py-0.5 text-flame text-xs">
              <BadgeCheck className="size-3" aria-hidden /> Verified
            </span>
          ) : null}
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              merchant.paused ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}
          >
            {merchant.paused ? 'Paused' : 'Active'}
          </span>
          {merchant.joinedAlliance ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground text-xs">
              <Users className="size-3" aria-hidden /> In alliance
            </span>
          ) : null}
        </div>
        <div
          aria-hidden
          className="mx-4 h-px bg-gradient-to-r from-border via-border/50 to-transparent"
        />

        <div className="grid gap-3 px-4 py-3 sm:grid-cols-3 lg:grid-cols-5">
          <MiniStat icon={Users} label="Customers" value={fmtCount(merchant.customerCount)} />
          <MiniStat icon={Flame} label="Issued" value={fmtPoints(merchant.lifetimePointsIssued)} />
          <MiniStat
            icon={Ticket}
            label="Redemptions"
            value={fmtCount(merchant.lifetimeRedemptions)}
          />
          <MiniStat icon={Award} label="Badges" value={fmtCount(merchant.badgesIssued)} />
          <MiniStat
            icon={Undo2}
            label="Clawed back"
            value={fmtPoints(merchant.lifetimeClawedBack)}
          />
        </div>

        <div className="grid grid-cols-2 divide-x divide-border/40 border-border/40 border-t">
          <Link
            to="/app/console"
            className="flex items-center justify-center gap-1.5 py-2.5 text-muted-foreground text-xs transition-colors hover:bg-flame/[0.05] hover:text-flame"
          >
            <Gift className="size-3.5" aria-hidden />
            Open console
          </Link>
          <a
            href={`https://explorer.solana.com/address/${merchant.pointMint.toBase58()}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 text-muted-foreground text-xs transition-colors hover:bg-flame/[0.05] hover:text-flame"
          >
            Point mint <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </div>
      </div>
    </Section>
  )
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div>
      <p className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]">
        <Icon className="size-3 text-flame" aria-hidden />
        {label}
      </p>
      <p className="mt-0.5 font-heading font-semibold text-lg tabular-nums">{value}</p>
    </div>
  )
}

// ── quick actions ─────────────────────────────────────────────────────────────

function QuickActions() {
  return (
    <Section icon={ArrowRight} title="Quick actions" desc="Jump straight into the common flows.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionTile
          to="/app/wallet"
          icon={Gift}
          title="Gift & swap"
          sub="Move points, guarded live"
        />
        <ActionTile to="/app/wallet" icon={Ticket} title="Redeem" sub="Burn points for rewards" />
        <ActionTile
          to="/app/console"
          icon={Store}
          title="Merchant console"
          sub="Run your program"
        />
        <ActionTile to="/app/discover" icon={Compass} title="Discover" sub="Browse every brand" />
      </div>
    </Section>
  )
}

function ActionTile({
  to,
  icon: Icon,
  title,
  sub,
}: {
  to: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  sub: string
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card/50 p-4 ring-1 ring-foreground/[0.02] ring-inset backdrop-blur-sm transition-colors hover:border-flame/40"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-flame/20 bg-flame/10">
        <Icon className="size-4 text-flame" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-sm">{title}</span>
        <span className="block truncate text-muted-foreground text-xs">{sub}</span>
      </span>
      <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-flame" />
    </Link>
  )
}

// ── recent protocol activity ─────────────────────────────────────────────────

function RecentActivity() {
  const activity = useActivity(6)

  return (
    <Section
      icon={Activity}
      title="Recent activity"
      desc="The newest protocol transactions, straight from the chain."
      right={
        <Link
          to="/app/activity"
          className="inline-flex items-center gap-1 text-flame text-xs hover:text-flame-hover"
        >
          All activity <ArrowRight className="size-3" />
        </Link>
      }
    >
      {activity.isLoading ? (
        <Skeleton className="h-32" />
      ) : activity.data && activity.data.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card/50 ring-1 ring-foreground/[0.02] ring-inset backdrop-blur-sm">
          <div className="divide-y divide-border/40">
            {activity.data.map((entry) => (
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
                <span className="ml-auto text-muted-foreground text-xs">
                  {entry.blockTime
                    ? new Date(entry.blockTime * 1000).toLocaleTimeString()
                    : `slot ${entry.slot}`}
                </span>
                <ArrowUpRight className="size-3.5 text-muted-foreground/40" aria-hidden />
              </a>
            ))}
          </div>
        </div>
      ) : (
        <EmptySlate icon={Activity}>No transactions yet.</EmptySlate>
      )}
    </Section>
  )
}
