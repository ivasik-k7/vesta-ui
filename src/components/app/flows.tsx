import { PublicKey } from '@solana/web3.js'
import { Link } from '@tanstack/react-router'
import { BadgeCheck, Lock } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ActionPanel, AddressField, AmountField, isPubkey } from '@/components/app/action-panel'
import { AEGIS_SCHEMA, DECIMALS } from '@/lib/vesta/constants'
import type { CustomerEligibility, MerchantSegments, Offer } from '@/lib/vesta/decode'
import { giftIxns, redeemOfferIx, swapPointsIx } from '@/lib/vesta/ixns'
import { pdas } from '@/lib/vesta/pda'
import type { Holding } from '@/lib/vesta/queries'

function schemaLabel(schemaId: bigint): string {
  const n = Number(schemaId)
  if (n === AEGIS_SCHEMA.REGION) return 'verified region'
  if (n === AEGIS_SCHEMA.KYC_TIER) return 'KYC tier'
  if (n === AEGIS_SCHEMA.AGE_BAND) return 'age band'
  return `schema ${n}`
}

const toRaw = (ui: string): bigint => {
  const n = Number(ui)
  if (!Number.isFinite(n) || n <= 0) return 0n
  return BigInt(Math.round(n * 10 ** DECIMALS))
}

export function GiftFlow({ holding }: { holding: Holding }) {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const raw = toRaw(amount)
  const ready = isPubkey(to) && to !== '' && raw > 0n

  return (
    <ActionPanel
      title={`Gift ${holding.merchant.name} points`}
      description="A hooked transfer the argus guard validates live — within the 500 pt/day cap, to a real wallet. Over the cap, the chain refuses it."
      cta="Sign & gift"
      disabled={!ready}
      run={async ({ connection, wallet, send }) => {
        if (!wallet.publicKey) throw new Error('Connect a wallet')
        const owner = wallet.publicKey
        const recipient = new PublicKey(to)
        const state = pdas.walletState(holding.merchant.pointMint, owner)
        const stateExists = await connection.getAccountInfo(state)
        const ixns = giftIxns({
          from: owner,
          to: recipient,
          mint: holding.merchant.pointMint,
          merchantAuthority: holding.merchant.authority,
          rawAmount: raw,
          ensureWalletState: !stateExists,
          ensureDestAta: true,
        })
        return send(connection, wallet, ixns)
      }}
    >
      <AddressField
        label="Friend's wallet"
        value={to}
        onChange={setTo}
        placeholder="Recipient address"
      />
      <AmountField label="Amount" value={amount} onChange={setAmount} />
    </ActionPanel>
  )
}

export function RedeemFlow({
  holding,
  offer,
  redemptionIndex,
  segments,
  eligibility,
}: {
  holding: Holding
  offer: Offer
  redemptionIndex: number
  segments?: MerchantSegments | null
  eligibility?: CustomerEligibility | null
}) {
  const priceUi = (Number(offer.pricePoints) / 10 ** DECIMALS).toFixed(2)
  // Generous slippage headroom (2x) so intra-second decay never trips it.
  const maxRaw = offer.pricePoints * 2n

  // Verified-segment gate (spec 12): required_segment is 1-based; 0 = open.
  const gated = offer.requiredSegment > 0
  const segIdx = offer.requiredSegment - 1
  const seg = gated ? (segments?.segments[segIdx] ?? null) : null
  const satisfied =
    !gated ||
    (!!eligibility &&
      !!segments &&
      eligibility.policyEpoch === segments.policyEpoch &&
      Number(eligibility.expiresAt) > Date.now() / 1000 &&
      (eligibility.verdicts & (1 << segIdx)) !== 0)

  return (
    <ActionPanel
      title={`Redeem offer #${offer.id.toString()}`}
      description={`Burn ~${priceUi} pts (priced in decayed value, converted on-chain) for this reward.`}
      cta={satisfied ? `Redeem for ${priceUi} pts` : 'Verified access required'}
      disabled={!satisfied}
      run={async ({ connection, wallet, send }) => {
        if (!wallet.publicKey) throw new Error('Connect a wallet')
        const ix = redeemOfferIx({
          customer: wallet.publicKey,
          merchant: holding.merchant.address,
          mint: holding.merchant.pointMint,
          offerId: offer.id,
          redemptionIndex,
          maxRawAmount: maxRaw,
          withEligibility: gated,
        })
        return send(connection, wallet, [ix])
      }}
    >
      {gated ? (
        satisfied ? (
          <p className="flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.05] px-3 py-2 text-emerald-400 text-xs">
            <BadgeCheck className="size-3.5 shrink-0" aria-hidden />
            Verified access unlocked — you satisfy the{' '}
            {seg ? schemaLabel(seg.schemaId) : 'required'} segment.
          </p>
        ) : (
          <div className="rounded-lg border border-border bg-background/50 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Lock className="size-3.5 shrink-0 text-flame" aria-hidden />
              Gated to the {seg ? schemaLabel(seg.schemaId) : `#${offer.requiredSegment}`} segment.
            </p>
            <Link
              to="/app/verify"
              className="mt-1.5 inline-block font-mono text-[11px] text-flame hover:text-flame-hover"
            >
              Prove it privately in Verify →
            </Link>
          </div>
        )
      ) : null}
    </ActionPanel>
  )
}

export function SwapFlow({ holdings }: { holdings: Holding[] }) {
  const [fromIdx, setFromIdx] = useState(0)
  const [toIdx, setToIdx] = useState(1)
  const [amount, setAmount] = useState('')
  const from = holdings[fromIdx]
  const to = holdings[toIdx]
  const uiAmount = toRaw(amount)

  const alliance = useMemo(() => {
    if (!from?.merchant.joinedAlliance || !to?.merchant.joinedAlliance) return null
    return from.merchant.joinedAlliance.equals(to.merchant.joinedAlliance)
      ? from.merchant.joinedAlliance
      : null
  }, [from, to])

  const ready = !!from && !!to && fromIdx !== toIdx && uiAmount > 0n && !!alliance

  return (
    <ActionPanel
      title="Swap across the alliance"
      description={
        alliance
          ? 'Trade one merchant’s points for another’s. Priced in UI value on both legs, so mint age never leaks an edge.'
          : 'Both merchants must belong to the same koinon alliance to swap.'
      }
      cta="Sign & swap"
      disabled={!ready}
      run={async ({ connection, wallet, send }) => {
        if (!wallet.publicKey || !from || !to || !alliance) throw new Error('Not ready')
        const ix = swapPointsIx({
          customer: wallet.publicKey,
          alliance,
          merchantA: from.merchant.address,
          merchantB: to.merchant.address,
          mintA: from.merchant.pointMint,
          mintB: to.merchant.pointMint,
          uiAmount,
          maxRawIn: uiAmount * 3n,
          minRawOut: 1n,
        })
        return send(connection, wallet, [ix])
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <MerchantSelect label="From" holdings={holdings} value={fromIdx} onChange={setFromIdx} />
        <MerchantSelect label="To" holdings={holdings} value={toIdx} onChange={setToIdx} />
      </div>
      <AmountField label="Amount (UI points)" value={amount} onChange={setAmount} />
    </ActionPanel>
  )
}

function MerchantSelect({
  label,
  holdings,
  value,
  onChange,
}: {
  label: string
  holdings: Holding[]
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <span className="font-medium font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm shadow-inner outline-none transition-colors focus:border-flame/60"
      >
        {holdings.map((h, i) => (
          <option key={h.merchant.address.toBase58()} value={i}>
            {h.merchant.name}
          </option>
        ))}
      </select>
    </label>
  )
}
