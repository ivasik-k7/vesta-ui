import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { Flame } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Flame className="size-5 text-solana-green" aria-hidden />
            VESTA
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              to="/app"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              App
            </Link>
            <Link
              to="/merchant"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Merchants
            </Link>
            <Badge variant="outline" className="border-solana-purple/50 text-solana-purple">
              devnet
            </Badge>
          </div>
        </nav>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="border-t border-border/40">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 text-xs text-muted-foreground">
          <span>VESTA — living loyalty protocol</span>
          <span>
            built on{' '}
            <span className="bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text font-medium text-transparent">
              Solana
            </span>
          </span>
        </div>
      </footer>
    </div>
  )
}
