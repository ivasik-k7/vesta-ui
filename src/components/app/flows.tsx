import { PublicKey } from '@solana/web3.js'
import { useMemo, useState } from 'react'

import { ActionPanel, AddressField, AmountField, isPubkey } from '@/components/app/action-panel'
import { DECIMALS } from '@/lib/vesta/constants'
import type { Offer } from '@/lib/vesta/decode'
import { giftIxns, redeemOfferIx, swapPointsIx } from '@/lib/vesta/ixns'
import { pdas } from '@/lib/vesta/pda'
import type { Holding } from '@/lib/vesta/queries'

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
        const ledger = pdas.giftLedger(holding.merchant.pointMint, owner)
        const ledgerExists = await connection.getAccountInfo(ledger)
        const ixns = giftIxns({
          from: owner,
          to: recipient,
          mint: holding.merchant.pointMint,
          merchant: holding.merchant.authority,
          rawAmount: raw,
          ensureLedger: !ledgerExists,
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
}: {
  holding: Holding
  offer: Offer
  redemptionIndex: number
}) {
  const priceUi = (Number(offer.pricePoints) / 10 ** DECIMALS).toFixed(2)
  // Generous slippage headroom (2x) so intra-second decay never trips it.
  const maxRaw = offer.pricePoints * 2n

  return (
    <ActionPanel
      title={`Redeem offer #${offer.id.toString()}`}
      description={`Burn ~${priceUi} pts (priced in decayed value, converted on-chain) for this reward.`}
      cta={`Redeem for ${priceUi} pts`}
      run={async ({ connection, wallet, send }) => {
        if (!wallet.publicKey) throw new Error('Connect a wallet')
        const ix = redeemOfferIx({
          customer: wallet.publicKey,
          merchant: holding.merchant.address,
          mint: holding.merchant.pointMint,
          offerId: offer.id,
          redemptionIndex,
          maxRawAmount: maxRaw,
        })
        return send(connection, wallet, [ix])
      }}
    />
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
      <span className="text-muted-foreground text-xs">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-flame/60"
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
