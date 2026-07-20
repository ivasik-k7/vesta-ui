import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  Activity,
  ArrowLeft,
  Award,
  BadgeCheck,
  BarChart3,
  Coins,
  Compass,
  Flame,
  Gauge,
  Gift,
  Globe,
  LayoutDashboard,
  Megaphone,
  Menu,
  ShieldCheck,
  Store,
  Ticket,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AccountMenu } from '@/components/app/account-menu'
import { AccountOverlayProvider } from '@/components/app/account-overlay'
import { BalanceChip } from '@/components/app/balance'
import { CreateMerchantProvider, useCreateMerchant } from '@/components/app/create-merchant'
import { NotificationBell } from '@/components/app/notification-bell'
import { ConnectButton } from '@/components/wallet/connect-button'
import { useMyMerchant } from '@/lib/vesta/queries'

type NavItem = { to: string; label: string; icon: ComponentType<{ className?: string }> }

export type Mode = 'customer' | 'merchant'
const MODE_KEY = 'vesta.mode'
const MODE_DEFAULT_ROUTE: Record<Mode, string> = { customer: '/app', merchant: '/app/console' }

// Role-scoped navigation. The switch toggles which set is shown; Protocol and
// Account are always visible. Labels that map to i18n keys are translated.
const CUSTOMER_NAV: NavItem[] = [
  { to: '/app', label: 'nav.overview', icon: LayoutDashboard },
  { to: '/app/wallet', label: 'nav.wallet', icon: Wallet },
  { to: '/app/discover', label: 'Discover', icon: Compass },
  { to: '/app/activity', label: 'nav.activity', icon: Activity },
]
const MERCHANT_NAV: NavItem[] = [
  { to: '/app/console', label: 'Overview', icon: Store },
  { to: '/app/console/issue', label: 'Issue points', icon: Gift },
  { to: '/app/console/offers', label: 'Offers', icon: Ticket },
  { to: '/app/console/achievements', label: 'Achievements', icon: Award },
  { to: '/app/console/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/app/console/alliance', label: 'Alliance', icon: Users },
  { to: '/app/console/token', label: 'Token & guard', icon: ShieldCheck },
  { to: '/app/console/attest', label: 'Attestations', icon: BadgeCheck },
  { to: '/app/console/advanced', label: 'Advanced', icon: Gauge },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
]
const PROTOCOL_NAV: NavItem[] = [
  { to: '/app/network', label: 'Network', icon: Globe },
  { to: '/app/verify', label: 'Verify', icon: BadgeCheck },
]

// Which role a path belongs to. Shared paths (protocol/account/detail) → null,
// meaning "don't force a mode switch just because you're viewing this".
function deriveMode(path: string): Mode | null {
  if (
    path.startsWith('/app/console') ||
    path.startsWith('/app/analytics') ||
    path.startsWith('/app/alliances')
  )
    return 'merchant'
  if (
    path === '/app' ||
    path.startsWith('/app/wallet') ||
    path.startsWith('/app/discover') ||
    path.startsWith('/app/activity') ||
    path.startsWith('/app/token') ||
    path.startsWith('/app/merchant')
  )
    return 'customer'
  return null
}

function readStoredMode(): Mode {
  return localStorage.getItem(MODE_KEY) === 'merchant' ? 'merchant' : 'customer'
}

/** Full-viewport enterprise dashboard: fixed sidebar + topbar + scroll area. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <CreateMerchantProvider>
      <AccountOverlayProvider>
        <ShellBody>{children}</ShellBody>
      </AccountOverlayProvider>
    </CreateMerchantProvider>
  )
}

function ShellBody({ children }: { children: React.ReactNode }) {
  const [drawer, setDrawer] = useState(false)
  const navigate = useNavigate()
  const path = useRouterState({ select: (s) => s.location.pathname })
  const isMerchant = !!useMyMerchant().data
  const [mode, setModeState] = useState<Mode>(() => deriveMode(path) ?? readStoredMode())

  // Only merchants get a merchant mode; everyone else is a customer.
  const effectiveMode: Mode = isMerchant ? mode : 'customer'

  useEffect(() => {
    if (!isMerchant) return
    const m = deriveMode(path)
    if (m && m !== mode) setModeState(m)
  }, [path, mode, isMerchant])

  const setMode = (m: Mode) => {
    setModeState(m)
    localStorage.setItem(MODE_KEY, m)
    navigate({ to: MODE_DEFAULT_ROUTE[m] })
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 md:block">
        <SidebarContent mode={effectiveMode} isMerchant={isMerchant} onMode={setMode} />
      </aside>

      {/* Mobile drawer */}
      {drawer ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute top-0 left-0 h-full w-72 animate-in slide-in-from-left duration-200">
            <SidebarContent
              mode={effectiveMode}
              isMerchant={isMerchant}
              onMode={(m) => {
                setMode(m)
                setDrawer(false)
              }}
              onNavigate={() => setDrawer(false)}
              onClose={() => setDrawer(false)}
            />
          </div>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setDrawer(true)} />
        <main className="flex-1 px-4 py-8 md:px-10 md:py-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({
  mode,
  isMerchant,
  onMode,
  onNavigate,
  onClose,
}: {
  mode: Mode
  isMerchant: boolean
  onMode: (m: Mode) => void
  onNavigate?: () => void
  onClose?: () => void
}) {
  const { t } = useTranslation()
  const createMerchant = useCreateMerchant()
  const roleNav = mode === 'customer' ? CUSTOMER_NAV : MERCHANT_NAV
  const roleHeading = isMerchant
    ? mode === 'customer'
      ? 'As a customer'
      : 'As a merchant'
    : 'Menu'

  return (
    <div className="relative flex h-full flex-col overflow-hidden border-border border-r bg-gradient-to-b from-card/60 via-card/30 to-background">
      {/* Ambient flame glow bleeding from the top-left corner. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-10 size-48 rounded-full bg-flame/10 blur-3xl"
      />

      {/* Brand header */}
      <div className="relative flex h-16 shrink-0 items-center gap-2.5 px-5">
        <Link
          to="/"
          className="group flex items-center gap-2.5 font-heading font-semibold text-[15px] tracking-tight"
        >
          <span className="relative grid size-8 place-items-center rounded-xl border border-flame/25 bg-flame/10">
            <span
              aria-hidden
              className="absolute inset-0 rounded-xl bg-flame/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
            />
            <Flame className="relative size-4 text-flame" aria-hidden />
          </span>
          VESTA
        </Link>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </div>

      {/* Role switch (merchants) or become-a-merchant CTA (customers) */}
      <div className="relative px-3 pb-1">
        {isMerchant ? (
          <ModeSwitch mode={mode} onMode={onMode} />
        ) : (
          <button
            type="button"
            onClick={() => {
              onNavigate?.()
              createMerchant.open()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-flame/40 bg-flame/[0.06] py-2 font-medium text-flame text-sm transition-colors hover:bg-flame/10"
          >
            <Store className="size-4" aria-hidden />
            Become a merchant
          </button>
        )}
      </div>

      <div className="relative mx-4 mt-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Navigation */}
      <nav className="scrollbar-flame relative flex-1 space-y-5 overflow-y-auto px-3 py-5">
        <NavSection heading={roleHeading}>
          {roleNav.map((item) => (
            <SidebarLink
              key={item.to}
              item={{ ...item, label: t(item.label) }}
              onNavigate={onNavigate}
            />
          ))}
        </NavSection>
        <NavSection heading="Protocol">
          {PROTOCOL_NAV.map((item) => (
            <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </NavSection>
      </nav>

      {/* Footer: balance + escape hatch */}
      <div className="relative shrink-0 space-y-1.5 border-border/60 border-t p-3">
        <BalanceChipCompact />
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground text-sm transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to site
        </Link>
      </div>
    </div>
  )
}

/** Two-segment role switch — the primary way to un-mix customer vs merchant. */
function ModeSwitch({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  const opts: { value: Mode; label: string; icon: ComponentType<{ className?: string }> }[] = [
    { value: 'customer', label: 'Customer', icon: User },
    { value: 'merchant', label: 'Merchant', icon: Store },
  ]
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-background/60 p-1">
      {opts.map((o) => {
        const on = mode === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onMode(o.value)}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm transition-colors ${
              on
                ? 'bg-flame text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <o.icon className="size-3.5" aria-hidden />
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function NavSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 px-3 font-semibold text-[10px] text-muted-foreground/50 uppercase tracking-[0.12em]">
        <span className="size-1 rounded-full bg-flame/40" aria-hidden />
        {heading}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      activeOptions={{ exact: item.to === '/app' || item.to === '/app/console' }}
      className="group relative flex items-center gap-3 rounded-lg py-2 pr-3 pl-4 text-[13.5px] text-muted-foreground transition-all hover:bg-secondary/70 hover:text-foreground data-[status=active]:bg-flame/10 data-[status=active]:font-medium data-[status=active]:text-flame"
    >
      {/* Active indicator bar */}
      <span
        aria-hidden
        className="absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 scale-y-0 rounded-full bg-flame transition-transform duration-200 group-data-[status=active]:scale-y-100"
      />
      <item.icon className="size-[17px] shrink-0 text-muted-foreground/70 transition-colors group-hover:text-foreground group-data-[status=active]:text-flame" />
      {item.label}
    </Link>
  )
}

function BalanceChipCompact() {
  // Reuse the existing chip but without its default top margin.
  return (
    <div className="[&>div]:mt-0">
      <BalanceChip />
    </div>
  )
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-border border-b bg-background/80 px-4 backdrop-blur-md md:px-10">
      <button
        type="button"
        onClick={onMenu}
        className="text-muted-foreground hover:text-foreground md:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <Link to="/" className="flex items-center gap-2 font-semibold md:hidden">
        <Flame className="size-5 text-flame" aria-hidden />
        VESTA
      </Link>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden items-center gap-1.5 font-medium text-[13px] text-muted-foreground sm:flex">
          <Coins className="size-3.5 text-flame" aria-hidden />
          Devnet
        </span>
        <NotificationBell />
        <AccountMenu />
      </div>
    </header>
  )
}

/** Consistent empty state prompting wallet connection. */
export function ConnectPrompt({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border border-dashed bg-card/40 p-12 text-center">
      <Wallet className="size-8 text-flame" aria-hidden />
      <p className="max-w-sm text-muted-foreground">{message}</p>
      <ConnectButton size="lg" />
    </div>
  )
}

export function PageHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-heading font-semibold text-2xl tracking-tight md:text-3xl">{title}</h1>
      <p className="mt-1.5 max-w-2xl text-muted-foreground text-sm leading-relaxed">{sub}</p>
    </div>
  )
}
