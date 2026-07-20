import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight, Droplets, ExternalLink, Loader2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'

import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSolBalance } from '@/lib/vesta/queries'
import { explorerTx } from '@/lib/vesta/tx'

export const Route = createFileRoute('/app/drops')({
  component: DropsPage,
})

const PRESETS = [1, 2, 5]

interface DropResult {
  amount: number
  sig?: string
  error?: string
  at: number
}

// Web faucets to fall back on when the RPC airdrop is rate-limited.
const FAUCETS = [
  { label: 'faucet.solana.com', href: 'https://faucet.solana.com' },
  { label: 'Helius devnet faucet', href: 'https://www.helius.dev/faucet' },
  { label: 'QuickNode faucet', href: 'https://faucet.quicknode.com/solana/devnet' },
]

function DropsPage() {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const balance = useSolBalance()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState<number | null>(null)
  const [history, setHistory] = useState<DropResult[]>([])

  const request = async (amount: number) => {
    if (!publicKey) return
    setBusy(amount)
    try {
      const sig = await connection.requestAirdrop(publicKey, amount * 1e9)
      const bh = await connection.getLatestBlockhash()
      await connection.confirmTransaction({ signature: sig, ...bh }, 'confirmed')
      setHistory((h) => [{ amount, sig, at: Date.now() }, ...h].slice(0, 8))
      await queryClient.invalidateQueries({ queryKey: ['sol-balance'] })
    } catch (err) {
      setHistory((h) =>
        [
          { amount, error: err instanceof Error ? err.message : String(err), at: Date.now() },
          ...h,
        ].slice(0, 8),
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Drops"
        sub="Request devnet SOL for your connected account — the gas you need to try every VESTA action. All drops go to the wallet below on Solana devnet."
      />

      {!publicKey ? (
        <ConnectPrompt message="Connect a devnet wallet to request drops." />
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 font-medium text-[13px] text-muted-foreground">
                  <Droplets className="size-3.5 text-flame" aria-hidden /> Your devnet balance
                </p>
                {balance.isLoading ? (
                  <Skeleton className="mt-2 h-9 w-28" />
                ) : (
                  <p className="mt-1 font-heading font-semibold text-3xl tabular-nums">
                    {(balance.data ?? 0).toFixed(4)}{' '}
                    <span className="text-base text-muted-foreground">SOL</span>
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {PRESETS.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    className="border-line-strong"
                    disabled={busy !== null}
                    onClick={() => request(amount)}
                  >
                    {busy === amount ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : null}
                    {amount} SOL
                  </Button>
                ))}
              </div>
            </div>
            <p className="mt-3 break-all font-mono text-[11px] text-muted-foreground/70">
              {publicKey.toBase58()}
            </p>
          </div>

          {history.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              {history.map((r) => (
                <div
                  key={r.at}
                  className="flex items-center gap-3 border-border/60 border-b bg-card px-5 py-3 text-sm last:border-0"
                >
                  <span className="font-mono">{r.amount} SOL</span>
                  {r.sig ? (
                    <a
                      href={explorerTx(r.sig)}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto inline-flex items-center gap-1 text-flame hover:text-flame-hover"
                    >
                      confirmed
                      <ArrowUpRight className="size-3.5" aria-hidden />
                    </a>
                  ) : (
                    <span className="ml-auto text-red-400/90 text-xs">{r.error}</span>
                  )}
                </div>
              ))}
            </div>
          ) : null}

          <div className="rounded-2xl border border-border border-dashed bg-card/40 p-6">
            <p className="flex items-start gap-2 text-muted-foreground text-sm">
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0 text-muted-foreground/60"
                aria-hidden
              />
              The public devnet RPC faucet is frequently rate-limited. If a request fails, use a web
              faucet or set a private RPC (e.g. Helius) in Settings.
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              {FAUCETS.map((f) => (
                <a
                  key={f.href}
                  href={f.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-flame text-sm hover:text-flame-hover"
                >
                  {f.label}
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
