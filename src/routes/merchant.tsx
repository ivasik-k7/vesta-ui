import { createFileRoute } from '@tanstack/react-router'
import { Store } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/merchant')({
  component: MerchantDashboard,
})

function MerchantDashboard() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-32 text-center">
      <Store className="size-10 text-solana-purple" aria-hidden />
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Merchant dashboard</h1>
      <p className="max-w-md text-muted-foreground">
        Two-minute onboarding, POS QR codes, campaigns, offers, and alliance management land here in
        phase 5.
      </p>
      <Badge variant="outline">coming soon</Badge>
    </main>
  )
}
