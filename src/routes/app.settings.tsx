import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute } from '@tanstack/react-router'
import { Monitor, Moon, Sun } from 'lucide-react'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'

import { BalancePanel } from '@/components/app/balance'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
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
