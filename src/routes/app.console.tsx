import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight, CheckCircle2, Store } from 'lucide-react'
import { useState } from 'react'

import { ActionPanel, AmountField } from '@/components/app/action-panel'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { DECIMALS } from '@/lib/vesta/constants'
import type { Merchant } from '@/lib/vesta/decode'
import { createOfferIx, registerMerchantIx } from '@/lib/vesta/ixns'
import { useMyMerchant, useOffers } from '@/lib/vesta/queries'

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
                  className="flex items-center justify-between font-mono text-sm"
                >
                  <span className="text-muted-foreground">#{o.id.toString()}</span>
                  <span>{(Number(o.pricePoints) / 10 ** DECIMALS).toFixed(2)} pts</span>
                  <span className="text-muted-foreground text-xs">{o.supplyRemaining} left</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-muted-foreground text-sm">No offers yet.</p>
          )}
        </div>
      </div>
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
