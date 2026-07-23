import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Coins, Send } from 'lucide-react'
import { useState } from 'react'

import { GiftFlow } from '@/components/app/flows'
import { EmptySlate, Section } from '@/components/app/section'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useHoldings } from '@/lib/vesta/queries'

export const Route = createFileRoute('/app/gift')({
  validateSearch: (search: Record<string, unknown>): { mint?: string } =>
    typeof search.mint === 'string' ? { mint: search.mint } : {},
  component: GiftPage,
})

function GiftPage() {
  const { publicKey } = useWallet()
  const { mint } = Route.useSearch()
  const holdings = useHoldings()
  const items = holdings.data ?? []

  const initial = Math.max(
    0,
    items.findIndex((h) => h.merchant.pointMint.toBase58() === mint),
  )
  const [idx, setIdx] = useState(initial)
  const holding = items[idx] ?? items[0] ?? null

  return (
    <div>
      <PageHeader
        title="Gift points"
        sub="Send points from any brand you hold to another wallet. It's a Token-2022 transfer the argus guard validates live — within the daily cap, to a real wallet; over the cap, the chain refuses it."
      />

      {!publicKey ? (
        <ConnectPrompt message="Connect a devnet wallet to gift points." />
      ) : holdings.isLoading ? (
        <Skeleton className="h-64" />
      ) : items.length === 0 ? (
        <EmptySlate icon={Coins}>
          No points to gift yet. Earn some from a brand in{' '}
          <Link to="/app/discover" className="text-flame hover:text-flame-hover">
            Discover
          </Link>{' '}
          first.
        </EmptySlate>
      ) : (
        <Section
          icon={Send}
          title="Send a gift"
          desc="Pick which brand's points to send, then a recipient and amount."
        >
          <div className="max-w-xl space-y-4">
            <Field label="Brand">
              <Select
                value={idx}
                onChange={setIdx}
                options={items.map((h, i) => ({ value: i, label: h.merchant.name }))}
                aria-label="Brand"
              />
            </Field>
            {holding ? (
              <GiftFlow key={holding.merchant.pointMint.toBase58()} holding={holding} />
            ) : null}
          </div>
        </Section>
      )}
    </div>
  )
}
