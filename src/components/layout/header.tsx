import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Flame } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/app', label: 'App' },
  { to: '/merchant', label: 'Merchants' },
] as const

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-all duration-300',
        scrolled
          ? 'border-border/40 bg-background/70 backdrop-blur-md'
          : 'border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link to="/" className="group flex items-center gap-2 font-semibold tracking-tight">
          <span className="relative grid place-items-center">
            <span
              aria-hidden
              className="absolute size-6 rounded-full bg-solana-green/25 blur-md opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
            <Flame className="relative size-5 text-solana-green" aria-hidden />
          </span>
          VESTA
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden items-center sm:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
                activeProps={{ className: 'text-foreground' }}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="https://github.com/ivasik-k7/vesta-core"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
            >
              GitHub
              <ArrowUpRight
                className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </a>
          </div>
          <Button asChild size="sm" className="ml-2">
            <Link to="/app">Launch app</Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
