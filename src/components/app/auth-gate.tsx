import { ShieldCheck, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { ConnectButton } from '@/components/wallet/connect-button'
import { useVestaAuth } from '@/lib/auth/context'

/**
 * Client-side protected-route gate. The dashboard is only rendered for a
 * cryptographically verified, unexpired session bound to the connected key.
 * (No backend exists, so this guards the client experience — there is no
 * server-side data to protect.)
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status, signIn } = useVestaAuth()

  if (status === 'authenticated') return <>{children}</>

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-5 rounded-2xl border border-border border-dashed bg-card/40 p-12 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-flame/10">
          {status === 'disconnected' ? (
            <Wallet className="size-6 text-flame" aria-hidden />
          ) : (
            <ShieldCheck className="size-6 text-flame" aria-hidden />
          )}
        </span>
        {status === 'disconnected' ? (
          <>
            <div>
              <h2 className="font-heading font-semibold text-lg">Connect to continue</h2>
              <p className="mt-1.5 text-muted-foreground text-sm">
                The dashboard is protected. Connect a devnet wallet to begin.
              </p>
            </div>
            <ConnectButton size="lg" />
          </>
        ) : (
          <>
            <div>
              <h2 className="font-heading font-semibold text-lg">One signature to sign in</h2>
              <p className="mt-1.5 text-muted-foreground text-sm">
                Prove you own this wallet with a gasless message signature. No transaction, no fees
                — it just opens your session.
              </p>
            </div>
            <Button size="lg" onClick={() => signIn()} disabled={status === 'authenticating'}>
              <ShieldCheck className="size-4" aria-hidden />
              {status === 'authenticating' ? 'Check your wallet…' : 'Sign in with Solana'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
