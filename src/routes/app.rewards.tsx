import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Ticket } from 'lucide-react'

import { RedeemFlow } from '@/components/app/flows'
import { EmptySlate, Section, SectionMeta } from '@/components/app/section'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { Skeleton } from '@/components/ui/skeleton'
import {
  type Holding,
  useCustomerEligibility,
  useHoldings,
  useMerchantSegments,
  useOffers,
} from '@/lib/vesta/queries'

export const Route = createFileRoute('/app/rewards')({
  component: RewardsPage,
})

function RewardsPage() {
  const { publicKey } = useWallet()
  const holdings = useHoldings()
  const items = holdings.data ?? []

  return (
    <div>
      <PageHeader
        title="Offers"
        sub="Everything you can redeem right now, across every brand you hold — priced in decayed value, converted on-chain when you claim. Verified-only offers show what unlocks them."
      />

      {!publicKey ? (
        <ConnectPrompt message="Connect a devnet wallet to see what you can redeem." />
      ) : holdings.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : items.length === 0 ? (
        <EmptySlate icon={Ticket}>
          No points yet, so nothing to redeem. Find brands to earn with in{' '}
          <Link to="/app/discover" className="text-flame hover:text-flame-hover">
            Discover
          </Link>
          .
        </EmptySlate>
      ) : (
        <div className="space-y-10">
          {items.map((h) => (
            <BrandRewards key={h.merchant.pointMint.toBase58()} holding={h} />
          ))}
        </div>
      )}
    </div>
  )
}

/** One held brand's redeemable offers — segment-aware via the merchant's
 *  segments + the customer's cached eligibility. */
function BrandRewards({ holding }: { holding: Holding }) {
  const offers = useOffers(holding.merchant.address)
  const segments = useMerchantSegments(holding.merchant.address)
  const eligibility = useCustomerEligibility(holding.merchant.address)

  const list = offers.data ?? []

  return (
    <Section
      icon={Ticket}
      title={holding.merchant.name}
      desc="Redeem by burning your points — the guard prices and settles it live."
      right={
        list.length > 0 ? (
          <SectionMeta>
            {list.length} offer{list.length > 1 ? 's' : ''}
          </SectionMeta>
        ) : undefined
      }
    >
      {offers.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : list.length === 0 ? (
        <EmptySlate icon={Ticket}>No active offers from {holding.merchant.name} yet.</EmptySlate>
      ) : (
        <div className="grid items-stretch gap-4 md:grid-cols-2">
          {list.map((offer) => (
            <RedeemFlow
              key={offer.address.toBase58()}
              holding={holding}
              offer={offer}
              redemptionIndex={0}
              segments={segments.data}
              eligibility={eligibility.data}
            />
          ))}
        </div>
      )}
    </Section>
  )
}
