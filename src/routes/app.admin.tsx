import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute } from '@tanstack/react-router'
import { PauseCircle, PlayCircle, ShieldAlert } from 'lucide-react'

import { ActionPanel } from '@/components/app/action-panel'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { Skeleton } from '@/components/ui/skeleton'
import { setPausedIx } from '@/lib/vesta/ixns'
import { useConfig } from '@/lib/vesta/queries'

export const Route = createFileRoute('/app/admin')({
  component: AdminPage,
})

function AdminPage() {
  const { publicKey } = useWallet()
  const config = useConfig()

  const isAdmin = !!publicKey && !!config.data && config.data.admin.equals(publicKey)

  return (
    <div>
      <PageHeader
        title="Protocol admin"
        sub="Monitor global protocol state and operate the circuit breaker. Actions are gated to the on-chain Config admin."
      />

      {!publicKey ? (
        <ConnectPrompt message="Connect the admin wallet to manage the protocol." />
      ) : (
        <div className="space-y-4">
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="font-medium text-[13px] text-muted-foreground">Protocol status</p>
              {config.isLoading ? (
                <Skeleton className="mt-3 h-8 w-24" />
              ) : (
                <p
                  className={`mt-2 font-heading font-semibold text-2xl ${
                    config.data?.paused ? 'text-red-400' : 'text-flame'
                  }`}
                >
                  {config.data?.paused ? 'Paused' : 'Live'}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="font-medium text-[13px] text-muted-foreground">Admin</p>
              {config.isLoading ? (
                <Skeleton className="mt-3 h-5 w-40" />
              ) : (
                <p className="mt-2 break-all font-mono text-sm">{config.data?.admin.toBase58()}</p>
              )}
            </div>
          </section>

          {!config.isLoading && !isAdmin ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border border-dashed bg-card/40 p-6 text-muted-foreground text-sm">
              <ShieldAlert className="size-5 shrink-0 text-muted-foreground/60" aria-hidden />
              This wallet is not the protocol admin — controls are read-only. You can still monitor
              status above.
            </div>
          ) : null}

          {isAdmin ? (
            <div className="max-w-lg">
              <ActionPanel
                title={config.data?.paused ? 'Resume the protocol' : 'Pause the protocol'}
                description={
                  config.data?.paused
                    ? 'Lift the circuit breaker — state-mutating instructions accept again. Token transfers are unaffected either way.'
                    : 'Engage the circuit breaker — earn, redeem, swap and other state mutations are blocked. Token transfers (argus) keep working, so clawback is never bricked.'
                }
                cta={config.data?.paused ? 'Resume' : 'Pause'}
                run={async ({ wallet, connection, send }) => {
                  if (!wallet.publicKey) throw new Error('Connect a wallet')
                  return send(connection, wallet, [
                    setPausedIx(wallet.publicKey, !config.data?.paused),
                  ])
                }}
              >
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  {config.data?.paused ? (
                    <PlayCircle className="size-4 text-flame" aria-hidden />
                  ) : (
                    <PauseCircle className="size-4 text-flame" aria-hidden />
                  )}
                  Circuit breaker
                </div>
              </ActionPanel>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
