import { useWallet } from '@solana/wallet-adapter-react'
import type { PublicKey } from '@solana/web3.js'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Megaphone, Target, Ticket, Zap } from 'lucide-react'

import { RedeemFlow } from '@/components/app/flows'
import { EmptySlate, Section, SectionMeta } from '@/components/app/section'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { Skeleton } from '@/components/ui/skeleton'
import { CAMPAIGN_KIND, CAMPAIGN_KIND_LABEL, DECIMALS } from '@/lib/vesta/constants'
import {
  type Holding,
  useCustomerEligibility,
  useHoldings,
  useMerchantSegments,
  useMyCampaigns,
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
      <div className="space-y-5">
        <ActiveBoosts merchant={holding.merchant.address} />
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
      </div>
    </Section>
  )
}

/** Read-only view of a brand's live campaigns — customers can't sign campaign
 *  txns (the merchant applies them at issuance), but they should see the boosts
 *  in play: a running multiplier, a flat bonus, or a quest to complete. */
function ActiveBoosts({ merchant }: { merchant: PublicKey }) {
  const campaigns = useMyCampaigns(merchant)
  const now = Date.now() / 1000
  const live = (campaigns.data ?? []).filter(
    (c) =>
      c.active &&
      !c.paused &&
      (c.startsAt === 0n || Number(c.startsAt) <= now) &&
      (c.endsAt === 0n || Number(c.endsAt) > now),
  )
  if (live.length === 0) return null

  const reward = (c: (typeof live)[number]) => {
    if (c.kind === CAMPAIGN_KIND.MULTIPLIER) return `+${(c.multiplierBps / 100).toFixed(0)}% points`
    if (c.kind === CAMPAIGN_KIND.FLAT_BONUS)
      return `+${(Number(c.flatBonus) / 10 ** DECIMALS).toFixed(0)} pts bonus`
    return `${c.questTarget} visits → ${(Number(c.questReward) / 10 ** DECIMALS).toFixed(0)} pts`
  }

  return (
    <div className="rounded-xl border border-flame/25 bg-flame/[0.04] p-4">
      <p className="flex items-center gap-1.5 font-medium text-flame text-xs">
        <Megaphone className="size-3.5" aria-hidden /> Active boosts — earn more when you spend here
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {live.map((c) => (
          <div
            key={c.address.toBase58()}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-flame/10 text-flame">
              {c.kind === CAMPAIGN_KIND.QUEST ? (
                <Target className="size-3.5" aria-hidden />
              ) : (
                <Zap className="size-3.5" aria-hidden />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm">
                {c.name || CAMPAIGN_KIND_LABEL[c.kind]}
              </span>
              <span className="block font-mono text-[11px] text-flame">{reward(c)}</span>
            </span>
            {Number(c.endsAt) > 0 ? (
              <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground/70">
                ends {new Date(Number(c.endsAt) * 1000).toLocaleDateString()}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
