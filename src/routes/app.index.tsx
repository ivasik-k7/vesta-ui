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
import { useAccountOverlay } from '@/components/app/account-overlay'
import { fmtCount, fmtPoints, Metric } from '@/components/app/metric'
import { useMoney } from '@/components/app/money'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { decayHealth, liveUiAmount } from '@/lib/vesta/decay'
import type { Merchant } from '@/lib/vesta/decode'
import {
  type Holding,
  useActivity,
  useConfig,
  useHoldings,
  useMyMerchant,
  useNetworkStats,
  useSolBalance,
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
          <StatusStrip />
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

// ── protocol status + wallet gas ──────────────────────────────────────────────

function StatusStrip() {
  const config = useConfig()
  const balance = useSolBalance()
  const overlay = useAccountOverlay()
  const paused = config.data?.paused

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm">
        <CircleDot
          className={paused ? 'size-3.5 text-red-400' : 'size-3.5 text-emerald-400'}
          aria-hidden
        />
        <span className="text-muted-foreground">Protocol</span>
        <span className={paused ? 'font-medium text-red-400' : 'font-medium text-emerald-400'}>
          {config.isLoading ? '…' : paused ? 'Paused' : 'Live'}
        </span>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm">
        <Coins className="size-3.5 text-flame" aria-hidden />
        <span className="text-muted-foreground">Gas</span>
        <span className="font-mono tabular-nums">
          {balance.isLoading ? '…' : `${(balance.data ?? 0).toFixed(3)} SOL`}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="ml-auto border-line-strong"
        onClick={() => overlay.open('funds')}
      >
        Get devnet SOL
        <ArrowRight className="size-3.5" />
      </Button>
    </div>
  )
}

// ── network-wide KPIs ─────────────────────────────────────────────────────────

function NetworkPulse() {
  const { data, isLoading } = useNetworkStats()

  return (
    <section>
      <SectionTitle icon={Activity}>Network pulse</SectionTitle>
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
    </section>
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
    <section>
      <div className="flex items-center justify-between">
        <SectionTitle icon={Flame}>Your portfolio</SectionTitle>
        {items.length > 0 ? (
          <Link
            to="/app/wallet"
            className="inline-flex items-center gap-1 text-flame text-sm hover:text-flame-hover"
          >
            Manage <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </div>

      {holdings.isLoading ? (
        <Skeleton className="h-28" />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border border-dashed bg-card/40 p-8 text-center text-muted-foreground text-sm">
          No points yet. Merchants earn them to you at the counter — browse the{' '}
          <Link to="/app/alliances" className="text-flame hover:text-flame-hover">
            live network
          </Link>{' '}
          or open your own console.
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-sm">
                Live value across {items.length} brand{items.length > 1 ? 's' : ''}
              </p>
              <p className="mt-1 font-heading font-semibold text-4xl tabular-nums tracking-tight">
                {format(liveTotal)}
                <span className="ml-2 text-base text-muted-foreground">pts</span>
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((h) => (
              <HoldingRow key={h.merchant.address.toBase58()} holding={h} now={now} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function HoldingRow({ holding, now }: { holding: Holding; now: number }) {
  const { format } = useMoney()
  const ui = liveUiAmount(holding.raw, holding.mint, now)
  const health = decayHealth(holding.mint, now)
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
      <Flame
        className="size-4 shrink-0 text-flame"
        aria-hidden
        style={{ opacity: 0.4 + health * 0.6 }}
      />
      <span className="truncate text-sm">{holding.merchant.name}</span>
      <span className="ml-auto font-mono text-sm tabular-nums">{format(ui)}</span>
    </div>
  )
}

// ── the connected wallet's merchant business ─────────────────────────────────

function MyBusiness() {
  const merchant = useMyMerchant()

  if (merchant.isLoading) {
    return (
      <section>
        <SectionTitle icon={Store}>Your business</SectionTitle>
        <Skeleton className="h-40" />
      </section>
    )
  }

  if (!merchant.data) {
    return (
      <section>
        <SectionTitle icon={Store}>Your business</SectionTitle>
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-border border-dashed bg-card/40 p-8">
          <p className="text-muted-foreground text-sm">
            You haven't registered a merchant yet. Launch a Token-2022 loyalty program — a decaying
            point mint, transfer guard, and clawback delegate — in one signed transaction.
          </p>
          <Button asChild>
            <Link to="/app/console">
              Open merchant console
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    )
  }

  return <MerchantSummary merchant={merchant.data} />
}

function MerchantSummary({ merchant }: { merchant: Merchant }) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <SectionTitle icon={Store}>Your business</SectionTitle>
        <Link
          to="/app/console"
          className="inline-flex items-center gap-1 text-flame text-sm hover:text-flame-hover"
        >
          Manage <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-heading font-semibold text-lg">{merchant.name}</p>
          {merchant.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-flame/10 px-2 py-0.5 text-flame text-xs">
              <BadgeCheck className="size-3" aria-hidden /> Verified
            </span>
          ) : null}
          {merchant.paused ? (
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-red-400 text-xs">
              Paused
            </span>
          ) : (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400 text-xs">
              Active
            </span>
          )}
          {merchant.joinedAlliance ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground text-xs">
              <Users className="size-3" aria-hidden /> In alliance
            </span>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
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

        <div className="mt-5 flex flex-wrap gap-2 border-border/60 border-t pt-4">
          <QuickChip to="/app/console" icon={Gift}>
            Issue points
          </QuickChip>
          <QuickChip to="/app/console" icon={Ticket}>
            Manage offers
          </QuickChip>
          <QuickChip to="/app/console" icon={Award}>
            Achievements
          </QuickChip>
          <a
            href={`https://explorer.solana.com/address/${merchant.pointMint.toBase58()}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            Point mint <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </div>
      </div>
    </section>
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
      <p className="flex items-center gap-1 text-muted-foreground text-xs">
        <Icon className="size-3 text-flame" aria-hidden />
        {label}
      </p>
      <p className="mt-1 font-heading font-semibold text-xl tabular-nums">{value}</p>
    </div>
  )
}

// ── quick actions ─────────────────────────────────────────────────────────────

function QuickActions() {
  return (
    <section>
      <SectionTitle icon={ArrowRight}>Quick actions</SectionTitle>
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
        <ActionTile to="/merchant" icon={Users} title="Directory" sub="Browse every brand" />
      </div>
    </section>
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
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-flame/40"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-flame/10">
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

function QuickChip({
  to,
  icon: Icon,
  children,
}: {
  to: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:border-flame/40 hover:text-flame"
    >
      <Icon className="size-3.5" aria-hidden />
      {children}
    </Link>
  )
}

// ── recent protocol activity ─────────────────────────────────────────────────

function RecentActivity() {
  const activity = useActivity(6)

  return (
    <section>
      <div className="flex items-center justify-between">
        <SectionTitle icon={Activity}>Recent activity</SectionTitle>
        <Link
          to="/app/activity"
          className="inline-flex items-center gap-1 text-flame text-sm hover:text-flame-hover"
        >
          All activity <ArrowRight className="size-3.5" />
        </Link>
      </div>
      {activity.isLoading ? (
        <Skeleton className="h-32" />
      ) : activity.data && activity.data.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border">
          {activity.data.map((entry, i) => (
            <a
              key={entry.signature}
              href={explorerTx(entry.signature)}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-3 bg-card px-5 py-3 text-sm transition-colors hover:bg-secondary ${
                i === (activity.data?.length ?? 0) - 1 ? '' : 'border-border border-b'
              }`}
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
      ) : (
        <p className="text-muted-foreground text-sm">No transactions yet.</p>
      )}
    </section>
  )
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <h2 className="mb-3 flex items-center gap-1.5 font-medium text-[13px] text-muted-foreground">
      <Icon className="size-3.5 text-flame" aria-hidden />
      {children}
    </h2>
  )
}
