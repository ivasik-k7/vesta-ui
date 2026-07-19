import { createFileRoute } from '@tanstack/react-router'
import { Flame } from 'lucide-react'

export const Route = createFileRoute('/app')({
  component: CustomerApp,
})

function CustomerApp() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-32 text-center">
      <Flame className="size-10 text-solana-green" aria-hidden />
      <h1 className="font-heading font-semibold text-3xl tracking-tight">Customer app</h1>
      <p className="max-w-md text-muted-foreground">
        Loyalty wallet, live decay, streaks, badge showcase, and alliance swaps land here next.
      </p>
      <p className="font-mono text-[11px] text-muted-foreground/70 uppercase tracking-[0.25em]">
        in development · phase 5
      </p>
    </main>
  )
}
