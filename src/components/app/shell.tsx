import { Link } from '@tanstack/react-router'
import { Activity, LayoutDashboard, Settings, Shield, Store, Users, Wallet } from 'lucide-react'
import type { ComponentType } from 'react'

import { BalanceChip } from '@/components/app/balance'
import { ConnectButton } from '@/components/wallet/connect-button'
import type { TranslationKey } from '@/lib/i18n/dict'
import { useSettings } from '@/lib/settings/context'

const NAV: { to: string; key: TranslationKey; icon: ComponentType<{ className?: string }> }[] = [
  { to: '/app', key: 'nav.overview', icon: LayoutDashboard },
  { to: '/app/wallet', key: 'nav.wallet', icon: Wallet },
  { to: '/app/activity', key: 'nav.activity', icon: Activity },
  { to: '/app/alliances', key: 'nav.alliances', icon: Users },
  { to: '/app/console', key: 'nav.console', icon: Store },
  { to: '/app/admin', key: 'nav.admin', icon: Shield },
  { to: '/app/settings', key: 'nav.settings', icon: Settings },
]

/** Enterprise dashboard shell: persistent sidebar + content area. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useSettings()

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 py-10 md:py-14">
      <aside className="sticky top-20 hidden h-fit w-52 shrink-0 md:block">
        <nav className="space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === '/app' }}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground text-sm transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: 'bg-secondary text-foreground' }}
            >
              <item.icon className="size-4" />
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <BalanceChip />
      </aside>

      {/* mobile top tabs */}
      <div className="w-full">
        <div className="mb-6 flex gap-1 overflow-x-auto md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === '/app' }}
              className="shrink-0 rounded-lg px-3 py-1.5 text-muted-foreground text-sm transition-colors"
              activeProps={{ className: 'bg-secondary text-foreground' }}
            >
              {t(item.key)}
            </Link>
          ))}
        </div>
        {children}
      </div>
    </div>
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
