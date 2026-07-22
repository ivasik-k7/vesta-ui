import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Coins,
  Info,
  Megaphone,
  Send,
  Store,
  Ticket,
  Users,
} from 'lucide-react'

import { RedeemFlow } from '@/components/app/flows'
import { fmtCount, fmtPoints } from '@/components/app/metric'
import { useMoney } from '@/components/app/money'
import { EmptySlate, Section, SectionMeta } from '@/components/app/section'
import { DataRow, Group } from '@/components/app/settings-kit'
import { ShareButton } from '@/components/app/share-button'
import { PageHeader } from '@/components/app/shell'
import { TxHistory } from '@/components/app/tx-history'
import { Skeleton } from '@/components/ui/skeleton'
import { CAMPAIGN_KIND_LABEL, DECIMALS } from '@/lib/vesta/constants'
import type { Merchant } from '@/lib/vesta/decode'
import {
  type Holding,
  useCustomerEligibility,
  useHoldings,
  useMerchantSegments,
  useMerchants,
  useMintSupply,
  useMyCampaigns,
  useOffers,
} from '@/lib/vesta/queries'

export const Route = createFileRoute('/app/merchant/$address')({
  component: MerchantDetailPage,
})

const CATEGORY_LABEL = ['General', 'Food & Drink', 'Retail', 'Services', 'Entertainment', 'Travel']
const CHIP =
  'inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:border-flame/40 hover:text-flame'

function MerchantDetailPage() {
  const { address } = Route.useParams()
  const merchants = useMerchants()
  const holdings = useHoldings()
  const merchant = merchants.data?.find((m) => m.address.toBase58() === address)
  const holding = merchant
    ? (holdings.data?.find((h) => h.merchant.address.equals(merchant.address)) ?? null)
    : null

  return (
    <div>
      <Link
        to="/app/discover"
        className="mb-4 inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to discover
      </Link>

      {merchants.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-64" />
        </div>
      ) : merchant ? (
        <Detail merchant={merchant} holding={holding} />
      ) : (
        <EmptySlate icon={Store}>Merchant not found on the current deployment.</EmptySlate>
      )}
    </div>
  )
}

function Detail({ merchant, holding }: { merchant: Merchant; holding: Holding | null }) {
  const { format } = useMoney()
  const supply = useMintSupply(merchant.pointMint)
  return (
    <div className="section-scope space-y-10">
      <PageHeader
        title={merchant.name}
        sub="A full look at this merchant — their point token, supply, live offers, running campaigns, on-chain history, and how you can earn and spend here."
      />

      <MerchantHero merchant={merchant} holding={holding} />

      {/* About */}
      <Section
        icon={Info}
        title="About this merchant"
        desc="Read live from the merchant account on devnet."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Group title="Program">
            <DataRow
              label="Category"
              value={CATEGORY_LABEL[merchant.category] ?? 'General'}
              mono={false}
            />
            <DataRow
              label="Circulating supply"
              value={supply.data ? `${format(supply.data.ui)} pts` : '…'}
            />
            <DataRow label="Decay rate" value={`${merchant.decayRateBps / 100}%/yr`} />
            <DataRow label="Lifetime issued" value={fmtPoints(merchant.lifetimePointsIssued)} />
            <DataRow label="Clawed back" value={fmtPoints(merchant.lifetimeClawedBack)} />
          </Group>
          <Group title="Community">
            <DataRow label="Customers" value={fmtCount(merchant.customerCount)} />
            <DataRow label="Redemptions" value={fmtCount(merchant.lifetimeRedemptions)} />
            <DataRow label="Badges minted" value={fmtCount(merchant.badgesIssued)} />
            <DataRow
              label="In alliance"
              value={merchant.joinedAlliance ? 'Yes' : 'No'}
              mono={false}
            />
          </Group>
        </div>
      </Section>

      {/* Offers */}
      <OffersSection merchant={merchant} holding={holding} />

      {/* Campaigns */}
      <CampaignsSection merchant={merchant} />

      {/* Move */}
      {holding ? (
        <Section
          icon={Send}
          title="Move points"
          desc="You hold this merchant's points — gift some to a friend or dig into the token page."
        >
          <div className="flex flex-wrap gap-3">
            <Link
              to="/app/gift"
              search={{ mint: merchant.pointMint.toBase58() }}
              className="inline-flex items-center gap-2 rounded-xl bg-flame px-4 py-2.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-flame-hover"
            >
              <Send className="size-4" aria-hidden /> Gift {merchant.name}
            </Link>
            <Link
              to="/app/token/$mint"
              params={{ mint: merchant.pointMint.toBase58() }}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-muted-foreground text-sm transition-colors hover:border-flame/40 hover:text-flame"
            >
              <Coins className="size-4" aria-hidden /> Token page
            </Link>
          </div>
        </Section>
      ) : null}

      {/* History */}
      <TxHistory
        address={merchant.address}
        desc="The newest transactions touching this merchant account, straight from the chain."
      />
    </div>
  )
}

/** Standardized hero: identity + status + quick action chips. */
function MerchantHero({ merchant, holding }: { merchant: Merchant; holding: Holding | null }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-flame/30 bg-gradient-to-br from-flame/[0.06] to-transparent p-5">
      <div
        aria-hidden
        className="-right-12 -top-12 pointer-events-none absolute size-40 rounded-full bg-flame/10 blur-3xl"
      />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-medium font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]">
            Merchant
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="font-heading font-semibold text-3xl tracking-tight">{merchant.name}</p>
            {merchant.verified ? (
              <BadgeCheck className="size-5 text-flame" aria-label="Verified" />
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground text-xs">
              {CATEGORY_LABEL[merchant.category] ?? 'General'}
            </span>
            {merchant.joinedAlliance ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground text-xs">
                <Users className="size-3" aria-hidden /> In alliance
              </span>
            ) : null}
            {holding ? (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400 text-xs">
                You hold points
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-1.5">
          <Link
            to="/app/token/$mint"
            params={{ mint: merchant.pointMint.toBase58() }}
            className={CHIP}
          >
            <Coins className="size-3.5" aria-hidden /> Token
          </Link>
          <ShareButton
            value={merchant.address.toBase58()}
            what="Merchant"
            label="Share"
            className={CHIP}
          />
          <a
            href={`https://explorer.solana.com/address/${merchant.pointMint.toBase58()}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className={CHIP}
          >
            Explorer <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </div>
      </div>
    </div>
  )
}

function OffersSection({ merchant, holding }: { merchant: Merchant; holding: Holding | null }) {
  const offers = useOffers(merchant.address)
  const segments = useMerchantSegments(merchant.address)
  const eligibility = useCustomerEligibility(merchant.address)

  return (
    <Section
      icon={Ticket}
      title="Offers"
      desc={
        holding
          ? 'Claim any of these by burning your points — priced in decayed value, converted on-chain.'
          : `Earn ${merchant.name} points at the counter, then return here to claim.`
      }
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
      ) : offers.data && offers.data.length > 0 ? (
        holding ? (
          <div className="grid items-stretch gap-4 md:grid-cols-2">
            {offers.data.map((offer) => (
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
        ) : (
          <Group title="Live offers">
            {offers.data.map((offer) => (
              <DataRow
                key={offer.address.toBase58()}
                label={`Offer #${offer.id.toString()}${offer.requiredSegment > 0 ? ' · verified-only' : ''}`}
                value={`${(Number(offer.pricePoints) / 10 ** DECIMALS).toFixed(2)} pts · ${offer.supplyRemaining} left`}
              />
            ))}
          </Group>
        )
      ) : (
        <EmptySlate icon={Ticket}>No active offers right now.</EmptySlate>
      )}
    </Section>
  )
}

function CampaignsSection({ merchant }: { merchant: Merchant }) {
  const campaigns = useMyCampaigns(merchant.address)
  const now = Date.now() / 1000
  if (!campaigns.data || campaigns.data.length === 0) return null

  return (
    <Section
      icon={Megaphone}
      title="Campaigns"
      desc="Time-boxed earn boosts this merchant is running."
      right={<SectionMeta>{campaigns.data.length}</SectionMeta>}
    >
      <Group title="Running campaigns">
        {campaigns.data.map((c) => {
          const live = c.active && !c.paused && Number(c.startsAt) <= now && now < Number(c.endsAt)
          return (
            <DataRow
              key={c.address.toBase58()}
              label={c.name || `Campaign #${c.id}`}
              mono={false}
              value={
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    {CAMPAIGN_KIND_LABEL[c.kind] ?? 'Campaign'}
                    {c.kind === 0 ? ` ×${(c.multiplierBps / 10_000).toFixed(2)}` : ''}
                  </span>
                  <span
                    className={
                      live ? 'text-emerald-400 text-xs' : 'text-muted-foreground/60 text-xs'
                    }
                  >
                    {live ? 'live' : 'ended'}
                  </span>
                </span>
              }
            />
          )
        })}
      </Group>
    </Section>
  )
}
