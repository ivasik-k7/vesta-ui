import { Loader2, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { ConnectButton } from '@/components/wallet/connect-button'
import { useVestaAuth } from '@/lib/auth/context'

/**
 * Runtime auth boundary inside the (already route-protected) app. Handles the
 * live cases the router guard can't see: the wallet reconnecting after reload,
 * or a connected wallet whose key doesn't match the stored session.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status, signIn } = useVestaAuth()
  const { t } = useTranslation()

  if (status === 'authenticated') return <>{children}</>

  if (status === 'restoring') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Restoring your session…
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-5 rounded-2xl border border-border border-dashed bg-card/40 p-12 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-flame/10">
          <ShieldCheck className="size-6 text-flame" aria-hidden />
        </span>
        {status === 'disconnected' ? (
          <>
            <div>
              <h2 className="font-heading font-semibold text-lg">{t('auth.connectFirst')}</h2>
              <p className="mt-1.5 text-muted-foreground text-sm">{t('auth.secureNote')}</p>
            </div>
            <ConnectButton size="lg" />
          </>
        ) : (
          <>
            <div>
              <h2 className="font-heading font-semibold text-lg">{t('auth.signIn')}</h2>
              <p className="mt-1.5 text-muted-foreground text-sm">{t('auth.subtitle')}</p>
            </div>
            <Button size="lg" onClick={() => signIn()} disabled={status === 'authenticating'}>
              <ShieldCheck className="size-4" aria-hidden />
              {status === 'authenticating' ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
