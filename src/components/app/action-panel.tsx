import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, Loader2 } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { Button } from '@/components/ui/button'
import { explorerTx, sendIxns } from '@/lib/vesta/tx'

type Status =
  | { kind: 'idle' }
  | { kind: 'signing' }
  | { kind: 'done'; sig: string }
  | { kind: 'error'; message: string }

/** Shared shell for a signable action: title, body, a run() that returns a
 *  signature, unified success/error surface. Keeps every flow consistent. */
export function ActionPanel({
  title,
  description,
  cta,
  disabled,
  run,
  children,
}: {
  title: string
  description: string
  cta: string
  disabled?: boolean
  run: (ctx: {
    connection: ReturnType<typeof useConnection>['connection']
    wallet: ReturnType<typeof useWallet>
    send: typeof sendIxns
  }) => Promise<string>
  children?: ReactNode
}) {
  const { connection } = useConnection()
  const wallet = useWallet()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const onClick = async () => {
    setStatus({ kind: 'signing' })
    try {
      const sig = await run({ connection, wallet, send: sendIxns })
      setStatus({ kind: 'done', sig })
      await queryClient.invalidateQueries()
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-heading font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{description}</p>
      {children ? <div className="mt-4 space-y-3">{children}</div> : null}
      <Button
        onClick={onClick}
        disabled={disabled || status.kind === 'signing'}
        className="mt-5 w-full"
      >
        {status.kind === 'signing' ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Confirming…
          </>
        ) : (
          cta
        )}
      </Button>
      {status.kind === 'done' ? (
        <a
          href={explorerTx(status.sig)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-flame text-sm hover:text-flame-hover"
        >
          Confirmed on devnet
          <ArrowUpRight className="size-3.5" aria-hidden />
        </a>
      ) : null}
      {status.kind === 'error' ? (
        <p className="mt-3 break-words text-red-400/90 text-sm">{status.message}</p>
      ) : null}
    </div>
  )
}

export function AddressField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const valid = value === '' || isPubkey(value)
  return (
    <label className="block">
      <span className="text-muted-foreground text-xs">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm outline-none transition-colors ${
          valid ? 'border-border focus:border-flame/60' : 'border-red-500/60'
        }`}
      />
    </label>
  )
}

export function AmountField({
  label,
  value,
  onChange,
  suffix = 'pts',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  suffix?: string
}) {
  return (
    <label className="block">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="mt-1 flex items-center rounded-lg border border-border bg-background px-3 focus-within:border-flame/60">
        <input
          value={value}
          inputMode="decimal"
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder="0.00"
          className="w-full bg-transparent py-2 font-mono text-sm outline-none"
        />
        <span className="text-muted-foreground text-xs">{suffix}</span>
      </div>
    </label>
  )
}

export function isPubkey(v: string): boolean {
  try {
    return Boolean(new PublicKey(v))
  } catch {
    return false
  }
}
