import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute } from '@tanstack/react-router'
import { Monitor, Moon, Sun } from 'lucide-react'
import type { ComponentType } from 'react'

import { BalancePanel } from '@/components/app/balance'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { type Lang, type Theme, useSettings } from '@/lib/settings/context'

export const Route = createFileRoute('/app/settings')({
  component: SettingsPage,
})

const THEMES: {
  value: Theme
  labelKey: 'theme.light' | 'theme.dark' | 'theme.system'
  icon: ComponentType<{ className?: string }>
}[] = [
  { value: 'light', labelKey: 'theme.light', icon: Sun },
  { value: 'dark', labelKey: 'theme.dark', icon: Moon },
  { value: 'system', labelKey: 'theme.system', icon: Monitor },
]

const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'uk', label: 'Українська' },
]

function SettingsPage() {
  const { publicKey } = useWallet()
  const { theme, setTheme, lang, setLang, t } = useSettings()

  return (
    <div>
      <PageHeader title={t('settings.title')} sub={t('settings.sub')} />

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
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm">{t('settings.language')}</p>
            <div className="inline-flex rounded-lg border border-border p-1">
              {LANGS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLang(opt.value)}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    lang === opt.value
                      ? 'bg-flame text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
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
