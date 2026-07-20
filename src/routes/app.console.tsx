import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  BadgeCheck,
  Gauge,
  Gift,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ShieldCheck,
  Store,
  Ticket,
  Trash2,
  Users,
} from 'lucide-react'
import { useState } from 'react'

import {
  ActionPanel,
  AddressField,
  AmountField,
  isPubkey,
  SelectField,
  TextField,
} from '@/components/app/action-panel'
import { fmtCount, fmtPoints } from '@/components/app/metric'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import {
  CAMPAIGN_KIND,
  CAMPAIGN_KIND_LABEL,
  DECIMALS,
  DEFAULT_DAILY_GIFT_CAP_RAW,
  GUARD_FLAG,
} from '@/lib/vesta/constants'
import type { Merchant } from '@/lib/vesta/decode'
import {
  clawbackIx,
  closeCampaignIx,
  closeMerchantIx,
  closeOfferIx,
  configurePolicyIx,
  createAchievementIx,
  createAllianceIx,
  createCampaignIx,
  createOfferIx,
  earnPointsCampaignIx,
  earnPointsIx,
  finalizeTransferGuardIx,
  grantAchievementIx,
  initIssuerIx,
  initializeTransferGuardIx,
  issueAttestationIx,
  joinAllianceIx,
  leaveAllianceIx,
  registerMerchantIx,
  revokeAttestationIx,
  setClawbackCapIx,
  setMerchantOperatorIx,
  setMerchantPausedIx,
  setSwapBudgetIx,
  setSwapRateIx,
  updateDecayRateIx,
  updateMerchantProfileIx,
  updateTokenMetadataIx,
} from '@/lib/vesta/ixns'
import { pdas } from '@/lib/vesta/pda'
import { useMyCampaigns, useMyIssuer, useMyMerchant, useOffers } from '@/lib/vesta/queries'
import { sendIxns } from '@/lib/vesta/tx'

export const Route = createFileRoute('/app/console')({
  component: ConsolePage,
})

const CATEGORIES = [
  { value: 0, label: 'General' },
  { value: 1, label: 'Food & Drink' },
  { value: 2, label: 'Retail' },
  { value: 3, label: 'Services' },
  { value: 4, label: 'Entertainment' },
  { value: 5, label: 'Travel' },
]

const raw = (ui: string): bigint => {
  const n = Number(ui)
  return Number.isFinite(n) && n > 0 ? BigInt(Math.round(n * 10 ** DECIMALS)) : 0n
}

function ConsolePage() {
  const { publicKey } = useWallet()
  const myMerchant = useMyMerchant()

  return (
    <div>
      <PageHeader
        title="Merchant console"
        sub="Run your loyalty program end to end — issue points, launch campaigns, mint badges, manage your alliance, tune the transfer guard, and issue attestations. Every action is one signed devnet transaction."
      />
      {!publicKey ? (
        <ConnectPrompt message="Connect a devnet wallet to register a merchant or manage yours." />
      ) : myMerchant.isLoading ? (
        <p className="text-muted-foreground text-sm">Checking for your merchant…</p>
      ) : myMerchant.data ? (
        <ManageMerchant merchant={myMerchant.data} />
      ) : (
        <RegisterMerchant />
      )}
    </div>
  )
}

// ── registration ──────────────────────────────────────────────────────────────

function RegisterMerchant() {
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [decay, setDecay] = useState('20')
  const decayBps = -Math.round(Number(decay) * 100)
  const ready =
    name.trim().length > 0 &&
    name.length <= 32 &&
    symbol.length > 0 &&
    symbol.length <= 10 &&
    Number.isFinite(decayBps)

  return (
    <div className="max-w-lg">
      <ActionPanel
        title="Register your merchant"
        description="Creates your point mint, treasury, and the argus transfer guard in one transaction. You become the mint authority via a program PDA — and set how fast unspent points cool."
        cta="Register merchant"
        disabled={!ready}
        run={async ({ wallet, connection, send }) => {
          if (!wallet.publicKey) throw new Error('Connect a wallet')
          const ix = registerMerchantIx({
            authority: wallet.publicKey,
            name: name.trim(),
            symbol: symbol.trim().toUpperCase(),
            uri: 'https://dev-vesta.netlify.app/points.json',
            decayRateBps: decayBps,
            baseEarnRate: 100n,
          })
          return send(connection, wallet, [ix])
        }}
      >
        <TextField label="Brand name (≤32)" value={name} onChange={setName} placeholder="Kavarna" />
        <TextField
          label="Symbol (≤10)"
          value={symbol}
          onChange={setSymbol}
          placeholder="KAV"
          mono
        />
        <AmountField label="Annual decay" value={decay} onChange={setDecay} suffix="%/yr" />
      </ActionPanel>
    </div>
  )
}

// ── manage (tabbed) ─────────────────────────────────────────────────────────

type TabId =
  | 'overview'
  | 'issue'
  | 'rewards'
  | 'campaigns'
  | 'alliance'
  | 'trust'
  | 'attest'
  | 'advanced'

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'issue', label: 'Issue points', icon: Gift },
  { id: 'rewards', label: 'Offers & badges', icon: Ticket },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'alliance', label: 'Alliance', icon: Users },
  { id: 'trust', label: 'Token & guard', icon: ShieldCheck },
  { id: 'attest', label: 'Attestations', icon: BadgeCheck },
  { id: 'advanced', label: 'Advanced', icon: Gauge },
]

function ManageMerchant({ merchant }: { merchant: Merchant }) {
  const [tab, setTab] = useState<TabId>('overview')
  const self = merchant.authority

  return (
    <div className="space-y-6">
      <div className="scrollbar-none flex gap-1 overflow-x-auto border-border border-b pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
              tab === t.id
                ? 'border-flame text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="size-3.5" aria-hidden />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab merchant={merchant} authority={self} />}
      {tab === 'issue' && <IssueTab merchant={merchant} authority={self} />}
      {tab === 'rewards' && <RewardsTab merchant={merchant} authority={self} />}
      {tab === 'campaigns' && <CampaignsTab merchant={merchant} authority={self} />}
      {tab === 'alliance' && <AllianceTab merchant={merchant} authority={self} />}
      {tab === 'trust' && <TrustTab merchant={merchant} authority={self} />}
      {tab === 'attest' && <AttestTab authority={self} />}
      {tab === 'advanced' && <AdvancedTab merchant={merchant} authority={self} />}
    </div>
  )
}

// ── overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ merchant, authority }: { merchant: Merchant; authority: PublicKey }) {
  const merchantPda = pdas.merchant(authority, 0n)
  const [category, setCategory] = useState<number>(merchant.category)
  const [uri, setUri] = useState(merchant.metadataUri)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-flame/40 bg-card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Store className="size-5 text-flame" aria-hidden />
          <p className="font-heading font-semibold text-lg">{merchant.name}</p>
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
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="Decay rate" value={`${merchant.decayRateBps / 100}%/yr`} />
          <Field label="Customers" value={fmtCount(merchant.customerCount)} />
          <Field label="Issued" value={fmtPoints(merchant.lifetimePointsIssued)} />
          <Field label="Redemptions" value={fmtCount(merchant.lifetimeRedemptions)} />
          <Field label="Badges" value={fmtCount(merchant.badgesIssued)} />
        </dl>
        <a
          href={`https://explorer.solana.com/address/${merchant.pointMint.toBase58()}?cluster=devnet`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1 font-mono text-flame text-sm hover:text-flame-hover"
        >
          point mint on explorer →
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ActionPanel
          title={merchant.paused ? 'Resume merchant' : 'Pause merchant'}
          description={
            merchant.paused
              ? 'Resume issuing, redeeming, and campaign activity. Clawback stays available while paused.'
              : 'Freeze earn, redeem, and campaign mutations for your program — a scoped circuit breaker. Clawback remains available.'
          }
          cta={merchant.paused ? 'Resume' : 'Pause'}
          run={async ({ wallet, connection, send }) => {
            if (!wallet.publicKey) throw new Error('Connect a wallet')
            return send(connection, wallet, [
              setMerchantPausedIx(wallet.publicKey, merchantPda, !merchant.paused),
            ])
          }}
        />

        <ActionPanel
          title="Brand profile"
          description="Set your category and off-chain metadata URI — surfaced in the public directory."
          cta="Update profile"
          run={async ({ wallet, connection, send }) => {
            if (!wallet.publicKey) throw new Error('Connect a wallet')
            return send(connection, wallet, [
              updateMerchantProfileIx(wallet.publicKey, merchantPda, category, uri.trim()),
            ])
          }}
        >
          <SelectField
            label="Category"
            value={category}
            onChange={setCategory}
            options={CATEGORIES}
          />
          <TextField
            label="Metadata URI"
            value={uri}
            onChange={setUri}
            placeholder="https://…/brand.json"
            mono
          />
        </ActionPanel>
      </div>
    </div>
  )
}

// ── issue points tab ──────────────────────────────────────────────────────────

function IssueTab({ merchant, authority }: { merchant: Merchant; authority: PublicKey }) {
  const merchantPda = pdas.merchant(authority, 0n)
  const campaigns = useMyCampaigns(merchantPda)
  const [customer, setCustomer] = useState('')
  const [amount, setAmount] = useState('')
  const [campaign, setCampaign] = useState('')
  const amountBase = raw(amount)
  const ready = isPubkey(customer) && amountBase > 0n

  const campaignOptions = [
    { value: '', label: 'No campaign (streak only)' },
    ...(campaigns.data ?? []).map((c) => ({
      value: c.address.toBase58(),
      label: `#${c.id.toString()} · ${CAMPAIGN_KIND_LABEL[c.kind] ?? 'Campaign'}`,
    })),
  ]

  return (
    <div className="max-w-lg">
      <ActionPanel
        title="Issue points"
        description="Award points for a customer's spend. The base amount runs through their streak multiplier — and, optionally, a live campaign — before minting to their wallet."
        cta="Issue points"
        disabled={!ready}
        run={async ({ wallet, connection, send }) => {
          if (!wallet.publicKey) throw new Error('Connect a wallet')
          const visitDay = Math.floor(Date.now() / 1000 / 86_400)
          const cust = new PublicKey(customer)
          const ix = campaign
            ? earnPointsCampaignIx({
                signer: wallet.publicKey,
                merchant: merchantPda,
                mint: merchant.pointMint,
                customer: cust,
                campaign: new PublicKey(campaign),
                amountBase,
                visitDay,
              })
            : earnPointsIx({
                signer: wallet.publicKey,
                merchant: merchantPda,
                mint: merchant.pointMint,
                customer: cust,
                amountBase,
                visitDay,
              })
          return send(connection, wallet, [ix])
        }}
      >
        <AddressField label="Customer wallet" value={customer} onChange={setCustomer} />
        <AmountField label="Base amount (spend)" value={amount} onChange={setAmount} />
        <SelectField
          label="Campaign"
          value={campaign}
          onChange={setCampaign}
          options={campaignOptions}
        />
      </ActionPanel>
    </div>
  )
}

// ── rewards tab (offers + achievements) ──────────────────────────────────────

function RewardsTab({ merchant, authority }: { merchant: Merchant; authority: PublicKey }) {
  const merchantPda = pdas.merchant(authority, 0n)
  const offers = useOffers(merchant.address)
  const [price, setPrice] = useState('')
  const [supply, setSupply] = useState('')
  const nextId = BigInt((offers.data?.length ?? 0) + 1)
  const priceRaw = raw(price)
  const supplyNum = Number.parseInt(supply, 10)
  const offerReady = priceRaw > 0n && Number.isFinite(supplyNum) && supplyNum > 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <ActionPanel
          title="Create an offer"
          description={`Offer #${nextId.toString()} — priced in UI points, redeemable by customers burning decayed points at fair value.`}
          cta="Create offer"
          disabled={!offerReady}
          run={async ({ wallet, connection, send }) => {
            if (!wallet.publicKey) throw new Error('Connect a wallet')
            return send(connection, wallet, [
              createOfferIx({
                authority: wallet.publicKey,
                merchant: merchantPda,
                id: nextId,
                pricePoints: priceRaw,
                supply: supplyNum,
              }),
            ])
          }}
        >
          <AmountField label="Price" value={price} onChange={setPrice} />
          <AmountField label="Supply" value={supply} onChange={setSupply} suffix="units" />
        </ActionPanel>

        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="flex items-center gap-1.5 font-medium text-[13px] text-muted-foreground">
            <Ticket className="size-3.5" aria-hidden /> Your offers
          </p>
          {offers.data && offers.data.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {offers.data.map((o) => (
                <li
                  key={o.address.toBase58()}
                  className="flex items-center justify-between gap-3 font-mono text-sm"
                >
                  <span className="text-muted-foreground">#{o.id.toString()}</span>
                  <span>{(Number(o.pricePoints) / 10 ** DECIMALS).toFixed(2)} pts</span>
                  <span className="text-muted-foreground text-xs">{o.supplyRemaining} left</span>
                  <RowClose
                    onClose={(w, c) => sendIxns(c, w, [closeOfferIx(authority, merchantPda, o.id)])}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-muted-foreground text-sm">No offers yet.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AchievementPanel merchant={merchantPda} />
        <GrantBadgePanel merchant={merchantPda} />
      </div>
    </div>
  )
}

function AchievementPanel({ merchant }: { merchant: PublicKey }) {
  const [name, setName] = useState('')
  const [threshold, setThreshold] = useState('')
  const thresholdRaw = raw(threshold)
  const ready = name.trim().length > 0 && name.length <= 32 && thresholdRaw > 0n

  return (
    <ActionPanel
      title="Define an achievement"
      description="A soulbound kleos badge customers earn at a lifetime-points threshold. Non-transferable proof of devotion, gateable by any dApp."
      cta="Create achievement"
      disabled={!ready}
      run={async ({ wallet, connection, send }) => {
        if (!wallet.publicKey) throw new Error('Connect a wallet')
        return send(connection, wallet, [
          createAchievementIx({
            authority: wallet.publicKey,
            merchant,
            id: BigInt(Date.now()),
            name: name.trim(),
            uri: 'https://dev-vesta.netlify.app/badge.json',
            thresholdLifetime: thresholdRaw,
          }),
        ])
      }}
    >
      <TextField
        label="Badge name (≤32)"
        value={name}
        onChange={setName}
        placeholder="First Flame"
      />
      <AmountField label="Lifetime threshold" value={threshold} onChange={setThreshold} />
    </ActionPanel>
  )
}

function GrantBadgePanel({ merchant }: { merchant: PublicKey }) {
  const [achievementId, setAchievementId] = useState('')
  const [customer, setCustomer] = useState('')
  const ready = achievementId.trim().length > 0 && isPubkey(customer)

  return (
    <ActionPanel
      title="Grant a badge"
      description="Mint the soulbound badge to a customer who crossed the threshold. Anyone can trigger it — the chain checks eligibility."
      cta="Grant badge"
      disabled={!ready}
      run={async ({ wallet, connection, send }) => {
        if (!wallet.publicKey) throw new Error('Connect a wallet')
        return send(connection, wallet, [
          grantAchievementIx({
            payer: wallet.publicKey,
            merchant,
            achievementId: BigInt(achievementId.trim()),
            customer: new PublicKey(customer),
          }),
        ])
      }}
    >
      <TextField
        label="Achievement id"
        value={achievementId}
        onChange={(v) => setAchievementId(v.replace(/[^0-9]/g, ''))}
        placeholder="1721476000000"
        mono
      />
      <AddressField label="Customer wallet" value={customer} onChange={setCustomer} />
    </ActionPanel>
  )
}

// ── campaigns tab ─────────────────────────────────────────────────────────────

function CampaignsTab({ merchant, authority }: { merchant: Merchant; authority: PublicKey }) {
  const merchantPda = pdas.merchant(authority, 0n)
  const offers = useOffers(merchant.address)
  const nextId = BigInt((offers.data?.length ?? 0) + 1)
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <CampaignPanel merchant={merchantPda} campaignId={nextId} />
        <CampaignList merchant={merchantPda} authority={authority} />
      </div>
    </div>
  )
}

function CampaignPanel({ merchant, campaignId }: { merchant: PublicKey; campaignId: bigint }) {
  const [kind, setKind] = useState<number>(CAMPAIGN_KIND.MULTIPLIER)
  const [name, setName] = useState('')
  const [multiplier, setMultiplier] = useState('1.5')
  const [flat, setFlat] = useState('')
  const [questTarget, setQuestTarget] = useState('')
  const [questReward, setQuestReward] = useState('')
  const [days, setDays] = useState('7')

  const dayNum = Number.parseInt(days, 10)
  const bps = Math.round(Number(multiplier) * 10_000) // e.g. 1.5× → 15000
  const ready = name.trim().length > 0 && Number.isFinite(dayNum) && dayNum > 0

  return (
    <ActionPanel
      title="Launch a campaign"
      description="A time-boxed earn boost: a multiplier, a flat bonus per visit, or a quest that pays out on completion. Governed by an optional points budget."
      cta="Create campaign"
      disabled={!ready}
      run={async ({ wallet, connection, send }) => {
        if (!wallet.publicKey) throw new Error('Connect a wallet')
        const now = BigInt(Math.floor(Date.now() / 1000))
        return send(connection, wallet, [
          createCampaignIx({
            authority: wallet.publicKey,
            merchant,
            id: campaignId,
            args: {
              kind,
              multiplierBps: kind === CAMPAIGN_KIND.MULTIPLIER ? bps : 0,
              flatBonus: kind === CAMPAIGN_KIND.FLAT_BONUS ? raw(flat) : 0n,
              questTarget: kind === CAMPAIGN_KIND.QUEST ? Number.parseInt(questTarget, 10) || 0 : 0,
              questReward: kind === CAMPAIGN_KIND.QUEST ? raw(questReward) : 0n,
              minSpendBase: 0n,
              minTier: 0,
              pointsBudget: 0n,
              perCustomerCap: 0n,
              startsAt: now - 60n,
              endsAt: now + BigInt(dayNum) * 86_400n,
              name: name.trim(),
            },
          }),
        ])
      }}
    >
      <TextField label="Campaign name" value={name} onChange={setName} placeholder="Summer boost" />
      <SelectField
        label="Kind"
        value={kind}
        onChange={setKind}
        options={CAMPAIGN_KIND_LABEL.map((label, value) => ({ value, label }))}
      />
      {kind === CAMPAIGN_KIND.MULTIPLIER ? (
        <AmountField label="Multiplier" value={multiplier} onChange={setMultiplier} suffix="×" />
      ) : null}
      {kind === CAMPAIGN_KIND.FLAT_BONUS ? (
        <AmountField label="Flat bonus / visit" value={flat} onChange={setFlat} />
      ) : null}
      {kind === CAMPAIGN_KIND.QUEST ? (
        <>
          <AmountField
            label="Quest target (visits)"
            value={questTarget}
            onChange={setQuestTarget}
            suffix="visits"
          />
          <AmountField label="Reward on completion" value={questReward} onChange={setQuestReward} />
        </>
      ) : null}
      <AmountField label="Duration" value={days} onChange={setDays} suffix="days" />
    </ActionPanel>
  )
}

function CampaignList({ merchant, authority }: { merchant: PublicKey; authority: PublicKey }) {
  const campaigns = useMyCampaigns(merchant)
  const now = Date.now() / 1000
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="flex items-center gap-1.5 font-medium text-[13px] text-muted-foreground">
        <Megaphone className="size-3.5" aria-hidden /> Your campaigns
      </p>
      {campaigns.data && campaigns.data.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {campaigns.data.map((c) => {
            const live =
              c.active && !c.paused && Number(c.startsAt) <= now && now < Number(c.endsAt)
            return (
              <li
                key={c.address.toBase58()}
                className="flex items-center justify-between gap-3 font-mono text-sm"
              >
                <span className="text-muted-foreground">#{c.id.toString()}</span>
                <span className="truncate">{CAMPAIGN_KIND_LABEL[c.kind]}</span>
                <span
                  className={live ? 'text-emerald-400 text-xs' : 'text-muted-foreground/60 text-xs'}
                >
                  {live ? 'live' : 'ended'}
                </span>
                <RowClose
                  onClose={(w, conn) =>
                    sendIxns(conn, w, [closeCampaignIx(authority, merchant, c.id)])
                  }
                />
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-3 text-muted-foreground text-sm">No campaigns yet.</p>
      )}
    </div>
  )
}

// ── alliance tab ──────────────────────────────────────────────────────────────

function AllianceTab({ merchant, authority }: { merchant: Merchant; authority: PublicKey }) {
  if (merchant.joinedAlliance) {
    return <AllianceManagement alliance={merchant.joinedAlliance} authority={authority} />
  }
  return <FoundAlliance authority={authority} />
}

function FoundAlliance({ authority }: { authority: PublicKey }) {
  const merchantPda = pdas.merchant(authority, 0n)
  const [name, setName] = useState('')
  const ready = name.trim().length > 0 && name.length <= 32

  return (
    <div className="max-w-lg">
      <ActionPanel
        title="Found an alliance"
        description="Create a koinon alliance and join it — customers will be able to swap your points with other members at governed rates."
        cta="Create & join alliance"
        disabled={!ready}
        run={async ({ wallet, connection, send }) => {
          if (!wallet.publicKey) throw new Error('Connect a wallet')
          const id = BigInt(Date.now())
          const alliance = pdas.alliance(wallet.publicKey, id)
          return send(connection, wallet, [
            createAllianceIx({ creator: wallet.publicKey, id, name: name.trim() }),
            joinAllianceIx({
              authority: wallet.publicKey,
              merchant: merchantPda,
              alliance,
              allianceAuthority: wallet.publicKey,
              rateBps: 10_000,
              swapInBudgetRaw: 1_000_000n,
            }),
          ])
        }}
      >
        <TextField
          label="Alliance name (≤32)"
          value={name}
          onChange={setName}
          placeholder="Koinon"
        />
      </ActionPanel>
    </div>
  )
}

function AllianceManagement({
  alliance,
  authority,
}: {
  alliance: PublicKey
  authority: PublicKey
}) {
  const merchantPda = pdas.merchant(authority, 0n)
  const [rate, setRate] = useState('')
  const [budget, setBudget] = useState('')
  const rateBps = Math.round(Number(rate) * 100)
  const budgetRaw = raw(budget)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <ActionPanel
        title="Set swap rate"
        description="Update your points' rate to the alliance unit. Needs the alliance authority co-sign — here you are both."
        cta="Set rate"
        disabled={!(rateBps > 0)}
        run={async ({ wallet, connection, send }) => {
          if (!wallet.publicKey) throw new Error('Connect a wallet')
          return send(connection, wallet, [
            setSwapRateIx({
              authority: wallet.publicKey,
              merchant: merchantPda,
              allianceAuthority: wallet.publicKey,
              alliance,
              newRate: rateBps,
            }),
          ])
        }}
      >
        <AmountField label="Rate (× alliance unit)" value={rate} onChange={setRate} suffix="×" />
      </ActionPanel>

      <ActionPanel
        title="Set inbound budget"
        description="Your daily cap on points others can mint into via swaps — your chosen exposure to partner economies."
        cta="Set budget"
        disabled={!(budgetRaw > 0n)}
        run={async ({ wallet, connection, send }) => {
          if (!wallet.publicKey) throw new Error('Connect a wallet')
          return send(connection, wallet, [
            setSwapBudgetIx({
              authority: wallet.publicKey,
              merchant: merchantPda,
              alliance,
              newBudget: budgetRaw,
            }),
          ])
        }}
      >
        <AmountField label="Daily inbound budget" value={budget} onChange={setBudget} />
      </ActionPanel>

      <ActionPanel
        title="Leave alliance"
        description="Exit the alliance. Your membership closes and rent returns to you; customers can no longer swap into your points."
        cta="Leave alliance"
        run={async ({ wallet, connection, send }) => {
          if (!wallet.publicKey) throw new Error('Connect a wallet')
          return send(connection, wallet, [
            leaveAllianceIx(wallet.publicKey, merchantPda, alliance),
          ])
        }}
      >
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <LogOut className="size-4 text-flame" aria-hidden />
          Departure is one signature
        </div>
      </ActionPanel>
    </div>
  )
}

// ── trust tab (token + guard) ─────────────────────────────────────────────────

function TrustTab({ merchant, authority }: { merchant: Merchant; authority: PublicKey }) {
  const merchantPda = pdas.merchant(authority, 0n)
  const mint = merchant.pointMint
  const [decay, setDecay] = useState(String(-merchant.decayRateBps / 100))
  const [metaKind, setMetaKind] = useState<number>(2)
  const [metaValue, setMetaValue] = useState('')

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <ActionPanel
          title="Retune decay rate"
          description="Change how fast unspent points cool. Positive appreciation is possible too — set a negative annual rate to keep points melting."
          cta="Update decay"
          run={async ({ wallet, connection, send }) => {
            if (!wallet.publicKey) throw new Error('Connect a wallet')
            return send(connection, wallet, [
              updateDecayRateIx({
                authority: wallet.publicKey,
                merchant: merchantPda,
                mint,
                newRateBps: -Math.round(Number(decay) * 100),
              }),
            ])
          }}
        >
          <AmountField label="Annual decay" value={decay} onChange={setDecay} suffix="%/yr" />
        </ActionPanel>

        <ActionPanel
          title="Update token metadata"
          description="Edit the on-chain Token-2022 metadata field — name, symbol, or the metadata URI that wallets and explorers read."
          cta="Update metadata"
          run={async ({ wallet, connection, send }) => {
            if (!wallet.publicKey) throw new Error('Connect a wallet')
            return send(connection, wallet, [
              updateTokenMetadataIx({
                authority: wallet.publicKey,
                merchant: merchantPda,
                mint,
                fieldKind: metaKind,
                value: metaValue.trim(),
              }),
            ])
          }}
        >
          <SelectField
            label="Field"
            value={metaKind}
            onChange={setMetaKind}
            options={[
              { value: 0, label: 'Name' },
              { value: 1, label: 'Symbol' },
              { value: 2, label: 'URI' },
            ]}
          />
          <TextField label="New value" value={metaValue} onChange={setMetaValue} mono />
        </ActionPanel>
      </div>

      <GuardPanel merchant={merchantPda} mint={mint} />
    </div>
  )
}

function GuardPanel({ merchant, mint }: { merchant: PublicKey; mint: PublicKey }) {
  const [cap, setCap] = useState(String(DEFAULT_DAILY_GIFT_CAP_RAW / 10 ** DECIMALS))
  const [blockProgram, setBlockProgram] = useState(true)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <ActionPanel
        title="Initialize transfer guard"
        description="Creates the argus policy for your mint. Required before customers can gift — without it, hooked transfers fail closed."
        cta="Initialize guard"
        run={async ({ wallet, connection, send }) => {
          if (!wallet.publicKey) throw new Error('Connect a wallet')
          return send(connection, wallet, [
            initializeTransferGuardIx({
              authority: wallet.publicKey,
              merchant,
              mint,
              policy: {
                flags: blockProgram ? GUARD_FLAG.BLOCK_PROGRAM_OWNED : 0,
                dailyGiftCap: raw(cap),
                perTxCap: 0n,
                maxWalletBalance: 0n,
                transfersPerDayCap: 0,
                cooldownSecs: 0,
                attestationIssuer: PublicKey.default,
                attestationSchema: 0,
                attestationMask: 0n,
              },
            }),
          ])
        }}
      >
        <AmountField label="Daily gift cap" value={cap} onChange={setCap} />
        <Toggle
          label="Block program-owned recipients"
          checked={blockProgram}
          onChange={setBlockProgram}
        />
      </ActionPanel>

      <ActionPanel
        title="Retune guard policy"
        description="Adjust the live daily gift cap without touching the rest of the policy. Takes effect on the next transfer."
        cta="Update policy"
        run={async ({ wallet, connection, send }) => {
          if (!wallet.publicKey) throw new Error('Connect a wallet')
          return send(connection, wallet, [
            configurePolicyIx({ authority: wallet.publicKey, mint, dailyGiftCap: raw(cap) }),
          ])
        }}
      >
        <AmountField label="New daily gift cap" value={cap} onChange={setCap} />
      </ActionPanel>

      <ActionPanel
        title="Finalize guard (burn authority)"
        description="Permanently revoke the hook authority. After this, not even you can repoint the transfer rules — the strongest trust signal you can give customers."
        cta="Finalize guard"
        run={async ({ wallet, connection, send }) => {
          if (!wallet.publicKey) throw new Error('Connect a wallet')
          return send(connection, wallet, [
            finalizeTransferGuardIx(wallet.publicKey, merchant, mint),
          ])
        }}
      >
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <ShieldCheck className="size-4 text-flame" aria-hidden />
          Irreversible
        </div>
      </ActionPanel>
    </div>
  )
}

// ── attestations tab (aegis) ──────────────────────────────────────────────────

function AttestTab({ authority }: { authority: PublicKey }) {
  const issuer = useMyIssuer()

  if (issuer.isLoading) {
    return <p className="text-muted-foreground text-sm">Checking for your issuer…</p>
  }

  if (!issuer.data) {
    return <RegisterIssuer />
  }

  return (
    <IssuerConsole
      issuer={pdas.issuer(authority, 0n)}
      name={issuer.data.name}
      issued={issuer.data.issued}
    />
  )
}

function RegisterIssuer() {
  const [name, setName] = useState('')
  const ready = name.trim().length > 0 && name.length <= 32

  return (
    <div className="max-w-lg">
      <ActionPanel
        title="Become an aegis issuer"
        description="Register as an attestation issuer. You can then vouch for wallets — region, KYC tier, age band — and argus guards can gate transfers on your attestations."
        cta="Register issuer"
        disabled={!ready}
        run={async ({ wallet, connection, send }) => {
          if (!wallet.publicKey) throw new Error('Connect a wallet')
          return send(connection, wallet, [
            initIssuerIx({ authority: wallet.publicKey, name: name.trim() }),
          ])
        }}
      >
        <TextField
          label="Issuer name (≤32)"
          value={name}
          onChange={setName}
          placeholder="Kavarna KYC"
        />
      </ActionPanel>
    </div>
  )
}

function IssuerConsole({
  issuer,
  name,
  issued,
}: {
  issuer: PublicKey
  name: string
  issued: bigint
}) {
  const [subject, setSubject] = useState('')
  const [schema, setSchema] = useState<number>(1)
  const [value, setValue] = useState('1')
  const [days, setDays] = useState('365')
  const [revokeSubject, setRevokeSubject] = useState('')

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-flame/40 bg-card p-6">
        <div className="flex items-center gap-2">
          <BadgeCheck className="size-5 text-flame" aria-hidden />
          <p className="font-heading font-semibold text-lg">{name}</p>
          <span className="ml-auto font-mono text-muted-foreground text-sm">
            {fmtCount(issued)} issued
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ActionPanel
          title="Issue attestation"
          description="Vouch for a wallet under a schema. The attestation is a PDA argus can read at transfer time to enforce compliance policies."
          cta="Issue attestation"
          disabled={!isPubkey(subject)}
          run={async ({ wallet, connection, send }) => {
            if (!wallet.publicKey) throw new Error('Connect a wallet')
            const now = BigInt(Math.floor(Date.now() / 1000))
            const dayNum = Number.parseInt(days, 10) || 365
            return send(connection, wallet, [
              issueAttestationIx({
                signer: wallet.publicKey,
                issuer,
                subject: new PublicKey(subject),
                schema,
                value: BigInt(Number.parseInt(value, 10) || 1),
                validFrom: now,
                expiresAt: now + BigInt(dayNum) * 86_400n,
              }),
            ])
          }}
        >
          <AddressField label="Subject wallet" value={subject} onChange={setSubject} />
          <SelectField
            label="Schema"
            value={schema}
            onChange={setSchema}
            options={[
              { value: 1, label: 'Region' },
              { value: 2, label: 'KYC tier' },
              { value: 3, label: 'Age band' },
            ]}
          />
          <AmountField label="Value" value={value} onChange={setValue} suffix="=" />
          <AmountField label="Valid for" value={days} onChange={setDays} suffix="days" />
        </ActionPanel>

        <ActionPanel
          title="Revoke attestation"
          description="Immediately invalidate a wallet's attestation. argus fails closed on revoked attestations from the next transfer."
          cta="Revoke"
          disabled={!isPubkey(revokeSubject)}
          run={async ({ wallet, connection, send }) => {
            if (!wallet.publicKey) throw new Error('Connect a wallet')
            return send(connection, wallet, [
              revokeAttestationIx({
                signer: wallet.publicKey,
                issuer,
                subject: new PublicKey(revokeSubject),
                reasonCode: 1,
              }),
            ])
          }}
        >
          <AddressField label="Subject wallet" value={revokeSubject} onChange={setRevokeSubject} />
        </ActionPanel>
      </div>
    </div>
  )
}

// ── advanced tab (operators, clawback, danger) ───────────────────────────────

function AdvancedTab({ merchant, authority }: { merchant: Merchant; authority: PublicKey }) {
  const merchantPda = pdas.merchant(authority, 0n)
  return (
    <div className="space-y-6">
      <OperatorsPanel merchant={merchantPda} operators={merchant.operators} />
      <div className="grid gap-4 md:grid-cols-2">
        <ClawbackCapPanel merchant={merchantPda} current={merchant.clawbackDailyCapRaw} />
        <ClawbackPanel merchant={merchantPda} mint={merchant.pointMint} authority={authority} />
      </div>
      <CloseMerchantPanel merchant={merchantPda} mint={merchant.pointMint} />
    </div>
  )
}

function OperatorsPanel({ merchant, operators }: { merchant: PublicKey; operators: PublicKey[] }) {
  const [op, setOp] = useState('')
  const ready = isPubkey(op)
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="flex items-center gap-1.5 font-medium text-[13px] text-muted-foreground">
        <Users className="size-3.5" aria-hidden /> Operators ({operators.length}/4)
      </p>
      {operators.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {operators.map((o) => (
            <li
              key={o.toBase58()}
              className="flex items-center justify-between gap-3 font-mono text-sm"
            >
              <span className="truncate text-muted-foreground">
                {o.toBase58().slice(0, 6)}…{o.toBase58().slice(-6)}
              </span>
              <RowClose
                label="remove"
                onClose={(w, c) =>
                  w.publicKey
                    ? sendIxns(c, w, [setMerchantOperatorIx(w.publicKey, merchant, o, false)])
                    : Promise.resolve()
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-muted-foreground text-sm">
          No operators. Add hot keys to issue points and run campaigns without exposing your owner
          key.
        </p>
      )}
      <div className="mt-4 max-w-md">
        <ActionPanel
          title="Add operator"
          description="Grant a key permission to issue points and run day-to-day operations. The owner key retains full control."
          cta="Add operator"
          disabled={!ready}
          run={async ({ wallet, connection, send }) => {
            if (!wallet.publicKey) throw new Error('Connect a wallet')
            return send(connection, wallet, [
              setMerchantOperatorIx(wallet.publicKey, merchant, new PublicKey(op), true),
            ])
          }}
        >
          <AddressField label="Operator wallet" value={op} onChange={setOp} />
        </ActionPanel>
      </div>
    </div>
  )
}

function ClawbackCapPanel({ merchant, current }: { merchant: PublicKey; current: bigint }) {
  const [cap, setCap] = useState(String(Number(current) / 10 ** DECIMALS))
  return (
    <ActionPanel
      title="Daily clawback cap"
      description="Bound how much you can claw back per day, in points. Zero means unlimited. A public, on-chain self-limit that reassures customers."
      cta="Set cap"
      run={async ({ wallet, connection, send }) => {
        if (!wallet.publicKey) throw new Error('Connect a wallet')
        return send(connection, wallet, [setClawbackCapIx(wallet.publicKey, merchant, raw(cap))])
      }}
    >
      <AmountField label="Daily cap (0 = unlimited)" value={cap} onChange={setCap} />
    </ActionPanel>
  )
}

function ClawbackPanel({
  merchant,
  mint,
  authority,
}: {
  merchant: PublicKey
  mint: PublicKey
  authority: PublicKey
}) {
  const [customer, setCustomer] = useState('')
  const [amount, setAmount] = useState('')
  const amountRaw = raw(amount)
  const ready = isPubkey(customer) && amountRaw > 0n

  return (
    <ActionPanel
      title="Clawback"
      description="Reclaim points to your treasury for refunds or fraud. A hooked, reason-coded transfer — argus audits it and it is fully public by design."
      cta="Clawback to treasury"
      disabled={!ready}
      run={async ({ wallet, connection, send }) => {
        if (!wallet.publicKey) throw new Error('Connect a wallet')
        return send(connection, wallet, [
          clawbackIx({
            authority: wallet.publicKey,
            merchant,
            mint,
            treasuryOwner: authority,
            customer: new PublicKey(customer),
            amountRaw,
            reasonCode: 1,
          }),
        ])
      }}
    >
      <AddressField label="Customer wallet" value={customer} onChange={setCustomer} />
      <AmountField label="Amount" value={amount} onChange={setAmount} />
    </ActionPanel>
  )
}

function CloseMerchantPanel({ merchant, mint }: { merchant: PublicKey; mint: PublicKey }) {
  return (
    <div className="max-w-lg rounded-2xl border border-red-500/30 bg-red-500/[0.03] p-1">
      <ActionPanel
        title="Close merchant"
        description="Permanently delete this merchant and reclaim rent. Only possible when the point supply is zero — clear all outstanding points first. This cannot be undone."
        cta="Close merchant"
        run={async ({ wallet, connection, send }) => {
          if (!wallet.publicKey) throw new Error('Connect a wallet')
          return send(connection, wallet, [closeMerchantIx(wallet.publicKey, merchant, mint)])
        }}
      >
        <div className="flex items-center gap-2 text-red-400/90 text-sm">
          <Trash2 className="size-4" aria-hidden />
          Irreversible — supply must be zero
        </div>
      </ActionPanel>
    </div>
  )
}

// ── shared bits ───────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-0.5 font-heading font-semibold text-xl tabular-nums">{value}</dd>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-muted-foreground text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-flame"
      />
      {label}
    </label>
  )
}

/** A tiny inline "close/remove" button used inside on-chain list rows. */
function RowClose({
  label = 'close',
  onClose,
}: {
  label?: string
  onClose: (
    wallet: ReturnType<typeof useWallet>,
    connection: ReturnType<typeof useConnection>['connection'],
  ) => Promise<unknown>
}) {
  const { connection } = useConnection()
  const wallet = useWallet()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  if (!wallet.publicKey) return null
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          await onClose(wallet, connection)
          await queryClient.invalidateQueries()
        } finally {
          setBusy(false)
        }
      }}
      className="text-muted-foreground/60 text-xs transition-colors hover:text-red-400"
    >
      {busy ? '…' : label}
    </button>
  )
}
