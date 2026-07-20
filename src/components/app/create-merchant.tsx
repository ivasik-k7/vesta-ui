import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { CircleCheck, Loader2, Store, X } from 'lucide-react'
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { DataRow, FieldRow, Group, Input } from '@/components/app/settings-kit'
import { humanizeError, useNotify } from '@/lib/notify/context'
import { registerMerchantIx } from '@/lib/vesta/ixns'
import { sendIxns } from '@/lib/vesta/tx'

interface CreateMerchantState {
  open: () => void
}
const Ctx = createContext<CreateMerchantState | null>(null)

export function useCreateMerchant(): CreateMerchantState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCreateMerchant must be used within CreateMerchantProvider')
  return ctx
}

/** Provides the "Create merchant" overlay to the app subtree. */
export function CreateMerchantProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false)
  const value = useMemo<CreateMerchantState>(() => ({ open: () => setActive(true) }), [])
  return (
    <Ctx.Provider value={value}>
      {children}
      {active ? <CreateMerchantOverlay onClose={() => setActive(false)} /> : null}
    </Ctx.Provider>
  )
}

function CreateMerchantOverlay({ onClose }: { onClose: () => void }) {
  const { connection } = useConnection()
  const wallet = useWallet()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { notify } = useNotify()

  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [decay, setDecay] = useState('20')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const decayBps = -Math.round(Number(decay) * 100)
  const ready =
    name.trim().length > 0 &&
    name.length <= 32 &&
    symbol.trim().length > 0 &&
    symbol.length <= 10 &&
    Number.isFinite(decayBps)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, busy])

  const register = async () => {
    if (!wallet.publicKey || !ready) return
    setBusy(true)
    try {
      const sig = await sendIxns(connection, wallet, [
        registerMerchantIx({
          authority: wallet.publicKey,
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          uri: 'https://dev-vesta.netlify.app/points.json',
          decayRateBps: decayBps,
          baseEarnRate: 100n,
        }),
      ])
      notify('success', 'Merchant created', { message: `${name.trim()} is live.`, txSig: sig })
      await qc.invalidateQueries()
      setDone(true)
      setTimeout(() => {
        onClose()
        localStorage.setItem('vesta.mode', 'merchant')
        navigate({ to: '/app/console' })
      }, 1100)
    } catch (e) {
      notify('error', 'Could not create merchant', { message: humanizeError(e) })
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[92] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={busy ? undefined : onClose}
        className="fixed inset-0 animate-in fade-in bg-background/75 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl duration-150">
        <div className="flex items-center gap-2 border-border/60 border-b px-4 py-3">
          <Store className="size-4 text-flame" aria-hidden />
          <h2 className="font-heading font-semibold text-sm">Become a merchant</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="ml-auto rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {done ? (
            <p className="flex items-center justify-center gap-2 py-6 text-emerald-400 text-sm">
              <CircleCheck className="size-4" aria-hidden /> Merchant created — opening your
              console…
            </p>
          ) : (
            <>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Launch your own loyalty program in one signed transaction — a Token-2022 point mint
                with decay, an argus transfer guard, and a clawback delegate. You become its sole
                authority.
              </p>

              <Group title="Brand">
                <FieldRow label="Brand name (≤32)">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Kavarna"
                  />
                </FieldRow>
                <FieldRow label="Symbol (≤10)">
                  <Input
                    mono
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="KAV"
                  />
                </FieldRow>
                <FieldRow
                  label="Annual decay (%/yr)"
                  desc="How fast unspent points cool. 20 = −20%/yr — the VESTA default."
                >
                  <Input
                    value={decay}
                    inputMode="decimal"
                    onChange={(e) => setDecay(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="20"
                  />
                </FieldRow>
                <DataRow label="Initial supply" value="0 — minted on demand" mono={false} />
                <DataRow label="Decimals" value="2" />
              </Group>

              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                There's no supply to set: the point token starts at <b>0</b> and mints only when you
                issue points to customers (uncapped, and every balance decays over time). You
                control issuance from the console.
              </p>

              <button
                type="button"
                onClick={register}
                disabled={!ready || busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-flame py-2.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-flame-hover disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Register merchant
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
