import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeftRight, Handshake } from 'lucide-react'

import { SwapFlow } from '@/components/app/flows'
import { EmptySlate, Section } from '@/components/app/section'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { Skeleton } from '@/components/ui/skeleton'
import { useHoldings } from '@/lib/vesta/queries'

export const Route = createFileRoute('/app/swap')({
  component: SwapPage,
})

function SwapPage() {
  const { publicKey } = useWallet()
  const holdings = useHoldings()
  const items = holdings.data ?? []

  return (
    <div>
      <PageHeader
        title="Swap"
        sub="Trade one brand's points for another's across a koinon alliance. Both legs are priced in UI value, so mint age never leaks an edge — a fair, on-chain exchange."
      />

      {!publicKey ? (
        <ConnectPrompt message="Connect a devnet wallet to swap points across an alliance." />
      ) : holdings.isLoading ? (
        <Skeleton className="h-64" />
      ) : items.length < 2 ? (
        <EmptySlate icon={Handshake}>
          Swapping needs points in at least two brands that share an alliance. Earn with more brands
          from{' '}
          <Link to="/app/discover" className="text-flame hover:text-flame-hover">
            Discover
          </Link>
          , then come back to trade.
        </EmptySlate>
      ) : (
        <Section
          icon={ArrowLeftRight}
          title="Cross-brand swap"
          desc="Pick two brands in the same alliance and an amount — the koinon rails settle it in one signed transaction."
        >
          <div className="max-w-xl">
            <SwapFlow holdings={items} />
          </div>
        </Section>
      )}
    </div>
  )
}
