import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useQueryClient } from '@tanstack/react-query'
import { Coins, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { useSettings } from '@/lib/settings/context'
import { useSolBalance } from '@/lib/vesta/queries'

/** Compact SOL balance chip for the shell sidebar. */
export function BalanceChip() {
  const { publicKey } = useWallet()
  const balance = useSolBalance()
  if (!publicKey) return null
  return (
    <div className="mt-6 rounded-lg border border-border bg-card px-3 py-2">
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
        <Coins className="size-3" aria-hidden /> Devnet SOL
      </p>
      {balance.isLoading ? (
        <Skeleton className="mt-1 h-5 w-16" />
      ) : (
        <p className="mt-0.5 font-mono text-sm tabular-nums">{(balance.data ?? 0).toFixed(3)}</p>
      )}
    </div>
  )
}

/** Full balance + devnet airdrop control for the settings page. */
export function BalancePanel() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const balance = useSolBalance()
  const queryClient = useQueryClient()
  const { t } = useSettings()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!publicKey) return null

  const airdrop = async () => {
    setBusy(true)
    setError(null)
    try {
      const sig = await connection.requestAirdrop(publicKey, 1e9)
      const bh = await connection.getLatestBlockhash()
      await connection.confirmTransaction({ signature: sig, ...bh }, 'confirmed')
      await queryClient.invalidateQueries({ queryKey: ['sol-balance'] })
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} — the public devnet faucet is often rate-limited.`
          : String(err),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="font-medium text-[13px] text-muted-foreground">{t('settings.balance')}</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        {balance.isLoading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <p className="font-heading font-semibold text-3xl tabular-nums">
            {(balance.data ?? 0).toFixed(4)}{' '}
            <span className="text-base text-muted-foreground">SOL</span>
          </p>
        )}
        <button
          type="button"
          onClick={airdrop}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-3 py-2 text-sm transition-colors hover:bg-secondary disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {busy ? t('balance.airdropping') : t('balance.airdrop')}
        </button>
      </div>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground/70">{publicKey.toBase58()}</p>
      {error ? <p className="mt-2 text-red-400/90 text-sm">{error}</p> : null}
    </div>
  )
}
