import { Link, useRouterState } from '@tanstack/react-router'
import { Coins, Command, Flame, Menu, Search, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AccountMenu } from '@/components/app/account-menu'
import { AccountOverlayProvider } from '@/components/app/account-overlay'
import { CreateMerchantProvider } from '@/components/app/create-merchant'
import {
  CommandPalette,
  CommandPaletteProvider,
  useCommandPalette,
} from '@/components/app/nav/command-palette'
import { MobileTabBar } from '@/components/app/nav/mobile-tabs'
import { Sidebar } from '@/components/app/nav/sidebar'
import { NotificationBell } from '@/components/app/notification-bell'
import { ConnectButton } from '@/components/wallet/connect-button'
import type { WorkspaceKind } from '@/lib/workspace/context'
import { useWorkspace } from '@/lib/workspace/context'

/** Which workspace kind a path belongs to. Shared paths (network/verify/token/
 *  merchant detail) return null — viewing them never forces a workspace switch. */
function deriveKind(path: string): WorkspaceKind | null {
  if (path.startsWith('/app/console') || path.startsWith('/app/analytics')) return 'merchant'
  if (path.startsWith('/app/issuer')) return 'issuer'
  if (path.startsWith('/app/admin')) return 'admin'
  if (
    path === '/app' ||
    path.startsWith('/app/wallet') ||
    path.startsWith('/app/swap') ||
    path.startsWith('/app/discover') ||
    path.startsWith('/app/rewards') ||
    path.startsWith('/app/achievements') ||
    path.startsWith('/app/alliances') ||
    path.startsWith('/app/activity') ||
    path.startsWith('/app/token') ||
    path.startsWith('/app/merchant')
  )
    return 'customer'
  return null
}

/** Full-viewport enterprise dashboard: fixed sidebar + topbar + scroll area. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <CreateMerchantProvider>
      <AccountOverlayProvider>
        <CommandPaletteProvider>
          <ShellBody>{children}</ShellBody>
          <CommandPalette />
        </CommandPaletteProvider>
      </AccountOverlayProvider>
    </CreateMerchantProvider>
  )
}

function ShellBody({ children }: { children: React.ReactNode }) {
  const [drawer, setDrawer] = useState(false)
  const path = useRouterState({ select: (s) => s.location.pathname })
  const { active, workspaces, setActiveId } = useWorkspace()

  // Keep the active workspace in sync with the route so deep links land in the
  // right context. Only switch when the kind genuinely differs.
  useEffect(() => {
    const kind = deriveKind(path)
    if (!kind || kind === active.kind) return
    const target =
      kind === 'merchant'
        ? workspaces.find((w) => w.kind === 'merchant')
        : workspaces.find((w) => w.kind === kind)
    if (target) setActiveId(target.id)
  }, [path, active.kind, workspaces, setActiveId])

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 md:block">
        <Sidebar />
      </aside>

      {drawer ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute top-0 left-0 h-full w-72 animate-in slide-in-from-left duration-200">
            <Sidebar onNavigate={() => setDrawer(false)} onClose={() => setDrawer(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setDrawer(true)} />
        <main className="flex-1 px-4 py-8 pb-24 md:px-10 md:py-10 md:pb-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>

      <MobileTabBar onMore={() => setDrawer(true)} />
    </div>
  )
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const palette = useCommandPalette()
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

      {/* Command palette trigger */}
      <button
        type="button"
        onClick={palette.open}
        className="hidden max-w-xs flex-1 items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:border-flame/40 hover:text-foreground sm:flex"
      >
        <Search className="size-3.5" aria-hidden />
        <span className="flex-1 text-left">Search or jump to…</span>
        <kbd className="flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/70">
          <Command className="size-2.5" aria-hidden />K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={palette.open}
          className="text-muted-foreground hover:text-foreground sm:hidden"
          aria-label="Search"
        >
          <Search className="size-5" />
        </button>
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
