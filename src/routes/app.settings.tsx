import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute } from '@tanstack/react-router'
import { LogOut, Monitor, Moon, RefreshCw, Sun } from 'lucide-react'
import { type ComponentType, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BalancePanel } from '@/components/app/balance'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { Button } from '@/components/ui/button'
import { activeRpcEndpoint, RPC_OVERRIDE_KEY } from '@/components/wallet/provider'
import { useVestaAuth } from '@/lib/auth/context'
import { LANGUAGES } from '@/lib/i18n'
import { type Theme, useSettings } from '@/lib/settings/context'

export const Route = createFileRoute('/app/settings')({
  component: SettingsPage,
})

const THEMES: { value: Theme; key: string; icon: ComponentType<{ className?: string }> }[] = [
  { value: 'light', key: 'theme.light', icon: Sun },
  { value: 'dark', key: 'theme.dark', icon: Moon },
  { value: 'system', key: 'theme.system', icon: Monitor },
]

function SettingsPage() {
  const { publicKey } = useWallet()
  const { theme, setTheme } = useSettings()
  const { t, i18n } = useTranslation()

  return (
    <div>
      <PageHeader title={t('settings.title')} sub={t('settings.subtitle')} />

      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-card p-6">
          <p className="font-medium text-[13px] text-muted-foreground">
            {t('settings.appearance')}
          </p>

          <div className="mt-4">
            <p className="mb-2 text-sm">{t('settings.theme')}</p>
            <div className="inline-flex rounded-lg border border-border p-1">
              {THEMES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    theme === opt.value
                      ? 'bg-flame text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <opt.icon className="size-4" aria-hidden />
                  {t(opt.key)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm">{t('settings.language')}</p>
            <div className="grid max-w-md grid-cols-2 gap-2 sm:grid-cols-4">
              {LANGUAGES.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => void i18n.changeLanguage(opt.code)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    i18n.resolvedLanguage === opt.code
                      ? 'border-flame/60 bg-flame/10 text-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <RpcSection />

        <SessionSection />

        <section>
          <p className="mb-2 font-medium text-[13px] text-muted-foreground">
            {t('settings.account')}
          </p>
          {publicKey ? <BalancePanel /> : <ConnectPrompt message={t('common.connectPrompt')} />}
        </section>
      </div>
    </div>
  )
}

function RpcSection() {
  const [value, setValue] = useState(() => localStorage.getItem(RPC_OVERRIDE_KEY) ?? '')
  const [saved, setSaved] = useState(false)
  const current = activeRpcEndpoint()

  const apply = () => {
    const trimmed = value.trim()
    if (trimmed) localStorage.setItem(RPC_OVERRIDE_KEY, trimmed)
    else localStorage.removeItem(RPC_OVERRIDE_KEY)
    setSaved(true)
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <p className="font-medium text-[13px] text-muted-foreground">Network / RPC</p>
      <p className="mt-1 text-muted-foreground text-sm">
        Override the devnet RPC endpoint — paste a private URL (e.g. Helius) to dodge public rate
        limits. Takes effect after reload.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setSaved(false)
          }}
          placeholder="https://devnet.helius-rpc.com/?api-key=…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-flame/60"
        />
        <Button onClick={apply} className="shrink-0">
          Save
        </Button>
      </div>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground/70">active: {current}</p>
      {saved ? (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 inline-flex items-center gap-1.5 text-flame text-sm hover:text-flame-hover"
        >
          <RefreshCw className="size-3.5" aria-hidden />
          Reload to apply
        </button>
      ) : null}
    </section>
  )
}

function SessionSection() {
  const { session, signOut } = useVestaAuth()
  if (!session) return null
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <p className="font-medium text-[13px] text-muted-foreground">Session</p>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground text-xs">Address</dt>
          <dd className="mt-0.5 font-mono">
            {session.address.slice(0, 4)}…{session.address.slice(-4)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Signed in</dt>
          <dd className="mt-0.5">{new Date(session.issuedAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Expires</dt>
          <dd className="mt-0.5">{new Date(session.expiresAt).toLocaleString()}</dd>
        </div>
      </dl>
      <Button variant="outline" className="mt-4 border-line-strong" onClick={signOut}>
        <LogOut className="size-4" aria-hidden />
        Sign out
      </Button>
    </section>
  )
}
