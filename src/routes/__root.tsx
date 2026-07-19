import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { ArrowUpRight, Flame } from 'lucide-react'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-border/40 border-b bg-background/70 backdrop-blur-md">
        <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            <Flame className="size-5 text-solana-green" aria-hidden />
            VESTA
          </Link>
          <div className="flex items-center gap-6 text-sm">
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
            <a
              href="https://github.com/ivasik-k7/vesta-core"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              GitHub
              <ArrowUpRight
                className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </a>
          </div>
        </nav>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="border-border/40 border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-2 px-4 py-8 font-mono text-muted-foreground text-xs sm:flex-row sm:items-center">
          <span>VESTA — living loyalty protocol · devnet</span>
          <span>
            built on{' '}
            <span className="bg-clip-text bg-gradient-to-r from-solana-purple to-solana-green font-medium text-transparent">
              Solana
            </span>
          </span>
        </div>
      </footer>
    </div>
  )
}
