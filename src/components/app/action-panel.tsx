import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, Loader2 } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { Button } from '@/components/ui/button'
import { humanizeError, useNotify } from '@/lib/notify/context'
import { explorerTx, sendIxns } from '@/lib/vesta/tx'

type Status =
  | { kind: 'idle' }
  | { kind: 'signing' }
  | { kind: 'done'; sig: string }
  | { kind: 'error'; message: string }

// Standardized field label — one micro-label style for every form control.
const LABEL =
  'font-medium font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]'
// Standardized input surface — matches the settings-kit Input.
const INPUT =
  'w-full rounded-lg border bg-background/60 px-3 py-2 text-sm shadow-inner outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/50 focus:border-flame/60 focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-flame)_15%,transparent)]'

/**
 * Shared shell for a signable action. Standardized anatomy: flame-accent
 * header bar → description + fields → footer CTA. Cards stretch to equal
 * heights inside grids so mixed sections never look ragged.
 */
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
  const { notify } = useNotify()
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const onClick = async () => {
    setStatus({ kind: 'signing' })
    try {
      const sig = await run({ connection, wallet, send: sendIxns })
      setStatus({ kind: 'done', sig })
      notify('success', title, { message: 'Transaction confirmed on devnet.', txSig: sig })
      await queryClient.invalidateQueries()
    } catch (err) {
      const message = humanizeError(err)
      setStatus({ kind: 'error', message })
      notify('error', `${title} failed`, { message })
    }
  }

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/50 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.75)] ring-1 ring-foreground/[0.02] ring-inset backdrop-blur-sm transition-colors duration-300 hover:border-line-strong">
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2.5">
        <span
          aria-hidden
          className="h-3.5 w-1 shrink-0 rounded-full bg-gradient-to-b from-flame to-flame-deep"
        />
        <h3 className="min-w-0 truncate font-semibold text-sm">{title}</h3>
      </div>
      <div
        aria-hidden
        className="mx-4 h-px bg-gradient-to-r from-border via-border/50 to-transparent"
      />

      <div className="flex-1 px-4 py-3">
        <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
        {children ? <div className="mt-3 space-y-3">{children}</div> : null}
      </div>

      <div className="border-border/40 border-t px-4 py-3">
        <Button
          onClick={onClick}
          disabled={disabled || status.kind === 'signing'}
          className="w-full"
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
            className="mt-2 inline-flex items-center gap-1 text-flame text-xs hover:text-flame-hover"
          >
            Confirmed on devnet
            <ArrowUpRight className="size-3" aria-hidden />
          </a>
        ) : null}
        {status.kind === 'error' ? (
          <p className="mt-2 break-words text-red-400/90 text-xs">{status.message}</p>
        ) : null}
      </div>
    </section>
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
      <span className={LABEL}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1.5 font-mono ${INPUT} ${valid ? 'border-border' : 'border-red-500/60'}`}
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
      <span className={LABEL}>{label}</span>
      <div className="mt-1.5 flex items-center rounded-lg border border-border bg-background/60 px-3 shadow-inner transition-[border-color,box-shadow] duration-200 focus-within:border-flame/60 focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-flame)_15%,transparent)]">
        <input
          value={value}
          inputMode="decimal"
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder="0.00"
          className="w-full bg-transparent py-2 font-mono text-sm outline-none placeholder:text-muted-foreground/50"
        />
        <span className="shrink-0 text-muted-foreground text-xs">{suffix}</span>
      </div>
    </label>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
}) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1.5 border-border ${INPUT} ${mono ? 'font-mono' : ''}`}
      />
    </label>
  )
}

export function SelectField<T extends string | number>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      <select
        value={value}
        onChange={(e) => {
          const raw = e.target.value
          const match = options.find((o) => String(o.value) === raw)
          if (match) onChange(match.value)
        }}
        className={`mt-1.5 border-border ${INPUT}`}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
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
