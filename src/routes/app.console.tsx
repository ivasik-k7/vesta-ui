import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, type TransactionInstruction } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowUpRight,
  Award,
  BadgeCheck,
  Coins,
  Gauge,
  Gift,
  LayoutDashboard,
  Loader2,
  LogOut,
  Megaphone,
  Pause,
  Play,
  ShieldCheck,
  Ticket,
  Trash2,
  Undo2,
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
import { fmtCount, fmtPoints, Metric } from '@/components/app/metric'
import { Section, SectionMeta } from '@/components/app/section'
import { DataRow, FieldRow, Group, Input, Row } from '@/components/app/settings-kit'
import { ShareButton } from '@/components/app/share-button'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { humanizeError, useNotify } from '@/lib/notify/context'
import {
  CAMPAIGN_KIND,
  CAMPAIGN_KIND_LABEL,
  DECIMALS,
  DEFAULT_DAILY_GIFT_CAP_RAW,
  GUARD_FLAG,
} from '@/lib/vesta/constants'
import type { Alliance, GuardConfig, Merchant } from '@/lib/vesta/decode'
import {
  clawbackIx,
  closeAchievementIx,
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
  setAllianceParamsIx,
  setAlliancePausedIx,
  setClawbackCapIx,
  setGuardPausedIx,
  setMerchantOperatorIx,
  setMerchantPausedIx,
  setSwapBudgetIx,
  setSwapRateIx,
  setTokenAttributeIx,
  updateCampaignIx,
  updateDecayRateIx,
  updateMerchantIx,
  updateMerchantProfileIx,
  updateTokenMetadataIx,
} from '@/lib/vesta/ixns'
import { pdas } from '@/lib/vesta/pda'
import {
  useAlliances,
  useGuardConfig,
  useMyAchievements,
  useMyCampaigns,
  useMyIssuer,
  useMyMerchant,
  useOffers,
} from '@/lib/vesta/queries'
import { sendIxns } from '@/lib/vesta/tx'

export const Route = createFileRoute('/app/console')({
  component: () => <ConsoleView tab="overview" />,
})

const CATEGORIES = [
  { value: 0, label: 'General' },
  { value: 1, label: 'Food & Drink' },
  { value: 2, label: 'Retail' },
  { value: 3, label: 'Services' },
  { value: 4, label: 'Entertainment' },
  { value: 5, label: 'Travel' },
]

// UI-points → raw units (2 decimals).
const raw = (ui: string): bigint => {
  const n = Number(ui)
  return Number.isFinite(n) && n > 0 ? BigInt(Math.round(n * 10 ** DECIMALS)) : 0n
}
const fromRaw = (r: bigint) => (Number(r) / 10 ** DECIMALS).toFixed(2)

/** Row-level signer with per-key busy state + toast feedback. */
function useSign() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const qc = useQueryClient()
  const { notify } = useNotify()
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const run = async (key: string, label: string, ixns: TransactionInstruction[]) => {
    if (!wallet.publicKey) return
    setBusyKey(key)
    try {
      const sig = await sendIxns(connection, wallet, ixns)
      notify('success', label, { message: 'Confirmed on devnet.', txSig: sig })
      await qc.invalidateQueries()
    } catch (e) {
      notify('error', `${label} failed`, { message: humanizeError(e) })
    } finally {
      setBusyKey(null)
    }
  }
  return { run, busyKey }
}

export type ConsoleTab =
  | 'overview'
  | 'issue'
  | 'offers'
  | 'achievements'
  | 'campaigns'
  | 'alliance'
  | 'token'
  | 'attest'
  | 'advanced'

export const CONSOLE_TABS: ConsoleTab[] = [
  'overview',
  'issue',
  'offers',
  'achievements',
  'campaigns',
  'alliance',
  'token',
  'attest',
  'advanced',
]

const TAB_META: Record<ConsoleTab, { title: string; sub: string }> = {
  overview: {
    title: 'Merchant overview',
    sub: 'Your program at a glance — status, lifetime figures, and owner controls.',
  },
  issue: {
    title: 'Issue points',
    sub: 'The core loop — award points for spend, straight to a customer wallet. Gasless for them.',
  },
  offers: {
    title: 'Offers',
    sub: 'Rewards customers redeem by burning points — create, monitor, and close them.',
  },
  achievements: {
    title: 'Achievements',
    sub: 'Soulbound kleos badges earned at lifetime thresholds — define, grant, and retire.',
  },
  campaigns: {
    title: 'Campaigns',
    sub: 'Time-boxed earn boosts — multipliers, flat bonuses, quests. Pause and close live.',
  },
  alliance: {
    title: 'Alliance',
    sub: 'Cross-brand point swaps at governed rates — found one or manage your membership.',
  },
  token: {
    title: 'Token & guard',
    sub: 'The Token-2022 mint your points live on, and the argus policy every transfer must pass.',
  },
  attest: {
    title: 'Attestations',
    sub: 'Vouch for wallets as an aegis issuer — argus guards can gate transfers on your word.',
  },
  advanced: {
    title: 'Advanced',
    sub: 'Operators, clawback, and the irreversible stuff.',
  },
}

/** One merchant-console tab, routed from the sidebar (one route per tab). */
export function ConsoleView({ tab }: { tab: ConsoleTab }) {
  const { publicKey } = useWallet()
  const myMerchant = useMyMerchant()
  const meta = TAB_META[tab]

  return (
    <div>
      <PageHeader title={meta.title} sub={meta.sub} />
      {!publicKey ? (
        <ConnectPrompt message="Connect a devnet wallet to register a merchant or manage yours." />
      ) : myMerchant.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
        </div>
      ) : myMerchant.data ? (
        <TabBody tab={tab} merchant={myMerchant.data} />
      ) : (
        <RegisterMerchant />
      )}
    </div>
  )
}

// ── registration (fallback when no merchant yet) ─────────────────────────────

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
          return send(connection, wallet, [
            registerMerchantIx({
              authority: wallet.publicKey,
              name: name.trim(),
              symbol: symbol.trim().toUpperCase(),
              uri: 'https://dev-vesta.netlify.app/points.json',
              decayRateBps: decayBps,
              baseEarnRate: 100n,
            }),
          ])
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

// ── tab bodies (navigation lives in the sidebar) ─────────────────────────────

function TabBody({ tab, merchant }: { tab: ConsoleTab; merchant: Merchant }) {
  const authority = merchant.authority
  const merchantPda = pdas.merchant(authority, 0n)

  switch (tab) {
    case 'overview':
      return <OverviewTab merchant={merchant} merchantPda={merchantPda} />
    case 'issue':
      return <IssueTab merchant={merchant} merchantPda={merchantPda} />
    case 'offers':
      return <OffersTab merchant={merchant} merchantPda={merchantPda} />
    case 'achievements':
      return <AchievementsTab merchantPda={merchantPda} />
    case 'campaigns':
      return <CampaignsTab merchantPda={merchantPda} />
    case 'alliance':
      return <AllianceTab merchant={merchant} merchantPda={merchantPda} />
    case 'token':
      return <TokenGuardTab merchant={merchant} merchantPda={merchantPda} />
    case 'attest':
      return <AttestTab authority={authority} />
    case 'advanced':
      return <AdvancedTab merchant={merchant} merchantPda={merchantPda} />
  }
}

// ── overview ──────────────────────────────────────────────────────────────────

function OverviewTab({ merchant, merchantPda }: { merchant: Merchant; merchantPda: PublicKey }) {
  const { run, busyKey } = useSign()
  const [category, setCategory] = useState<number>(merchant.category)
  const [uri, setUri] = useState(merchant.metadataUri)
  const [earnRate, setEarnRate] = useState(merchant.baseEarnRate.toString())
  const mint = merchant.pointMint.toBase58()

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-flame/30 bg-gradient-to-br from-flame/[0.06] to-transparent p-5">
        <div
          aria-hidden
          className="-right-12 -top-12 pointer-events-none absolute size-40 rounded-full bg-flame/10 blur-3xl"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-medium font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]">
              Your merchant
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="font-heading font-semibold text-3xl tracking-tight">{merchant.name}</p>
              {merchant.verified ? (
                <BadgeCheck className="size-5 text-flame" aria-label="Verified" />
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${merchant.paused ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}
              >
                {merchant.paused ? 'Paused' : 'Active'}
              </span>
              {merchant.joinedAlliance ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground text-xs">
                  <Users className="size-3" aria-hidden /> In alliance
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Link
              to="/app/token/$mint"
              params={{ mint }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:border-flame/40 hover:text-flame"
            >
              <Coins className="size-3.5" aria-hidden /> Token
            </Link>
            <ShareButton
              value={merchant.address.toBase58()}
              what="Merchant"
              label="Share"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:border-flame/40 hover:text-flame"
            />
            <a
              href={`https://explorer.solana.com/address/${mint}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:border-flame/40 hover:text-flame"
            >
              Explorer <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <Section icon={LayoutDashboard} title="Business at a glance" desc="Lifetime program figures.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric icon={Users} label="Customers" value={fmtCount(merchant.customerCount)} accent />
          <Metric icon={Coins} label="Issued" value={fmtPoints(merchant.lifetimePointsIssued)} />
          <Metric
            icon={Ticket}
            label="Redemptions"
            value={fmtCount(merchant.lifetimeRedemptions)}
          />
          <Metric icon={Award} label="Badges" value={fmtCount(merchant.badgesIssued)} />
          <Metric icon={Undo2} label="Clawed back" value={fmtPoints(merchant.lifetimeClawedBack)} />
        </div>
      </Section>

      {/* Controls */}
      <Section icon={Gauge} title="Program controls" desc="Owner-only switches and rates.">
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Group title="Status">
            <Row
              icon={merchant.paused ? Play : Pause}
              title={merchant.paused ? 'Resume merchant' : 'Pause merchant'}
              desc="Scoped circuit breaker — halts earn/redeem/campaigns. Clawback stays available."
            >
              <Button
                size="sm"
                disabled={busyKey === 'pause'}
                onClick={() =>
                  run('pause', merchant.paused ? 'Resume merchant' : 'Pause merchant', [
                    setMerchantPausedIx(merchant.authority, merchantPda, !merchant.paused),
                  ])
                }
              >
                {busyKey === 'pause' ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {merchant.paused ? 'Resume' : 'Pause'}
              </Button>
            </Row>
            <FieldRow
              label="Base earn rate"
              desc="Raw units minted per 1 base unit of spend (100 = 1.00 pt per base)."
            >
              <div className="flex gap-2">
                <Input
                  value={earnRate}
                  inputMode="numeric"
                  onChange={(e) => setEarnRate(e.target.value.replace(/[^0-9]/g, ''))}
                />
                <Button
                  size="sm"
                  className="shrink-0"
                  disabled={busyKey === 'rate' || !Number(earnRate)}
                  onClick={() =>
                    run('rate', 'Update earn rate', [
                      updateMerchantIx(merchant.authority, merchantPda, BigInt(earnRate)),
                    ])
                  }
                >
                  Save
                </Button>
              </div>
            </FieldRow>
          </Group>

          <Group title="Brand profile" desc="Surfaced in Discover and the public profile.">
            <FieldRow label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm shadow-inner outline-none transition-colors focus:border-flame/60"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Metadata URI">
              <Input
                mono
                value={uri}
                onChange={(e) => setUri(e.target.value)}
                placeholder="https://…/brand.json"
              />
            </FieldRow>
            <div className="px-4 py-3">
              <Button
                size="sm"
                disabled={busyKey === 'profile'}
                onClick={() =>
                  run('profile', 'Update brand profile', [
                    updateMerchantProfileIx(merchant.authority, merchantPda, category, uri.trim()),
                  ])
                }
              >
                {busyKey === 'profile' ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Save profile
              </Button>
            </div>
          </Group>
        </div>
      </Section>
    </div>
  )
}

// ── issue points ──────────────────────────────────────────────────────────────

// earn_points caps `minted` (= base × earn_rate(100) × multiplier ≤ ×2.4) at
// 1,000,000 raw per tx — so the largest always-safe base amount is 4,166.
const MAX_ISSUE_BASE = 4_000n

function IssueTab({ merchant, merchantPda }: { merchant: Merchant; merchantPda: PublicKey }) {
  const campaigns = useMyCampaigns(merchantPda)
  const [customer, setCustomer] = useState('')
  const [amount, setAmount] = useState('')
  const [campaign, setCampaign] = useState('')
  const amountBase = (() => {
    const n = Number(amount)
    return Number.isFinite(n) && n > 0 ? BigInt(Math.round(n)) : 0n
  })()
  const overCap = amountBase > MAX_ISSUE_BASE
  const ready = isPubkey(customer) && amountBase > 0n && !overCap

  const campaignOptions = [
    { value: '', label: 'No campaign (streak only)' },
    ...(campaigns.data ?? [])
      .filter((c) => c.active && !c.paused)
      .map((c) => ({
        value: c.address.toBase58(),
        label: `${c.name || `#${c.id}`} · ${CAMPAIGN_KIND_LABEL[c.kind] ?? 'Campaign'}`,
      })),
  ]

  return (
    <Section
      icon={Gift}
      title="Issue points"
      desc="The core loop — award points for a customer's spend, straight to their wallet."
    >
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ActionPanel
          title="Issue points"
          description={`1 base ≈ 1.00 pt before the streak multiplier (≤ ×2.4). The chain caps one issue at 10,000.00 pts — base max ${MAX_ISSUE_BASE.toLocaleString()}.`}
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
          <AmountField
            label="Base amount (spend)"
            value={amount}
            onChange={setAmount}
            suffix="base"
          />
          {overCap ? (
            <p className="text-red-400/90 text-xs">
              Max {MAX_ISSUE_BASE.toLocaleString()} base per transaction — split larger grants.
            </p>
          ) : null}
          <SelectField
            label="Campaign"
            value={campaign}
            onChange={setCampaign}
            options={campaignOptions}
          />
        </ActionPanel>

        <Group title="How earning works" desc="All math runs on-chain — the UI only proposes.">
          <DataRow label="Earn rate" value={`${merchant.baseEarnRate.toString()} raw / base`} />
          <DataRow label="Streak bonus" value="+2% per day, capped ×2.4 total" mono={false} />
          <DataRow label="Per-tx cap" value="10,000.00 pts" mono={false} />
          <DataRow label="Gasless for customer" value="Yes — you sign & pay" mono={false} />
        </Group>
      </div>
    </Section>
  )
}

// ── offers management ─────────────────────────────────────────────────────────

function OffersTab({ merchant, merchantPda }: { merchant: Merchant; merchantPda: PublicKey }) {
  const offers = useOffers(merchant.address)
  const { run, busyKey } = useSign()
  const [price, setPrice] = useState('')
  const [supply, setSupply] = useState('')
  const nextId = BigInt((offers.data?.length ?? 0) + 1)
  const priceRaw = raw(price)
  const supplyNum = Number.parseInt(supply, 10)
  const ready = priceRaw > 0n && Number.isFinite(supplyNum) && supplyNum > 0

  return (
    <Section
      icon={Ticket}
      title="Offers"
      desc="Rewards customers redeem by burning points — priced in UI value, so decay never cheats anyone."
      right={offers.data ? <SectionMeta>{offers.data.length} live</SectionMeta> : undefined}
    >
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ActionPanel
          title={`Create offer #${nextId.toString()}`}
          description="Set the point price and how many units can ever be redeemed."
          cta="Create offer"
          disabled={!ready}
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

        <Group title="Live offers" desc="Closing an offer returns its rent to you.">
          {offers.isLoading ? (
            <div className="p-4">
              <Skeleton className="h-24" />
            </div>
          ) : offers.data && offers.data.length > 0 ? (
            offers.data.map((o) => (
              <Row
                key={o.address.toBase58()}
                title={`Offer #${o.id.toString()}`}
                desc={`${fromRaw(o.pricePoints)} pts · ${o.supplyRemaining} left`}
              >
                <button
                  type="button"
                  disabled={busyKey === `offer-${o.id}`}
                  onClick={() =>
                    run(`offer-${o.id}`, `Close offer #${o.id}`, [
                      closeOfferIx(merchant.authority, merchantPda, o.id),
                    ])
                  }
                  className="rounded-lg border border-border px-2.5 py-1 text-muted-foreground text-xs transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
                >
                  {busyKey === `offer-${o.id}` ? '…' : 'Close'}
                </button>
              </Row>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-muted-foreground text-sm">
              No offers yet.
            </div>
          )}
        </Group>
      </div>
    </Section>
  )
}

// ── achievements management ───────────────────────────────────────────────────

function AchievementsTab({ merchantPda }: { merchantPda: PublicKey }) {
  const achievements = useMyAchievements(merchantPda)
  const { run, busyKey } = useSign()
  const [name, setName] = useState('')
  const [threshold, setThreshold] = useState('')
  const [grantId, setGrantId] = useState('')
  const [grantCustomer, setGrantCustomer] = useState('')
  const thresholdRaw = raw(threshold)
  const createReady = name.trim().length > 0 && name.length <= 32 && thresholdRaw > 0n
  const grantReady = grantId !== '' && isPubkey(grantCustomer)

  return (
    <Section
      icon={Award}
      title="Achievements"
      desc="Soulbound kleos badges customers earn at lifetime-points thresholds — non-transferable proof of devotion."
      right={achievements.data ? <SectionMeta>{achievements.data.length}</SectionMeta> : undefined}
    >
      <div className="space-y-6">
        {/* Registry */}
        <Group
          title="Your achievements"
          desc="Closing removes the definition (badges already granted survive)."
        >
          {achievements.isLoading ? (
            <div className="p-4">
              <Skeleton className="h-24" />
            </div>
          ) : achievements.data && achievements.data.length > 0 ? (
            achievements.data.map((a) => (
              <Row
                key={a.address.toBase58()}
                icon={Award}
                title={
                  <span className="flex items-center gap-2">
                    <span className="truncate">{a.name}</span>
                    <span className="rounded-full border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      id {a.id.toString()}
                    </span>
                  </span>
                }
                desc={`threshold ${fromRaw(a.thresholdLifetime)} pts lifetime · ${a.badgeCount} badge${a.badgeCount === 1 ? '' : 's'} granted`}
              >
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGrantId(a.id.toString())}
                    className="rounded-lg border border-flame/40 px-2.5 py-1 text-flame text-xs transition-colors hover:bg-flame/10"
                  >
                    Grant
                  </button>
                  <CloseAchievementButton
                    merchantPda={merchantPda}
                    id={a.id}
                    name={a.name}
                    run={run}
                    busy={busyKey === `achv-${a.id}`}
                  />
                </div>
              </Row>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-muted-foreground text-sm">
              No achievements defined yet — create the first below.
            </div>
          )}
        </Group>

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <ActionPanel
            title="Define an achievement"
            description="Customers who cross the lifetime threshold become eligible; anyone can then trigger the grant — the chain checks eligibility."
            cta="Create achievement"
            disabled={!createReady}
            run={async ({ wallet, connection, send }) => {
              if (!wallet.publicKey) throw new Error('Connect a wallet')
              return send(connection, wallet, [
                createAchievementIx({
                  authority: wallet.publicKey,
                  merchant: merchantPda,
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

          <ActionPanel
            title="Grant a badge"
            description="Mint the soulbound badge to an eligible customer. Pick an achievement above to prefill its id."
            cta="Grant badge"
            disabled={!grantReady}
            run={async ({ wallet, connection, send }) => {
              if (!wallet.publicKey) throw new Error('Connect a wallet')
              return send(connection, wallet, [
                grantAchievementIx({
                  payer: wallet.publicKey,
                  merchant: merchantPda,
                  achievementId: BigInt(grantId),
                  customer: new PublicKey(grantCustomer),
                }),
              ])
            }}
          >
            <TextField
              label="Achievement id"
              value={grantId}
              onChange={(v) => setGrantId(v.replace(/[^0-9]/g, ''))}
              placeholder="pick above or paste"
              mono
            />
            <AddressField
              label="Customer wallet"
              value={grantCustomer}
              onChange={setGrantCustomer}
            />
          </ActionPanel>
        </div>
      </div>
    </Section>
  )
}

function CloseAchievementButton({
  merchantPda,
  id,
  name,
  run,
  busy,
}: {
  merchantPda: PublicKey
  id: bigint
  name: string
  run: (key: string, label: string, ixns: TransactionInstruction[]) => Promise<void>
  busy: boolean
}) {
  const { publicKey } = useWallet()
  return (
    <button
      type="button"
      disabled={busy || !publicKey}
      onClick={() =>
        publicKey &&
        run(`achv-${id}`, `Close achievement "${name}"`, [
          closeAchievementIx(publicKey, merchantPda, id),
        ])
      }
      className="rounded-lg border border-border px-2.5 py-1 text-muted-foreground text-xs transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
    >
      {busy ? '…' : 'Close'}
    </button>
  )
}

// ── campaigns management ─────────────────────────────────────────────────────

function CampaignsTab({ merchantPda }: { merchantPda: PublicKey }) {
  const campaigns = useMyCampaigns(merchantPda)
  const { run, busyKey } = useSign()
  const { publicKey } = useWallet()
  const now = Date.now() / 1000

  const [kind, setKind] = useState<number>(CAMPAIGN_KIND.MULTIPLIER)
  const [name, setName] = useState('')
  const [multiplier, setMultiplier] = useState('1.5')
  const [flat, setFlat] = useState('')
  const [questTarget, setQuestTarget] = useState('')
  const [questReward, setQuestReward] = useState('')
  const [days, setDays] = useState('7')
  const [budget, setBudget] = useState('0')
  const [perCap, setPerCap] = useState('0')
  const [minTier, setMinTier] = useState<number>(0)
  const [minSpend, setMinSpend] = useState('0')
  const dayNum = Number.parseInt(days, 10)
  const bps = Math.round(Number(multiplier) * 10_000)
  const ready = name.trim().length > 0 && Number.isFinite(dayNum) && dayNum > 0
  const nextId = BigInt((campaigns.data?.length ?? 0) + 1)

  return (
    <Section
      icon={Megaphone}
      title="Campaigns"
      desc="Time-boxed earn boosts — multipliers, flat bonuses, or quests. Pause, extend, or close them live."
      right={campaigns.data ? <SectionMeta>{campaigns.data.length}</SectionMeta> : undefined}
    >
      <div className="space-y-6">
        <Group
          title="Your campaigns"
          desc="Pause stops accrual instantly; close returns rent when the run ends."
        >
          {campaigns.isLoading ? (
            <div className="p-4">
              <Skeleton className="h-24" />
            </div>
          ) : campaigns.data && campaigns.data.length > 0 ? (
            campaigns.data.map((c) => {
              const live =
                c.active && !c.paused && Number(c.startsAt) <= now && now < Number(c.endsAt)
              return (
                <Row
                  key={c.address.toBase58()}
                  icon={Megaphone}
                  title={
                    <span className="flex items-center gap-2">
                      <span className="truncate">{c.name || `Campaign #${c.id}`}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                          live
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : c.paused
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {live ? 'live' : c.paused ? 'paused' : 'ended'}
                      </span>
                    </span>
                  }
                  desc={`${CAMPAIGN_KIND_LABEL[c.kind] ?? 'Campaign'}${c.kind === 0 ? ` ×${(c.multiplierBps / 10_000).toFixed(2)}` : ''} · ${c.participantCount} participants · until ${new Date(Number(c.endsAt) * 1000).toLocaleDateString()}${c.pointsBudget > 0n ? ` · budget ${fromRaw(c.pointsSpent)}/${fromRaw(c.pointsBudget)} pts` : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={busyKey === `cext-${c.id}` || !publicKey}
                      onClick={() =>
                        publicKey &&
                        run(`cext-${c.id}`, 'Extend campaign +7d', [
                          updateCampaignIx({
                            authority: publicKey,
                            merchant: merchantPda,
                            campaign: c.address,
                            endsAt: c.endsAt + 7n * 86_400n,
                          }),
                        ])
                      }
                      className="rounded-lg border border-border px-2.5 py-1 text-muted-foreground text-xs transition-colors hover:border-flame/40 hover:text-flame disabled:opacity-50"
                    >
                      {busyKey === `cext-${c.id}` ? '…' : '+7d'}
                    </button>
                    <button
                      type="button"
                      disabled={busyKey === `cpause-${c.id}` || !publicKey}
                      onClick={() =>
                        publicKey &&
                        run(`cpause-${c.id}`, c.paused ? 'Resume campaign' : 'Pause campaign', [
                          updateCampaignIx({
                            authority: publicKey,
                            merchant: merchantPda,
                            campaign: c.address,
                            paused: !c.paused,
                          }),
                        ])
                      }
                      className="rounded-lg border border-border px-2.5 py-1 text-muted-foreground text-xs transition-colors hover:border-flame/40 hover:text-flame disabled:opacity-50"
                    >
                      {busyKey === `cpause-${c.id}` ? '…' : c.paused ? 'Resume' : 'Pause'}
                    </button>
                    <button
                      type="button"
                      disabled={busyKey === `cclose-${c.id}` || !publicKey}
                      onClick={() =>
                        publicKey &&
                        run(`cclose-${c.id}`, `Close campaign #${c.id}`, [
                          closeCampaignIx(publicKey, merchantPda, c.id),
                        ])
                      }
                      className="rounded-lg border border-border px-2.5 py-1 text-muted-foreground text-xs transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
                    >
                      {busyKey === `cclose-${c.id}` ? '…' : 'Close'}
                    </button>
                  </div>
                </Row>
              )
            })
          ) : (
            <div className="px-4 py-6 text-center text-muted-foreground text-sm">
              No campaigns yet — launch the first below.
            </div>
          )}
        </Group>

        <div className="max-w-xl">
          <ActionPanel
            title="Launch a campaign"
            description="A multiplier boosts every earn, a flat bonus pays per visit, a quest pays out on the Nth visit."
            cta="Create campaign"
            disabled={!ready}
            run={async ({ wallet, connection, send }) => {
              if (!wallet.publicKey) throw new Error('Connect a wallet')
              const nowSec = BigInt(Math.floor(Date.now() / 1000))
              return send(connection, wallet, [
                createCampaignIx({
                  authority: wallet.publicKey,
                  merchant: merchantPda,
                  id: nextId,
                  args: {
                    kind,
                    multiplierBps: kind === CAMPAIGN_KIND.MULTIPLIER ? bps : 0,
                    flatBonus: kind === CAMPAIGN_KIND.FLAT_BONUS ? raw(flat) : 0n,
                    questTarget:
                      kind === CAMPAIGN_KIND.QUEST ? Number.parseInt(questTarget, 10) || 0 : 0,
                    questReward: kind === CAMPAIGN_KIND.QUEST ? raw(questReward) : 0n,
                    minSpendBase: BigInt(Math.max(0, Math.round(Number(minSpend) || 0))),
                    minTier,
                    pointsBudget: raw(budget),
                    perCustomerCap: raw(perCap),
                    startsAt: nowSec - 60n,
                    endsAt: nowSec + BigInt(dayNum) * 86_400n,
                    name: name.trim(),
                  },
                }),
              ])
            }}
          >
            <TextField
              label="Campaign name"
              value={name}
              onChange={setName}
              placeholder="Summer boost"
            />
            <SelectField
              label="Kind"
              value={kind}
              onChange={setKind}
              options={CAMPAIGN_KIND_LABEL.map((label, value) => ({ value, label }))}
            />
            {kind === CAMPAIGN_KIND.MULTIPLIER ? (
              <AmountField
                label="Multiplier"
                value={multiplier}
                onChange={setMultiplier}
                suffix="×"
              />
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
                <AmountField
                  label="Reward on completion"
                  value={questReward}
                  onChange={setQuestReward}
                />
              </>
            ) : null}
            <AmountField label="Duration" value={days} onChange={setDays} suffix="days" />
            <div className="grid grid-cols-2 gap-3">
              <AmountField label="Points budget (0=∞)" value={budget} onChange={setBudget} />
              <AmountField label="Per-customer cap (0=∞)" value={perCap} onChange={setPerCap} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Min tier"
                value={minTier}
                onChange={setMinTier}
                options={[
                  { value: 0, label: 'Any' },
                  { value: 1, label: 'Silver+' },
                  { value: 2, label: 'Gold+' },
                  { value: 3, label: 'Platinum' },
                ]}
              />
              <AmountField
                label="Min spend (base)"
                value={minSpend}
                onChange={setMinSpend}
                suffix="base"
              />
            </div>
          </ActionPanel>
        </div>
      </div>
    </Section>
  )
}

// ── alliance ──────────────────────────────────────────────────────────────────

function AllianceTab({ merchant, merchantPda }: { merchant: Merchant; merchantPda: PublicKey }) {
  if (merchant.joinedAlliance) {
    return <AllianceManagement alliance={merchant.joinedAlliance} merchantPda={merchantPda} />
  }
  return <FoundAlliance merchantPda={merchantPda} />
}

function FoundAlliance({ merchantPda }: { merchantPda: PublicKey }) {
  const [name, setName] = useState('')
  const ready = name.trim().length > 0 && name.length <= 32

  return (
    <Section
      icon={Users}
      title="Alliance"
      desc="Found a koinon alliance so customers can swap your points with partner brands at governed rates."
    >
      <div className="max-w-lg">
        <ActionPanel
          title="Found an alliance"
          description="Creates the alliance and joins your merchant in one transaction."
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
    </Section>
  )
}

function AllianceManagement({
  alliance,
  merchantPda,
}: {
  alliance: PublicKey
  merchantPda: PublicKey
}) {
  const { publicKey } = useWallet()
  const alliances = useAlliances()
  const info = alliances.data?.find((a) => a.address.equals(alliance)) ?? null
  const isGovernor = !!publicKey && !!info && info.authority.equals(publicKey)
  const [rate, setRate] = useState('')
  const [budget, setBudget] = useState('')
  const rateBps = Math.round(Number(rate) * 100)
  const budgetRaw = raw(budget)

  return (
    <Section
      icon={Users}
      title="Alliance"
      desc="Tune how your points trade against the alliance unit, and your daily inbound exposure."
      right={
        <SectionMeta>
          {alliance.toBase58().slice(0, 4)}…{alliance.toBase58().slice(-4)}
        </SectionMeta>
      }
    >
      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        <ActionPanel
          title="Set swap rate"
          description="Your points' rate to the alliance unit — needs the alliance authority co-sign (you, if self-founded)."
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
          description="Daily cap on points others can swap into — your chosen exposure to partner economies."
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
          description="Membership closes and rent returns; customers can no longer swap into your points."
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

      {info ? (
        <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
          <Group
            title={`Alliance · ${info.name || 'unnamed'}`}
            desc="Read live from the alliance account."
            right={
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] ${info.paused ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}
              >
                {info.paused ? 'Paused' : 'Live'}
              </span>
            }
          >
            <DataRow label="Members" value={String(info.memberCount)} />
            <DataRow label="Swap fee" value={`${info.feeBps / 100}%`} />
            <DataRow
              label="Rate bounds"
              value={`${info.minRateBps / 100}% – ${info.maxRateBps / 100}%`}
            />
            <DataRow label="Total swaps" value={fmtCount(info.totalSwaps)} />
            <DataRow label="UI volume" value={fmtPoints(info.totalUiVolume)} />
          </Group>

          {isGovernor ? <AllianceGovernance info={info} /> : null}
        </div>
      ) : null}
    </Section>
  )
}

/** Governance panel — only the alliance authority sees these controls. */
function AllianceGovernance({ info }: { info: Alliance }) {
  const { run, busyKey } = useSign()
  const { publicKey } = useWallet()
  const [fee, setFee] = useState(String(info.feeBps / 100))
  const [minR, setMinR] = useState(String(info.minRateBps / 100))
  const [maxR, setMaxR] = useState(String(info.maxRateBps / 100))

  return (
    <Group title="Governance" desc="You are the alliance authority — these apply to every member.">
      <Row
        icon={info.paused ? Play : Pause}
        title={info.paused ? 'Resume alliance' : 'Pause alliance'}
        desc="Halts all cross-brand swaps while paused."
      >
        <Button
          size="sm"
          variant="outline"
          className="border-line-strong"
          disabled={busyKey === 'apause' || !publicKey}
          onClick={() =>
            publicKey &&
            run('apause', info.paused ? 'Resume alliance' : 'Pause alliance', [
              setAlliancePausedIx(publicKey, info.address, !info.paused),
            ])
          }
        >
          {busyKey === 'apause' ? '…' : info.paused ? 'Resume' : 'Pause'}
        </Button>
      </Row>
      <FieldRow label="Swap fee (%)" desc="Charged on every swap, burned from the out-leg.">
        <Input
          value={fee}
          inputMode="decimal"
          onChange={(e) => setFee(e.target.value.replace(/[^0-9.]/g, ''))}
        />
      </FieldRow>
      <FieldRow
        label="Rate bounds (min % – max %)"
        desc="Members must set their swap rate inside these bounds."
      >
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={minR}
            inputMode="decimal"
            onChange={(e) => setMinR(e.target.value.replace(/[^0-9.]/g, ''))}
          />
          <Input
            value={maxR}
            inputMode="decimal"
            onChange={(e) => setMaxR(e.target.value.replace(/[^0-9.]/g, ''))}
          />
        </div>
      </FieldRow>
      <div className="px-4 py-3">
        <Button
          size="sm"
          disabled={busyKey === 'aparams' || !publicKey}
          onClick={() =>
            publicKey &&
            run('aparams', 'Update alliance params', [
              setAllianceParamsIx({
                authority: publicKey,
                alliance: info.address,
                feeBps: Math.round(Number(fee) * 100),
                minRateBps: Math.round(Number(minR) * 100),
                maxRateBps: Math.round(Number(maxR) * 100),
              }),
            ])
          }
        >
          {busyKey === 'aparams' ? '…' : 'Save params'}
        </Button>
      </div>
    </Group>
  )
}

// ── token & guard ─────────────────────────────────────────────────────────────

function TokenGuardTab({ merchant, merchantPda }: { merchant: Merchant; merchantPda: PublicKey }) {
  const mint = merchant.pointMint
  const guard = useGuardConfig(mint)
  const { run, busyKey } = useSign()
  const { publicKey } = useWallet()

  const [decay, setDecay] = useState(String(-merchant.decayRateBps / 100))
  const [metaKind, setMetaKind] = useState<number>(2)
  const [metaValue, setMetaValue] = useState('')
  const [attrKey, setAttrKey] = useState('')
  const [attrValue, setAttrValue] = useState('')

  return (
    <div className="space-y-8">
      <Section icon={Coins} title="Token" desc="The Token-2022 mint your points live on.">
        <div className="grid items-start gap-4 lg:grid-cols-3">
          <ActionPanel
            title="Retune decay rate"
            description="How fast unspent points cool — the living heart of the token."
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
            title="Update metadata"
            description="Edit the on-chain name, symbol, or URI wallets and explorers read."
            cta="Update metadata"
            disabled={metaValue.trim() === ''}
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

          <ActionPanel
            title="Set custom attribute"
            description="Attach an arbitrary key/value to the token's on-chain metadata — tiers, perks, anything."
            cta="Set attribute"
            disabled={attrKey.trim() === '' || attrValue.trim() === ''}
            run={async ({ wallet, connection, send }) => {
              if (!wallet.publicKey) throw new Error('Connect a wallet')
              return send(connection, wallet, [
                setTokenAttributeIx({
                  authority: wallet.publicKey,
                  merchant: merchantPda,
                  mint,
                  key: attrKey.trim(),
                  value: attrValue.trim(),
                }),
              ])
            }}
          >
            <TextField
              label="Key"
              value={attrKey}
              onChange={setAttrKey}
              placeholder="tier_perk"
              mono
            />
            <TextField
              label="Value"
              value={attrValue}
              onChange={setAttrValue}
              placeholder="free espresso"
            />
          </ActionPanel>
        </div>
      </Section>

      <Section
        icon={ShieldCheck}
        title="Transfer guard"
        desc="The argus policy every peer transfer of your points must pass — read live from the chain."
      >
        {guard.isLoading ? (
          <Skeleton className="h-40" />
        ) : guard.data ? (
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <Group
              title="Live policy"
              right={
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${guard.data.paused ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}
                >
                  {guard.data.paused ? 'Paused' : 'Enforcing'}
                </span>
              }
            >
              <DataRow label="Daily gift cap" value={`${fromRaw(guard.data.dailyGiftCap)} pts`} />
              <DataRow
                label="Per-tx cap"
                value={
                  guard.data.perTxCap > 0n ? `${fromRaw(guard.data.perTxCap)} pts` : 'unlimited'
                }
              />
              <DataRow
                label="Max wallet balance"
                value={
                  guard.data.maxWalletBalance > 0n
                    ? `${fromRaw(guard.data.maxWalletBalance)} pts`
                    : 'unlimited'
                }
              />
              <DataRow
                label="Transfers / day"
                value={
                  guard.data.transfersPerDayCap > 0
                    ? String(guard.data.transfersPerDayCap)
                    : 'unlimited'
                }
                mono={false}
              />
              <DataRow
                label="Cooldown"
                value={guard.data.cooldownSecs > 0 ? `${guard.data.cooldownSecs}s` : 'none'}
                mono={false}
              />
              <DataRow
                label="Block program-owned"
                value={(guard.data.flags & GUARD_FLAG.BLOCK_PROGRAM_OWNED) !== 0 ? 'Yes' : 'No'}
                mono={false}
              />
              <DataRow
                label="Gifting"
                value={
                  (guard.data.flags & GUARD_FLAG.GIFTING_DISABLED) !== 0 ? 'Disabled' : 'Enabled'
                }
                mono={false}
              />
              <Row
                icon={guard.data.paused ? Play : Pause}
                title={guard.data.paused ? 'Resume transfers' : 'Pause transfers'}
                desc="Freezes every peer transfer of the token while paused."
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="border-line-strong"
                  disabled={busyKey === 'gpause' || !publicKey}
                  onClick={() =>
                    publicKey &&
                    run('gpause', guard.data?.paused ? 'Resume guard' : 'Pause guard', [
                      setGuardPausedIx(publicKey, mint, !guard.data?.paused),
                    ])
                  }
                >
                  {busyKey === 'gpause' ? '…' : guard.data.paused ? 'Resume' : 'Pause'}
                </Button>
              </Row>
            </Group>

            <div className="space-y-4">
              <PolicyEditor mint={mint} guard={guard.data} />

              <ActionPanel
                title="Finalize guard"
                description="Permanently burns the hook authority — not even you can repoint the rules after this. The strongest trust signal."
                cta="Finalize (irreversible)"
                run={async ({ wallet, connection, send }) => {
                  if (!wallet.publicKey) throw new Error('Connect a wallet')
                  return send(connection, wallet, [
                    finalizeTransferGuardIx(wallet.publicKey, merchantPda, mint),
                  ])
                }}
              >
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <ShieldCheck className="size-4 text-flame" aria-hidden />
                  Irreversible
                </div>
              </ActionPanel>
            </div>
          </div>
        ) : (
          <div className="max-w-lg">
            <ActionPanel
              title="Initialize transfer guard"
              description="Creates the argus policy for your mint — required before customers can gift your points (transfers fail closed without it)."
              cta="Initialize guard"
              run={async ({ wallet, connection, send }) => {
                if (!wallet.publicKey) throw new Error('Connect a wallet')
                return send(connection, wallet, [
                  initializeTransferGuardIx({
                    authority: wallet.publicKey,
                    merchant: merchantPda,
                    mint,
                    policy: {
                      flags: GUARD_FLAG.BLOCK_PROGRAM_OWNED,
                      dailyGiftCap: BigInt(DEFAULT_DAILY_GIFT_CAP_RAW),
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
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <ShieldCheck className="size-4 text-flame" aria-hidden />
                Default: 500 pts/day gift cap, program-owned recipients blocked
              </div>
            </ActionPanel>
          </div>
        )}
      </Section>
    </div>
  )
}

/** Full argus policy editor — every knob the program exposes, prefilled live. */
function PolicyEditor({ mint, guard }: { mint: PublicKey; guard: GuardConfig }) {
  const [giftCap, setGiftCap] = useState(fromRaw(guard.dailyGiftCap))
  const [perTx, setPerTx] = useState(guard.perTxCap > 0n ? fromRaw(guard.perTxCap) : '0')
  const [maxBal, setMaxBal] = useState(
    guard.maxWalletBalance > 0n ? fromRaw(guard.maxWalletBalance) : '0',
  )
  const [perDay, setPerDay] = useState(String(guard.transfersPerDayCap))
  const [cooldown, setCooldown] = useState(String(guard.cooldownSecs))
  const [blockProgram, setBlockProgram] = useState(
    (guard.flags & GUARD_FLAG.BLOCK_PROGRAM_OWNED) !== 0,
  )
  const [noGifting, setNoGifting] = useState((guard.flags & GUARD_FLAG.GIFTING_DISABLED) !== 0)

  const optRaw = (v: string): bigint => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? BigInt(Math.round(n * 10 ** DECIMALS)) : 0n
  }
  const optInt = (v: string): number => {
    const n = Number.parseInt(v, 10)
    return Number.isFinite(n) && n > 0 ? n : 0
  }

  return (
    <ActionPanel
      title="Policy editor"
      description="Every knob argus enforces — zeros mean unlimited/none. Changes apply from the next transfer."
      cta="Update policy"
      disabled={optRaw(giftCap) <= 0n}
      run={async ({ wallet, connection, send }) => {
        if (!wallet.publicKey) throw new Error('Connect a wallet')
        const flags =
          (blockProgram ? GUARD_FLAG.BLOCK_PROGRAM_OWNED : 0) |
          (noGifting ? GUARD_FLAG.GIFTING_DISABLED : 0)
        return send(connection, wallet, [
          configurePolicyIx({
            authority: wallet.publicKey,
            mint,
            flags,
            dailyGiftCap: optRaw(giftCap),
            perTxCap: optRaw(perTx),
            maxWalletBalance: optRaw(maxBal),
            transfersPerDayCap: optInt(perDay),
            cooldownSecs: optInt(cooldown),
          }),
        ])
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <AmountField label="Daily gift cap" value={giftCap} onChange={setGiftCap} />
        <AmountField label="Per-tx cap (0=∞)" value={perTx} onChange={setPerTx} />
        <AmountField label="Max balance (0=∞)" value={maxBal} onChange={setMaxBal} />
        <AmountField label="Transfers/day (0=∞)" value={perDay} onChange={setPerDay} suffix="tx" />
      </div>
      <AmountField
        label="Cooldown between transfers (0=none)"
        value={cooldown}
        onChange={setCooldown}
        suffix="sec"
      />
      <label className="flex cursor-pointer items-center gap-2 text-muted-foreground text-sm">
        <input
          type="checkbox"
          checked={blockProgram}
          onChange={(e) => setBlockProgram(e.target.checked)}
          className="size-4 accent-flame"
        />
        Block program-owned recipients
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-muted-foreground text-sm">
        <input
          type="checkbox"
          checked={noGifting}
          onChange={(e) => setNoGifting(e.target.checked)}
          className="size-4 accent-flame"
        />
        Disable gifting entirely
      </label>
    </ActionPanel>
  )
}

// ── attestations (aegis issuer) ──────────────────────────────────────────────

export function AttestTab({ authority }: { authority: PublicKey }) {
  const issuer = useMyIssuer()

  if (issuer.isLoading) return <Skeleton className="h-40" />
  if (!issuer.data) return <RegisterIssuer />

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
    <Section
      icon={BadgeCheck}
      title="Attestations"
      desc="Become an aegis issuer to vouch for wallets — argus guards can then gate transfers on your attestations."
    >
      <div className="max-w-lg">
        <ActionPanel
          title="Become an issuer"
          description="Registers your aegis issuer account; you can then issue and revoke attestations."
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
    </Section>
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
    <Section
      icon={BadgeCheck}
      title="Attestations"
      desc={`Issuing as "${name}" — argus reads these at transfer time to enforce compliance policies.`}
      right={<SectionMeta>{fmtCount(issued)} issued</SectionMeta>}
    >
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ActionPanel
          title="Issue attestation"
          description="Vouch for a wallet under a schema — region, KYC tier, or age band."
          cta="Issue attestation"
          disabled={!isPubkey(subject)}
          run={async ({ wallet, connection, send }) => {
            if (!wallet.publicKey) throw new Error('Connect a wallet')
            const now = BigInt(Math.floor(Date.now() / 1000))
            const dayNum = Number.parseInt(days, 10) || 365
            // Commitment model: the claim itself never leaves this device — only
            // its sha256 commitment is written on-chain (GDPR-erasable).
            const claim = new TextEncoder().encode(`${schema}:${subject}:${value || 'attested'}`)
            const commitment = new Uint8Array(await crypto.subtle.digest('SHA-256', claim))
            return send(connection, wallet, [
              issueAttestationIx({
                signer: wallet.publicKey,
                issuer,
                subject: new PublicKey(subject),
                schemaId: BigInt(schema),
                commitment,
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
          <AmountField
            label="Claim (hashed locally — never on-chain)"
            value={value}
            onChange={setValue}
            suffix="#"
          />
          <AmountField label="Valid for" value={days} onChange={setDays} suffix="days" />
        </ActionPanel>

        <ActionPanel
          title="Revoke attestation"
          description="Immediately invalidates a wallet's attestation — argus fails closed from the next transfer."
          cta="Revoke"
          disabled={!isPubkey(revokeSubject)}
          run={async ({ wallet, connection, send }) => {
            if (!wallet.publicKey) throw new Error('Connect a wallet')
            return send(connection, wallet, [
              revokeAttestationIx({
                signer: wallet.publicKey,
                issuer,
                subject: new PublicKey(revokeSubject),
                schemaId: BigInt(schema),
                reasonCode: 1,
              }),
            ])
          }}
        >
          <AddressField label="Subject wallet" value={revokeSubject} onChange={setRevokeSubject} />
        </ActionPanel>
      </div>
    </Section>
  )
}

// ── advanced (operators, clawback, danger) ───────────────────────────────────

function AdvancedTab({ merchant, merchantPda }: { merchant: Merchant; merchantPda: PublicKey }) {
  const { run, busyKey } = useSign()
  const { publicKey } = useWallet()
  const [operator, setOperator] = useState('')
  const [cap, setCap] = useState(fromRaw(merchant.clawbackDailyCapRaw))
  const [clawCustomer, setClawCustomer] = useState('')
  const [clawAmount, setClawAmount] = useState('')
  const clawRaw = raw(clawAmount)

  return (
    <div className="space-y-8">
      <Section
        icon={Users}
        title="Operators"
        desc="Hot keys allowed to issue points and run day-to-day operations — the owner key keeps full control."
        right={<SectionMeta>{merchant.operators.length}/4</SectionMeta>}
      >
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Group title="Active operators">
            {merchant.operators.length > 0 ? (
              merchant.operators.map((o) => (
                <Row
                  key={o.toBase58()}
                  icon={Users}
                  title={
                    <span className="font-mono">{`${o.toBase58().slice(0, 8)}…${o.toBase58().slice(-8)}`}</span>
                  }
                >
                  <button
                    type="button"
                    disabled={busyKey === `op-${o.toBase58()}` || !publicKey}
                    onClick={() =>
                      publicKey &&
                      run(`op-${o.toBase58()}`, 'Remove operator', [
                        setMerchantOperatorIx(publicKey, merchantPda, o, false),
                      ])
                    }
                    className="rounded-lg border border-border px-2.5 py-1 text-muted-foreground text-xs transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
                  >
                    {busyKey === `op-${o.toBase58()}` ? '…' : 'Remove'}
                  </button>
                </Row>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                No operators yet.
              </div>
            )}
          </Group>

          <ActionPanel
            title="Add operator"
            description="Grant a key permission to issue points and operate campaigns."
            cta="Add operator"
            disabled={!isPubkey(operator)}
            run={async ({ wallet, connection, send }) => {
              if (!wallet.publicKey) throw new Error('Connect a wallet')
              return send(connection, wallet, [
                setMerchantOperatorIx(wallet.publicKey, merchantPda, new PublicKey(operator), true),
              ])
            }}
          >
            <AddressField label="Operator wallet" value={operator} onChange={setOperator} />
          </ActionPanel>
        </div>
      </Section>

      <Section
        icon={Undo2}
        title="Clawback"
        desc="Reclaim points to your treasury for refunds or fraud — public, reason-coded, audited by argus."
      >
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <ActionPanel
            title="Clawback points"
            description={`Lifetime clawed back: ${fmtPoints(merchant.lifetimeClawedBack)} pts across ${fmtCount(merchant.clawbackCount)} actions.`}
            cta="Clawback to treasury"
            disabled={!isPubkey(clawCustomer) || clawRaw <= 0n}
            run={async ({ wallet, connection, send }) => {
              if (!wallet.publicKey) throw new Error('Connect a wallet')
              return send(connection, wallet, [
                clawbackIx({
                  authority: wallet.publicKey,
                  merchant: merchantPda,
                  mint: merchant.pointMint,
                  treasuryOwner: merchant.authority,
                  customer: new PublicKey(clawCustomer),
                  amountRaw: clawRaw,
                  reasonCode: 1,
                }),
              ])
            }}
          >
            <AddressField label="Customer wallet" value={clawCustomer} onChange={setClawCustomer} />
            <AmountField label="Amount" value={clawAmount} onChange={setClawAmount} />
          </ActionPanel>

          <Group title="Self-imposed limits" desc="A public on-chain cap that reassures customers.">
            <DataRow
              label="Daily cap"
              value={
                merchant.clawbackDailyCapRaw > 0n
                  ? `${fromRaw(merchant.clawbackDailyCapRaw)} pts`
                  : 'unlimited'
              }
            />
            <FieldRow label="New daily cap (0 = unlimited)">
              <div className="flex gap-2">
                <Input
                  value={cap}
                  inputMode="decimal"
                  onChange={(e) => setCap(e.target.value.replace(/[^0-9.]/g, ''))}
                />
                <Button
                  size="sm"
                  className="shrink-0"
                  disabled={busyKey === 'cap' || !publicKey}
                  onClick={() =>
                    publicKey &&
                    run('cap', 'Set clawback cap', [
                      setClawbackCapIx(publicKey, merchantPda, raw(cap)),
                    ])
                  }
                >
                  Save
                </Button>
              </div>
            </FieldRow>
          </Group>
        </div>
      </Section>

      <Section
        icon={Trash2}
        title="Danger zone"
        desc="Irreversible actions live here — read twice."
      >
        <div className="max-w-lg overflow-hidden rounded-2xl border border-red-500/30">
          <ActionPanel
            title="Close merchant"
            description="Deletes this merchant and reclaims rent. Only possible when the point supply is zero — clear all outstanding points first."
            cta="Close merchant"
            run={async ({ wallet, connection, send }) => {
              if (!wallet.publicKey) throw new Error('Connect a wallet')
              return send(connection, wallet, [
                closeMerchantIx(wallet.publicKey, merchantPda, merchant.pointMint),
              ])
            }}
          >
            <div className="flex items-center gap-2 text-red-400/90 text-sm">
              <Trash2 className="size-4" aria-hidden />
              Irreversible — supply must be zero
            </div>
          </ActionPanel>
        </div>
      </Section>
    </div>
  )
}
