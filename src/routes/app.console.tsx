import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight, CheckCircle2, LogOut, Megaphone, Store } from 'lucide-react'
import { useState } from 'react'

import { ActionPanel, AddressField, AmountField, isPubkey } from '@/components/app/action-panel'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { DECIMALS } from '@/lib/vesta/constants'
import type { Merchant } from '@/lib/vesta/decode'
import {
  clawbackIx,
  closeCampaignIx,
  closeOfferIx,
  createAchievementIx,
  createAllianceIx,
  createCampaignIx,
  createOfferIx,
  finalizeTransferGuardIx,
  grantAchievementIx,
  initializeTransferGuardIx,
  joinOwnAllianceIx,
  leaveAllianceIx,
  registerMerchantIx,
  setSwapBudgetIx,
  setSwapRateIx,
} from '@/lib/vesta/ixns'
import { pdas } from '@/lib/vesta/pda'
import { useMyCampaigns, useMyMerchant, useOffers } from '@/lib/vesta/queries'
import { sendIxns } from '@/lib/vesta/tx'

export const Route = createFileRoute('/app/console')({
  component: ConsolePage,
})

function ConsolePage() {
  const { publicKey } = useWallet()
  const myMerchant = useMyMerchant()

  return (
    <div>
      <PageHeader
        title="Merchant console"
        sub="Run your own loyalty program. Registering mints a Token-2022 point token with decay, a transfer guard, and a clawback delegate — one signed transaction."
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

function RegisterMerchant() {
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const ready =
    name.trim().length > 0 && name.length <= 32 && symbol.length > 0 && symbol.length <= 10

  return (
    <div className="max-w-lg">
      <ActionPanel
        title="Register your merchant"
        description="Creates your point mint (−20%/yr decay), treasury, and the argus transfer guard. You become the mint authority via a program PDA."
        cta="Register merchant"
        disabled={!ready}
        run={async ({ wallet, connection, send }) => {
          if (!wallet.publicKey) throw new Error('Connect a wallet')
          const ix = registerMerchantIx({
            authority: wallet.publicKey,
            name: name.trim(),
            symbol: symbol.trim().toUpperCase(),
            uri: 'https://dev-vesta.netlify.app/points.json',
            decayRateBps: -2000,
            baseEarnRate: 100n,
          })
          return send(connection, wallet, [ix])
        }}
      >
        <label className="block">
          <span className="text-muted-foreground text-xs">Brand name (≤32)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kavarna"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-flame/60"
          />
        </label>
        <label className="block">
          <span className="text-muted-foreground text-xs">Symbol (≤10)</span>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="KAV"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm uppercase outline-none focus:border-flame/60"
          />
        </label>
      </ActionPanel>
    </div>
  )
}

function ManageMerchant({ merchant }: { merchant: Merchant }) {
  const offers = useOffers(merchant.address)
  const [price, setPrice] = useState('')
  const [supply, setSupply] = useState('')
  const nextId = BigInt((offers.data?.length ?? 0) + 1)
  const priceRaw = (() => {
    const n = Number(price)
    return Number.isFinite(n) && n > 0 ? BigInt(Math.round(n * 10 ** DECIMALS)) : 0n
  })()
  const supplyNum = Number.parseInt(supply, 10)
  const ready = priceRaw > 0n && Number.isFinite(supplyNum) && supplyNum > 0

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-flame/40 bg-card p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-flame" aria-hidden />
          <p className="font-heading font-semibold text-lg">{merchant.name}</p>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Decay rate" value={`${merchant.decayRateBps / 100}%/yr`} />
          <Field label="Customers" value={merchant.customerCount.toString()} />
          <Field
            label="Lifetime issued"
            value={(Number(merchant.lifetimePointsIssued) / 10 ** DECIMALS).toFixed(0)}
          />
        </dl>
        <a
          href={`https://explorer.solana.com/address/${merchant.pointMint.toBase58()}?cluster=devnet`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1 font-mono text-flame text-sm hover:text-flame-hover"
        >
          point mint on explorer
          <ArrowUpRight className="size-3.5" aria-hidden />
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ActionPanel
          title="Create an offer"
          description={`Offer #${nextId.toString()} — priced in UI points, redeemable by your customers by burning decayed points.`}
          cta="Create offer"
          disabled={!ready}
          run={async ({ wallet, connection, send }) => {
            if (!wallet.publicKey) throw new Error('Connect a wallet')
            const ix = createOfferIx({
              authority: wallet.publicKey,
              id: nextId,
              pricePoints: priceRaw,
              supply: supplyNum,
            })
            return send(connection, wallet, [ix])
          }}
        >
          <AmountField label="Price" value={price} onChange={setPrice} />
          <AmountField label="Supply" value={supply} onChange={setSupply} suffix="units" />
        </ActionPanel>

        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="flex items-center gap-1.5 font-medium text-[13px] text-muted-foreground">
            <Store className="size-3.5" aria-hidden /> Your offers
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
                  <CloseOfferButton offerId={o.id} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-muted-foreground text-sm">No offers yet.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CampaignPanel campaignId={nextId} />
        <AlliancePanel authority={merchant.authority} joined={!!merchant.joinedAlliance} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AchievementPanel />
        <GrantBadgePanel />
      </div>

      <CampaignList merchant={merchant.address} />

      {merchant.joinedAlliance ? <AllianceManagement alliance={merchant.joinedAlliance} /> : null}

      <ClawbackPanel mint={merchant.pointMint} />

      <GuardPanel mint={merchant.pointMint} />
    </div>
  )
}

function AchievementPanel() {
  const [name, setName] = useState('')
  const [threshold, setThreshold] = useState('')
  const thresholdRaw = (() => {
    const n = Number(threshold)
    return Number.isFinite(n) && n > 0 ? BigInt(Math.round(n * 10 ** DECIMALS)) : 0n
  })()
  const ready = name.trim().length > 0 && name.length <= 32 && thresholdRaw > 0n

  return (
    <ActionPanel
      title="Define an achievement"
      description="A soulbound kleos badge customers earn at a lifetime-points threshold. Non-transferable — proof of devotion, gateable by any dApp."
      cta="Create achievement"
      disabled={!ready}
      run={async ({ wallet, connection, send }) => {
        if (!wallet.publicKey) throw new Error('Connect a wallet')
        const ix = createAchievementIx({
          authority: wallet.publicKey,
          id: BigInt(Date.now()),
          name: name.trim(),
          uri: 'https://dev-vesta.netlify.app/badge.json',
          thresholdLifetime: thresholdRaw,
        })
        return send(connection, wallet, [ix])
      }}
    >
      <label className="block">
        <span className="text-muted-foreground text-xs">Badge name (≤32)</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First Flame"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-flame/60"
        />
      </label>
      <AmountField label="Lifetime threshold" value={threshold} onChange={setThreshold} />
    </ActionPanel>
  )
}

function GrantBadgePanel() {
  const [achievementId, setAchievementId] = useState('')
  const [customer, setCustomer] = useState('')
  const ready = achievementId.trim().length > 0 && isPubkey(customer)

  return (
    <ActionPanel
      title="Grant a badge"
      description="Mint the soulbound badge to a customer who crossed the threshold. Paste the achievement id and the customer wallet."
      cta="Grant badge"
      disabled={!ready}
      run={async ({ wallet, connection, send }) => {
        if (!wallet.publicKey) throw new Error('Connect a wallet')
        const ix = grantAchievementIx({
          authority: wallet.publicKey,
          achievementId: BigInt(achievementId.trim()),
          customer: new PublicKey(customer),
        })
        return send(connection, wallet, [ix])
      }}
    >
      <label className="block">
        <span className="text-muted-foreground text-xs">Achievement id</span>
        <input
          value={achievementId}
          onChange={(e) => setAchievementId(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="1721476000000"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-flame/60"
        />
      </label>
      <AddressField label="Customer wallet" value={customer} onChange={setCustomer} />
    </ActionPanel>
  )
}

function CampaignList({ merchant }: { merchant: PublicKey }) {
  const campaigns = useMyCampaigns(merchant)
  const now = Date.now() / 1000
  if (!campaigns.data || campaigns.data.length === 0) return null
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="flex items-center gap-1.5 font-medium text-[13px] text-muted-foreground">
        <Megaphone className="size-3.5" aria-hidden /> Active campaigns
      </p>
      <ul className="mt-3 space-y-1.5">
        {campaigns.data.map((c) => {
          const live = c.active && Number(c.startsAt) <= now && now < Number(c.endsAt)
          return (
            <li
              key={c.address.toBase58()}
              className="flex items-center justify-between gap-3 font-mono text-sm"
            >
              <span className="text-muted-foreground">#{c.id.toString()}</span>
              <span>×{(c.multiplierBps / 10_000).toFixed(2)}</span>
              <span className={live ? 'text-flame text-xs' : 'text-muted-foreground/60 text-xs'}>
                {live ? 'live' : 'ended'}
              </span>
              <CloseCampaignButton campaignId={c.id} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function CloseCampaignButton({ campaignId }: { campaignId: bigint }) {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const wallet = useWallet()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  if (!publicKey) return null
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          await sendIxns(connection, wallet, [closeCampaignIx(publicKey, campaignId)])
          await queryClient.invalidateQueries()
        } finally {
          setBusy(false)
        }
      }}
      className="text-muted-foreground/60 text-xs transition-colors hover:text-red-400"
    >
      {busy ? '…' : 'close'}
    </button>
  )
}

function AllianceManagement({ alliance }: { alliance: PublicKey }) {
  const [rate, setRate] = useState('')
  const [budget, setBudget] = useState('')
  const rateBps = Math.round(Number(rate) * 100)
  const budgetRaw = (() => {
    const n = Number(budget)
    return Number.isFinite(n) && n > 0 ? BigInt(Math.round(n * 10 ** DECIMALS)) : 0n
  })()

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <ActionPanel
        title="Set swap rate"
        description="Update your points' rate to the alliance unit. Needs the alliance authority co-sign — here you're both (self-founded)."
        cta="Set rate"
        disabled={!(rateBps > 0)}
        run={async ({ wallet, connection, send }) => {
          if (!wallet.publicKey) throw new Error('Connect a wallet')
          return send(connection, wallet, [
            setSwapRateIx({
              authority: wallet.publicKey,
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
        description="Your daily cap on points others can mint into via swaps — your self-chosen exposure to partner economies."
        cta="Set budget"
        disabled={!(budgetRaw > 0n)}
        run={async ({ wallet, connection, send }) => {
          if (!wallet.publicKey) throw new Error('Connect a wallet')
          return send(connection, wallet, [
            setSwapBudgetIx({ authority: wallet.publicKey, alliance, newBudget: budgetRaw }),
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
          return send(connection, wallet, [leaveAllianceIx(wallet.publicKey, alliance)])
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

function ClawbackPanel({ mint }: { mint: PublicKey }) {
  const [customer, setCustomer] = useState('')
  const [amount, setAmount] = useState('')
  const amountRaw = (() => {
    const n = Number(amount)
    return Number.isFinite(n) && n > 0 ? BigInt(Math.round(n * 10 ** DECIMALS)) : 0n
  })()
  const ready = isPubkey(customer) && amountRaw > 0n

  return (
    <div className="max-w-lg">
      <ActionPanel
        title="Clawback"
        description="Reclaim points from a holder to your treasury for refunds or fraud. It's a hooked transfer — argus audits it, and it's a public, reason-coded transaction. Disclosed to customers by design."
        cta="Clawback to treasury"
        disabled={!ready}
        run={async ({ wallet, connection, send }) => {
          if (!wallet.publicKey) throw new Error('Connect a wallet')
          return send(connection, wallet, [
            clawbackIx({
              authority: wallet.publicKey,
              mint,
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
    </div>
  )
}

function GuardPanel({ mint }: { mint: PublicKey }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ActionPanel
        title="Initialize transfer guard"
        description="Creates the argus policy account for your mint. Required before customers can gift your points — without it, hooked transfers fail closed."
        cta="Initialize guard"
        run={async ({ wallet, connection, send }) => {
          if (!wallet.publicKey) throw new Error('Connect a wallet')
          return send(connection, wallet, [initializeTransferGuardIx(wallet.publicKey, mint)])
        }}
      />
      <ActionPanel
        title="Finalize guard (burn authority)"
        description="Permanently revokes the hook authority. After this, not even you can repoint the transfer rules — the strongest trust signal you can give customers."
        cta="Finalize guard"
        run={async ({ wallet, connection, send }) => {
          if (!wallet.publicKey) throw new Error('Connect a wallet')
          return send(connection, wallet, [finalizeTransferGuardIx(wallet.publicKey, mint)])
        }}
      />
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-0.5 font-mono">{value}</dd>
    </div>
  )
}

function CloseOfferButton({ offerId }: { offerId: bigint }) {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const wallet = useWallet()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  if (!publicKey) return null
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          await sendIxns(connection, wallet, [closeOfferIx(publicKey, offerId)])
          await queryClient.invalidateQueries()
        } finally {
          setBusy(false)
        }
      }}
      className="text-muted-foreground/60 text-xs transition-colors hover:text-red-400"
    >
      {busy ? '…' : 'close'}
    </button>
  )
}

function CampaignPanel({ campaignId }: { campaignId: bigint }) {
  const [multiplier, setMultiplier] = useState('')
  const [days, setDays] = useState('')
  const bps = Math.round(Number(multiplier) * 100)
  const dayNum = Number.parseInt(days, 10)
  const ready = bps > 0 && bps <= 20_000 && Number.isFinite(dayNum) && dayNum > 0

  return (
    <ActionPanel
      title="Launch a campaign"
      description="A time-boxed earn multiplier. Stacks with streaks under a hard ×2.4 cap. Enter the multiplier (e.g. 1.5) and how many days it runs."
      cta="Create campaign"
      disabled={!ready}
      run={async ({ wallet, connection, send }) => {
        if (!wallet.publicKey) throw new Error('Connect a wallet')
        const now = BigInt(Math.floor(Date.now() / 1000))
        const ix = createCampaignIx({
          authority: wallet.publicKey,
          id: campaignId,
          multiplierBps: bps,
          startsAt: now - 60n,
          endsAt: now + BigInt(dayNum) * 86_400n,
        })
        return send(connection, wallet, [ix])
      }}
    >
      <AmountField label="Multiplier" value={multiplier} onChange={setMultiplier} suffix="×" />
      <AmountField label="Duration" value={days} onChange={setDays} suffix="days" />
    </ActionPanel>
  )
}

function AlliancePanel({ authority, joined }: { authority: PublicKey; joined: boolean }) {
  const [name, setName] = useState('')
  const ready = name.trim().length > 0 && name.length <= 32 && !joined

  return (
    <ActionPanel
      title="Found an alliance"
      description={
        joined
          ? 'This merchant already belongs to an alliance. Customers can swap its points with any co-member.'
          : 'Create a koinon alliance and join it — customers will be able to swap your points with other members at governed rates.'
      }
      cta="Create & join alliance"
      disabled={!ready}
      run={async ({ wallet, connection, send }) => {
        if (!wallet.publicKey) throw new Error('Connect a wallet')
        const id = BigInt(Date.now())
        const alliance = pdas.alliance(wallet.publicKey, id)
        const create = createAllianceIx({ creator: wallet.publicKey, id, name: name.trim() })
        const join = joinOwnAllianceIx({
          authority: wallet.publicKey,
          alliance,
          rateBps: 10_000,
          swapInBudgetRaw: 1_000_000n,
        })
        return send(connection, wallet, [create, join])
      }}
    >
      {!joined ? (
        <label className="block">
          <span className="text-muted-foreground text-xs">Alliance name (≤32)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Koinon"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-flame/60"
          />
        </label>
      ) : null}
      <input type="hidden" value={authority.toBase58()} readOnly />
    </ActionPanel>
  )
}
