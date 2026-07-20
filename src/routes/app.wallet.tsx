import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute } from '@tanstack/react-router'

import { FlameBalanceCard } from '@/components/app/flame-balance'
import { GiftFlow, RedeemFlow, SwapFlow } from '@/components/app/flows'
import { ProfileStats } from '@/components/app/profile-stats'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import type { Holding } from '@/lib/vesta/queries'
import { useHoldings, useOffers } from '@/lib/vesta/queries'

export const Route = createFileRoute('/app/wallet')({
  component: WalletPage,
})

function WalletPage() {
  const { publicKey } = useWallet()
  const holdings = useHoldings()

  return (
    <div>
      <PageHeader
        title="Wallet"
        sub="Gift within the daily cap, swap across the alliance, and redeem offers — every action is a real signed devnet transaction."
      />
      {!publicKey ? (
        <ConnectPrompt message="Connect a devnet wallet to manage your points." />
      ) : holdings.data?.[0] ? (
        <div className="space-y-10">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {holdings.data.map((h) => (
              <FlameBalanceCard key={h.merchant.address.toBase58()} holding={h} />
            ))}
          </div>

          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {holdings.data.map((h) => (
              <ProfileStats
                key={h.merchant.address.toBase58()}
                merchant={h.merchant.address}
                name={h.merchant.name}
              />
            ))}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <GiftFlow holding={holdings.data[0]} />
            {holdings.data.length > 1 ? (
              <SwapFlow holdings={holdings.data} />
            ) : (
              <div className="rounded-2xl border border-border border-dashed bg-card/40 p-6 text-muted-foreground text-sm">
                Hold points from two alliance merchants to unlock cross-merchant swaps.
              </div>
            )}
          </section>

          <RedeemSection holding={holdings.data[0]} />
        </div>
      ) : (
        <div className="rounded-2xl border border-border border-dashed bg-card/40 p-8 text-center text-muted-foreground text-sm">
          No points in this wallet yet.
        </div>
      )}
    </div>
  )
}

function RedeemSection({ holding }: { holding: Holding }) {
  const offers = useOffers(holding.merchant.address)
  if (!offers.data || offers.data.length === 0) return null
  return (
    <section>
      <h2 className="mb-3 font-medium text-[13px] text-muted-foreground">
        Redeem at {holding.merchant.name}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {offers.data.slice(0, 4).map((offer) => (
          <RedeemFlow
            key={offer.address.toBase58()}
            holding={holding}
            offer={offer}
            redemptionIndex={0}
          />
        ))}
      </div>
    </section>
  )
}
