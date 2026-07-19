import { createFileRoute } from '@tanstack/react-router'
import { Store } from 'lucide-react'

export const Route = createFileRoute('/merchant')({
  component: MerchantDashboard,
})

function MerchantDashboard() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-32 text-center">
      <Store className="size-10 text-flame" aria-hidden />
      <h1 className="font-heading font-semibold text-3xl tracking-tight">Merchant dashboard</h1>
      <p className="max-w-md text-muted-foreground">
        Two-minute onboarding, POS QR codes, campaigns, offers, and alliance management land here
        next.
      </p>
      <p className="font-medium text-[13px] text-muted-foreground/70">In development · phase 5</p>
    </main>
  )
}
