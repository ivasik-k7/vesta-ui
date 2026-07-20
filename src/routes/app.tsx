import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute } from '@tanstack/react-router'
import { Flame, Wallet } from 'lucide-react'
import { FlameBalanceCard } from '@/components/app/flame-balance'
import { GiftFlow, SwapFlow } from '@/components/app/flows'
import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'
import { ConnectButton } from '@/components/wallet/connect-button'
import { useHoldings } from '@/lib/vesta/queries'

export const Route = createFileRoute('/app')({
  component: CustomerApp,
})

function CustomerApp() {
  const { publicKey } = useWallet()
  const holdings = useHoldings()

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
      <SectionHeader
        kicker="Customer app · live on devnet"
        title="Your loyalty"
        emphasis="wallet"
        sub="Real balances read from the chain, cooling in real time against each mint's InterestBearingConfig. Connect a devnet wallet to see your flames."
      />

      {!publicKey ? (
        <Reveal delay={0.08} className="mt-12">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border border-dashed bg-card/40 p-12 text-center">
            <Wallet className="size-8 text-flame" aria-hidden />
            <p className="max-w-sm text-muted-foreground">
              Connect a Phantom, Solflare, or Backpack wallet on devnet to load your points, gift,
              swap, and redeem.
            </p>
            <ConnectButton size="lg" />
          </div>
        </Reveal>
      ) : (
        <div className="mt-12 space-y-12">
          <section>
            {holdings.isLoading ? (
              <p className="text-muted-foreground text-sm">Reading balances…</p>
            ) : holdings.data && holdings.data.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {holdings.data.map((h) => (
                  <FlameBalanceCard key={h.merchant.address.toBase58()} holding={h} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-border border-dashed bg-card/40 p-10 text-center">
                <Flame className="size-7 text-muted-foreground/50" aria-hidden />
                <p className="max-w-sm text-muted-foreground text-sm">
                  No points yet. A merchant earns them to you at the counter — this wallet holds
                  none of the demo mints. Try the merchant directory to see live programs.
                </p>
              </div>
            )}
          </section>

          {holdings.data && holdings.data[0] ? (
            <section className="grid gap-4 md:grid-cols-2">
              <GiftFlow holding={holdings.data[0]} />
              {holdings.data.length > 1 ? (
                <SwapFlow holdings={holdings.data} />
              ) : (
                <div className="rounded-2xl border border-border border-dashed bg-card/40 p-6 text-muted-foreground text-sm">
                  Hold points from two alliance merchants to unlock cross-merchant swaps.
                </div>
              )}
            </section>
          ) : null}
        </div>
      )}
    </main>
  )
}
