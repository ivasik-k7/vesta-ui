import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Check, Flame, Loader2, ShieldCheck, TriangleAlert, Wallet } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuthFlow } from '@/components/app/auth-flow'
import { Button } from '@/components/ui/button'
import { useVestaAuth } from '@/lib/auth/context'
import { hasValidStoredSession } from '@/lib/auth/session-store'

// Already signed in? Never show the auth wall — go straight to the app.
export const Route = createFileRoute('/auth')({
  beforeLoad: () => {
    if (hasValidStoredSession()) throw redirect({ to: '/app' })
  },
  component: AuthPage,
})

function AuthPage() {
  const { t } = useTranslation()
  const { publicKey, connecting } = useWallet()
  const { status, signIn, error } = useVestaAuth()
  const { login } = useAuthFlow()
  const navigate = useNavigate()

  // The instant the session becomes valid, enter the app.
  useEffect(() => {
    if (status === 'authenticated') void navigate({ to: '/app' })
  }, [status, navigate])

  const connected = !!publicKey

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-fade" />
        <div className="-translate-x-1/2 absolute top-1/3 left-1/2 h-[36rem] w-[52rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgb(122_38_4/0.35),transparent_65%)]" />
      </div>

      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('auth.backHome')}
        </Link>

        <div className="rounded-2xl border border-border bg-card/80 p-8 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="relative grid place-items-center">
              <span className="absolute size-8 rounded-full bg-flame/25 blur-md" aria-hidden />
              <Flame className="relative size-6 text-flame" aria-hidden />
            </span>
            <span className="font-semibold text-lg tracking-tight">VESTA</span>
          </div>

          <h1 className="mt-6 font-heading font-semibold text-2xl tracking-tight">
            {t('auth.title')}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{t('auth.subtitle')}</p>

          <ol className="mt-6 space-y-2.5">
            <Step done={connected} active={!connected} label={t('auth.step1')} />
            <Step
              done={status === 'authenticated'}
              active={connected && status !== 'authenticated'}
              label={t('auth.step2')}
            />
            <Step done={false} active={false} label={t('auth.step3')} />
          </ol>

          <div className="mt-7">
            {!connected ? (
              <Button size="lg" className="w-full" onClick={login} disabled={connecting}>
                <Wallet className="size-4" aria-hidden />
                {connecting ? t('auth.connecting') : t('auth.connect')}
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full"
                onClick={() => signIn()}
                disabled={status === 'authenticating'}
              >
                {status === 'authenticating' ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <ShieldCheck className="size-4" aria-hidden />
                )}
                {status === 'authenticating' ? t('auth.signingIn') : t('auth.signIn')}
              </Button>
            )}
          </div>

          {error ? (
            <p className="mt-3 text-center text-red-400/90 text-sm">
              {error.startsWith('auth.') ? t(error) : error}
            </p>
          ) : null}

          <p className="mt-6 flex items-start gap-2 rounded-lg border border-border/60 bg-background/40 p-3 text-muted-foreground text-xs leading-relaxed">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-flame" aria-hidden />
            {t('auth.secureNote')}
          </p>
          <p className="mt-2 flex items-start gap-2 text-muted-foreground/80 text-xs leading-relaxed">
            <TriangleAlert
              className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60"
              aria-hidden
            />
            {t('auth.networkNote')}
          </p>
        </div>
      </div>
    </main>
  )
}

function Step({ done, active, label }: { done: boolean; active: boolean; label: string }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span
        className={`grid size-5 shrink-0 place-items-center rounded-full border text-[11px] ${
          done
            ? 'border-flame bg-flame text-primary-foreground'
            : active
              ? 'border-flame text-flame'
              : 'border-border text-muted-foreground/50'
        }`}
      >
        {done ? <Check className="size-3" aria-hidden /> : null}
      </span>
      <span className={done || active ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </li>
  )
}
