import { Link } from '@tanstack/react-router'
import { Flame } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// §1.1 + §8: nav is logo + one primary CTA. No link clutter, no hamburger.
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
          ? 'border-border bg-background/75 backdrop-blur-md'
          : 'border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
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

        <Button asChild size="sm">
          <Link to="/app">Launch app</Link>
        </Button>
      </nav>
    </header>
  )
}
