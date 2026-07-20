import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Coins,
  Flame,
  Info,
  Send,
  Store,
  Ticket,
  Trophy,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { GiftFlow, RedeemFlow } from '@/components/app/flows'
import { fmtCount, fmtPoints } from '@/components/app/metric'
import { useMoney } from '@/components/app/money'
import { EmptySlate, Section, SectionMeta } from '@/components/app/section'
import { DataRow, Group } from '@/components/app/settings-kit'
import { ShareButton } from '@/components/app/share-button'
import { PageHeader } from '@/components/app/shell'
import { Skeleton } from '@/components/ui/skeleton'
import { decayHealth, liveUiAmount } from '@/lib/vesta/decay'
import type { Merchant } from '@/lib/vesta/decode'
import {
  type Holding,
  useCustomerProfile,
  useHoldings,
  useMerchants,
  useOffers,
} from '@/lib/vesta/queries'

export const Route = createFileRoute('/app/token/$mint')({
  component: TokenDetailPage,
})

const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum']
const CHIP =
  'inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:border-flame/40 hover:text-flame'

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now() / 1000)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / 1000), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

function TokenDetailPage() {
  const { mint } = Route.useParams()
  const merchants = useMerchants()
  const holdings = useHoldings()

  const merchant = merchants.data?.find((m) => m.pointMint.toBase58() === mint)
  const holding = holdings.data?.find((h) => h.merchant.pointMint.toBase58() === mint) ?? null

  return (
    <div>
      <Link
        to="/app/wallet"
        className="mb-4 inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to wallet
      </Link>

      {merchants.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-64" />
        </div>
      ) : merchant ? (
        <TokenDetail merchant={merchant} holding={holding} mint={mint} />
      ) : (
        <EmptySlate icon={Coins}>
          No token found for this mint on the current deployment.
        </EmptySlate>
      )}
    </div>
  )
}

function TokenDetail({
  merchant,
  holding,
  mint,
}: {
  merchant: Merchant
  holding: Holding | null
  mint: string
}) {
  return (
    <div className="space-y-10">
      <PageHeader
        title={merchant.name}
        sub="Everything about this point token — live value, decay, your standing, and the rewards you can claim with it."
      />

      <TokenHero merchant={merchant} holding={holding} mint={mint} />

      {/* About */}
      <Section
        icon={Info}
        title="About this token"
        desc="Read live from the merchant account and the Token-2022 mint."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Group title="Economics">
            <DataRow label="Decay rate" value={`${merchant.decayRateBps / 100}%/yr`} />
            <DataRow label="Lifetime issued" value={fmtPoints(merchant.lifetimePointsIssued)} />
            <DataRow label="Redemptions" value={fmtCount(merchant.lifetimeRedemptions)} />
            <DataRow label="Clawed back" value={fmtPoints(merchant.lifetimeClawedBack)} />
          </Group>
          <Group title="Community">
            <DataRow label="Holders" value={fmtCount(merchant.customerCount)} />
            <DataRow label="Badges minted" value={fmtCount(merchant.badgesIssued)} />
            <DataRow
              label="In alliance"
              value={merchant.joinedAlliance ? 'Yes' : 'No'}
              mono={false}
            />
            <DataRow label="Mint" value={`${mint.slice(0, 6)}…${mint.slice(-6)}`} />
          </Group>
        </div>
      </Section>

      {/* Standing */}
      {holding ? <StandingSection merchant={merchant} /> : null}

      {/* Move */}
      <Section
        icon={Send}
        title="Move points"
        desc="Gift within the daily cap — the argus guard validates the transfer live. Swaps live in your wallet."
      >
        {holding ? (
          <div className="grid items-stretch gap-4 md:grid-cols-2">
            <GiftFlow holding={holding} />
            <EmptySlate icon={Coins}>
              Want to swap these points to another brand?{' '}
              <Link to="/app/wallet" className="text-flame hover:text-flame-hover">
                Open your wallet
              </Link>{' '}
              — swaps need two alliance holdings.
            </EmptySlate>
          </div>
        ) : (
          <EmptySlate icon={Coins}>
            You don't hold {merchant.name} points yet. Earn at the counter — then move and spend
            them here.
          </EmptySlate>
        )}
      </Section>

      {/* Redeem */}
      <RedeemSection merchant={merchant} holding={holding} />
    </div>
  )
}

/** Standardized hero: your live balance + identity chips, same frame as wallet. */
function TokenHero({
  merchant,
  holding,
  mint,
}: {
  merchant: Merchant
  holding: Holding | null
  mint: string
}) {
  const now = useNow()
  const { format } = useMoney()
  const live = holding ? liveUiAmount(holding.raw, holding.mint, now) : 0
  const health = holding ? decayHealth(holding.mint, now) : 0

  return (
    <div className="relative overflow-hidden rounded-2xl border border-flame/30 bg-gradient-to-br from-flame/[0.06] to-transparent p-5">
      <div
        aria-hidden
        className="-right-12 -top-12 pointer-events-none absolute size-40 rounded-full bg-flame/10 blur-3xl"
        style={{ opacity: 0.4 + health * 0.6 }}
      />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 font-medium font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]">
            <Flame
              className="size-3.5 text-flame"
              aria-hidden
              style={{ opacity: 0.4 + health * 0.6 }}
            />
            Your live balance
          </p>
          <p className="mt-1 font-heading font-semibold text-4xl tabular-nums tracking-tight">
            {holding ? format(live) : '0.00'}
            <span className="ml-2 text-base text-muted-foreground">pts</span>
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground/70">
            {merchant.decayRateBps / 100}%/yr decay · cooling live
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {merchant.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-flame/10 px-2 py-0.5 text-flame text-xs">
              <BadgeCheck className="size-3" aria-hidden /> Verified
            </span>
          ) : null}
          <div className="flex flex-wrap justify-end gap-1.5">
            <Link
              to="/app/merchant/$address"
              params={{ address: merchant.address.toBase58() }}
              className={CHIP}
            >
              <Store className="size-3.5" aria-hidden /> Merchant
            </Link>
            <ShareButton value={mint} what="Mint" label="Share" className={CHIP} />
            <a
              href={`https://explorer.solana.com/address/${mint}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className={CHIP}
            >
              Explorer <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Standardized standing group — tier, streak, lifetime, from CustomerProfile. */
function StandingSection({ merchant }: { merchant: Merchant }) {
  const profile = useCustomerProfile(merchant.address)

  return (
    <Section
      icon={Trophy}
      title="Your standing"
      desc={`Loyalty state the ${merchant.name} program keeps for your wallet on-chain.`}
    >
      {profile.isLoading ? (
        <Skeleton className="h-36" />
      ) : profile.data ? (
        <Group title="Loyalty profile">
          <DataRow
            label="Tier"
            value={TIERS[profile.data.tier] ?? `#${profile.data.tier}`}
            mono={false}
          />
          <DataRow label="Streak" value={`${profile.data.streakDays} days`} mono={false} />
          <DataRow
            label="Lifetime earned"
            value={`${fmtPoints(profile.data.lifetimeEarned)} pts`}
          />
          <DataRow label="Redemptions" value={String(profile.data.lifetimeRedemptions)} />
          <DataRow label="Campaigns completed" value={String(profile.data.campaignsCompleted)} />
        </Group>
      ) : (
        <EmptySlate icon={Trophy}>
          No profile yet — earn at {merchant.name} to start a streak.
        </EmptySlate>
      )}
    </Section>
  )
}

function RedeemSection({ merchant, holding }: { merchant: Merchant; holding: Holding | null }) {
  const offers = useOffers(merchant.address)

  return (
    <Section
      icon={Ticket}
      title="Redeem rewards"
      desc="Burn points for live offers — priced in decayed value, converted on-chain."
      right={
        offers.data && offers.data.length > 0 ? (
          <SectionMeta>
            {offers.data.length} offer{offers.data.length > 1 ? 's' : ''}
          </SectionMeta>
        ) : undefined
      }
    >
      {offers.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : offers.data && offers.data.length > 0 && holding ? (
        <div className="grid items-stretch gap-4 md:grid-cols-2">
          {offers.data.slice(0, 6).map((offer) => (
            <RedeemFlow
              key={offer.address.toBase58()}
              holding={holding}
              offer={offer}
              redemptionIndex={0}
            />
          ))}
        </div>
      ) : offers.data && offers.data.length > 0 ? (
        <EmptySlate icon={Ticket}>
          {offers.data.length} offer{offers.data.length > 1 ? 's' : ''} available — earn points at{' '}
          {merchant.name} to claim them.
        </EmptySlate>
      ) : (
        <EmptySlate icon={Ticket}>No active offers right now.</EmptySlate>
      )}
    </Section>
  )
}
