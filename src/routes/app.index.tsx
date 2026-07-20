import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Flame, Store, Users } from 'lucide-react'

import { FlameBalanceCard } from '@/components/app/flame-balance'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { Button } from '@/components/ui/button'
import { CardSkeletonGrid } from '@/components/ui/skeleton'
import { useHoldings, useMerchants } from '@/lib/vesta/queries'

export const Route = createFileRoute('/app/')({
  component: Overview,
})

function Overview() {
  const { publicKey } = useWallet()
  const holdings = useHoldings()
  const merchants = useMerchants()

  return (
    <div>
      <PageHeader
        title="Overview"
        sub="Your living balances, read from devnet and cooling in real time against each mint's on-chain decay rate."
      />

      {!publicKey ? (
        <ConnectPrompt message="Connect a devnet wallet to see your points, tiers, and quick actions." />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Merchants live" value={merchants.data?.length ?? '—'} icon={Store} />
            <Stat label="Your holdings" value={holdings.data?.length ?? '—'} icon={Flame} />
            <Stat
              label="In alliances"
              value={merchants.data?.filter((m) => m.joinedAlliance).length ?? '—'}
              icon={Users}
            />
          </div>

          {holdings.isLoading ? (
            <section>
              <h2 className="mb-3 font-medium text-[13px] text-muted-foreground">Your flames</h2>
              <CardSkeletonGrid count={3} />
            </section>
          ) : holdings.data && holdings.data.length > 0 ? (
            <section>
              <h2 className="mb-3 font-medium text-[13px] text-muted-foreground">Your flames</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {holdings.data.map((h) => (
                  <FlameBalanceCard key={h.merchant.address.toBase58()} holding={h} />
                ))}
              </div>
              <Button asChild variant="outline" className="mt-4 border-line-strong">
                <Link to="/app/wallet">
                  Manage wallet
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </section>
          ) : (
            <div className="rounded-2xl border border-border border-dashed bg-card/40 p-8 text-center">
              <p className="text-muted-foreground text-sm">
                This wallet holds no points yet. Merchants earn them to you at the counter — browse
                the{' '}
                <Link to="/app/alliances" className="text-flame hover:text-flame-hover">
                  live merchants
                </Link>{' '}
                or open your own console.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <Icon className="size-4 text-flame" />
      <p className="mt-3 font-heading font-semibold text-3xl tabular-nums">{value}</p>
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  )
}
