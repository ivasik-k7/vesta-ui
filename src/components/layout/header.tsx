import { Link } from '@tanstack/react-router'
import { ArrowRight, Flame, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useEnterApp } from '@/components/landing/launch'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const REPO_URL = 'https://github.com/ivasik-k7/vesta-core'

/** One standardized header control: a 36px square, hairline border, flame on
 *  hover. Shared by every icon action so the row stays perfectly aligned. */
export const HEADER_ACTION =
  'grid size-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-flame/40 hover:text-flame'

/** Landing-section anchors (resolved on the home route via `to="/" hash=…`). */
const ANCHORS = [
  { hash: 'why', key: 'landing.nav.why' },
  { hash: 'how', key: 'landing.nav.how' },
  { hash: 'features', key: 'landing.nav.features' },
  { hash: 'faq', key: 'landing.nav.faq' },
] as const

export function Header() {
  const { t } = useTranslation()
  const enterApp = useEnterApp()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const framed = scrolled || open

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-colors duration-300',
        framed ? 'bg-background/70 backdrop-blur-xl' : 'bg-transparent',
      )}
    >
      {/* flame hairline — only once the bar detaches from the hero */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-flame/40 to-transparent transition-opacity duration-300',
          framed ? 'opacity-100' : 'opacity-0',
        )}
      />

      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        {/* Brand + desktop nav */}
        <div className="flex min-w-0 items-center gap-7">
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-2.5"
            onClick={() => setOpen(false)}
          >
            <span className="relative grid size-8 place-items-center rounded-xl border border-flame/30 bg-flame/10">
              <span
                aria-hidden
                className="absolute inset-0 rounded-xl bg-flame/30 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
              />
              <Flame className="relative size-4 text-flame" aria-hidden />
            </span>
            <span className="font-heading font-semibold text-[17px] tracking-tight">VESTA</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {ANCHORS.map((a) => (
              <NavLink key={a.hash} hash={a.hash}>
                {t(a.key)}
              </NavLink>
            ))}
            <NavLink to="/merchant">{t('landing.nav.merchants')}</NavLink>
          </div>
        </div>

        {/* Standardized action row */}
        <div className="flex shrink-0 items-center gap-2">
          <Devnet />
          <span aria-hidden className="hidden h-5 w-px bg-border lg:block" />
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Source on GitHub"
            className={cn(HEADER_ACTION, 'hidden sm:grid')}
          >
            <GitHubMark className="size-4" />
          </a>
          <LanguageSwitcher />
          <Button size="sm" className="group hidden h-9 sm:inline-flex" onClick={enterApp}>
            {t('landing.nav.launch')}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className={cn(HEADER_ACTION, 'md:hidden')}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      {open ? (
        <div className="md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 pb-4">
            {ANCHORS.map((a) => (
              <Link
                key={a.hash}
                to="/"
                hash={a.hash}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 font-medium text-muted-foreground text-sm transition-colors hover:bg-secondary hover:text-foreground"
              >
                {t(a.key)}
              </Link>
            ))}
            <Link
              to="/merchant"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 font-medium text-muted-foreground text-sm transition-colors hover:bg-secondary hover:text-foreground"
            >
              {t('landing.nav.merchants')}
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-medium text-muted-foreground text-sm transition-colors hover:bg-secondary hover:text-foreground"
            >
              <GitHubMark className="size-4" /> GitHub
            </a>
            <Button
              className="group mt-2 w-full"
              onClick={() => {
                setOpen(false)
                enterApp()
              }}
            >
              {t('landing.nav.launch')}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  )
}

/** Nav link with an animated flame underline — anchor (hash) or route. */
function NavLink({
  hash,
  to,
  children,
}: {
  hash?: string
  to?: string
  children: React.ReactNode
}) {
  const cls =
    'group relative rounded-md px-3 py-1.5 font-medium text-[13.5px] text-muted-foreground transition-colors hover:text-foreground'
  const underline = (
    <span
      aria-hidden
      className="-translate-x-1/2 absolute bottom-0.5 left-1/2 h-px w-0 bg-flame transition-all duration-300 group-hover:w-[calc(100%-1.5rem)]"
    />
  )
  if (to) {
    return (
      <Link to={to} className={cls} activeProps={{ className: 'text-foreground' }}>
        {children}
        {underline}
      </Link>
    )
  }
  return (
    <Link to="/" hash={hash} className={cls}>
      {children}
      {underline}
    </Link>
  )
}

/** Minimal network status — a live dot + mono label, not an action. */
function Devnet() {
  return (
    <span className="hidden items-center gap-1.5 font-mono text-[11px] text-muted-foreground lg:inline-flex">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-flame/60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-flame" />
      </span>
      devnet
    </span>
  )
}

/** GitHub mark (lucide dropped brand icons). */
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" role="img" className={className}>
      <title>GitHub</title>
      <path d="M12 .5C5.73.5.67 5.57.67 11.85c0 5.02 3.26 9.28 7.78 10.79.57.1.78-.25.78-.55v-2c-3.16.69-3.83-1.36-3.83-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.67 1.24 3.32.95.1-.74.4-1.24.72-1.53-2.52-.29-5.17-1.26-5.17-5.6 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.16.91-.25 1.89-.38 2.86-.39.97 0 1.95.13 2.86.39 2.19-1.48 3.15-1.16 3.15-1.16.62 1.57.23 2.73.11 3.02.73.79 1.17 1.8 1.17 3.04 0 4.35-2.66 5.31-5.19 5.59.41.35.78 1.05.78 2.12v3.14c0 .3.2.66.79.55 4.51-1.51 7.77-5.77 7.77-10.79C23.33 5.57 18.27.5 12 .5z" />
    </svg>
  )
}
