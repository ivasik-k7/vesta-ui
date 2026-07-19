import { createFileRoute } from '@tanstack/react-router'
import { Flame } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/app')({
  component: CustomerApp,
})

function CustomerApp() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-32 text-center">
      <Flame className="size-10 text-solana-green" aria-hidden />
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Customer app</h1>
      <p className="max-w-md text-muted-foreground">
        Loyalty wallet, live decay, streaks, badge showcase, and alliance swaps land here in phase
        5.
      </p>
      <Badge variant="outline">coming soon</Badge>
    </main>
  )
}
