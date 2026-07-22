import { Link } from '@tanstack/react-router'
import { Flame } from 'lucide-react'
import { useEffect, useState } from 'react'

import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { ConnectButton } from '@/components/wallet/connect-button'
import { cn } from '@/lib/utils'

const NAV = [{ to: '/merchant', label: 'Merchants' }] as const

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
        'sticky top-0 z-50 border-b transition-colors duration-300',
        scrolled
          ? 'border-border bg-background/80 backdrop-blur-md'
          : 'border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="group flex items-center gap-2 font-semibold tracking-tight">
            <span className="relative grid place-items-center">
              <span
                aria-hidden
                className="absolute size-6 rounded-full bg-flame/25 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
              />
              <Flame className="relative size-5 text-flame" aria-hidden />
            </span>
            VESTA
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
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
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 font-medium text-[13px] text-muted-foreground sm:flex">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-flame/60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-flame" />
            </span>
            Devnet
          </span>
          <LanguageSwitcher />
          <ConnectButton />
        </div>
      </nav>
    </header>
  )
}
