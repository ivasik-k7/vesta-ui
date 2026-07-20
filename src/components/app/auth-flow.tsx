import type { WalletName } from '@solana/wallet-adapter-base'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  Check,
  CircleCheck,
  Loader2,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  WalletCards,
  X,
} from 'lucide-react'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

import { useVestaAuth } from '@/lib/auth/context'
import { humanizeError } from '@/lib/notify/context'
import { useWalletAlias } from '@/lib/wallet/aliases'

type Intent = 'login' | 'switch'

interface AuthFlowState {
  login: () => void
  switchWallet: () => void
}
const Ctx = createContext<AuthFlowState | null>(null)

export function useAuthFlow(): AuthFlowState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuthFlow must be used within AuthFlowProvider')
  return ctx
}

/**
 * Sign out, then continue to another known wallet if one exists (via the switch
 * flow), otherwise return to the landing page.
 */
export function useLogout(): () => void {
  const { publicKey } = useWallet()
  const { walletBook, signOut } = useVestaAuth()
  const { switchWallet } = useAuthFlow()
  const navigate = useNavigate()
  return useCallback(() => {
    const current = publicKey?.toBase58() ?? null
    const others = walletBook.filter((a) => a !== current)
    signOut()
    if (others.length > 0) switchWallet()
    else navigate({ to: '/' })
  }, [publicKey, walletBook, signOut, switchWallet, navigate])
}

function gradient(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return `conic-gradient(from 140deg, hsl(${h} 80% 55%), hsl(${(h + 60) % 360} 75% 45%), hsl(${h} 80% 55%))`
}
const shorten = (k: string) => `${k.slice(0, 4)}…${k.slice(-4)}`

/** One driven auth flow for both first login and wallet switching. */
export function AuthFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ active: boolean; intent: Intent }>({
    active: false,
    intent: 'login',
  })
  const value = useMemo<AuthFlowState>(
    () => ({
      login: () => setState({ active: true, intent: 'login' }),
      switchWallet: () => setState({ active: true, intent: 'switch' }),
    }),
    [],
  )
  return (
    <Ctx.Provider value={value}>
      {children}
      {state.active ? (
        <AuthDialog
          intent={state.intent}
          onClose={() => setState((s) => ({ ...s, active: false }))}
        />
      ) : null}
    </Ctx.Provider>
  )
}

type Step = 'confirm' | 'connect' | 'sign' | 'done'
const STEPS: { key: Exclude<Step, 'confirm'>; label: string }[] = [
  { key: 'connect', label: 'Connect' },
  { key: 'sign', label: 'Sign in' },
  { key: 'done', label: 'Ready' },
]

function AuthDialog({ intent, onClose }: { intent: Intent; onClose: () => void }) {
  const { publicKey, wallets, wallet, select, connect, connected, connecting } = useWallet()
  const { setVisible } = useWalletModal()
  const { status, signIn, signOut, error: authError } = useVestaAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('confirm')
  const [target, setTarget] = useState<WalletName | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const armedRef = useRef(false)
  const connectingRef = useRef(false)
  const signinRef = useRef(false)
  const targetRef = useRef<WalletName | null>(null)
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fromRef = useRef<string | null>(publicKey?.toBase58() ?? null)

  const fromAlias = useWalletAlias(fromRef.current ?? undefined)
  const current = publicKey?.toBase58() ?? null
  const toAlias = useWalletAlias(current ?? undefined)
  const isLogin = intent === 'login'

  const detected = wallets.filter(
    (w) =>
      w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable,
  )

  const armAndSelect = useCallback(() => {
    if (armedRef.current) return
    armedRef.current = true
    if (targetRef.current) select(targetRef.current)
    else setVisible(true)
  }, [select, setVisible])

  const pick = useCallback(
    (name: WalletName | null) => {
      setErr(null)
      armedRef.current = false
      signinRef.current = false
      connectingRef.current = false
      targetRef.current = name
      fromRef.current = publicKey?.toBase58() ?? null
      setTarget(name)
      setStep('connect')
      qc.clear()
      signOut() // clear any session + disconnect for a clean slate
      if (armTimer.current) clearTimeout(armTimer.current)
      armTimer.current = setTimeout(() => armAndSelect(), 800)
    },
    [publicKey, qc, signOut, armAndSelect],
  )

  // Arm once the reset disconnect lands.
  useEffect(() => {
    if (step === 'connect' && !connected && !armedRef.current) armAndSelect()
  }, [step, connected, armAndSelect])

  // Drive the connect prompt for the chosen wallet.
  useEffect(() => {
    if (step !== 'connect' || !armedRef.current || !target) return
    if (wallet?.adapter.name !== target) return
    if (connected || connecting || connectingRef.current) return
    connectingRef.current = true
    connect()
      .catch((e) => setErr(humanizeError(e)))
      .finally(() => {
        connectingRef.current = false
      })
  }, [step, target, wallet, connected, connecting, connect])

  useEffect(() => {
    if (step === 'connect' && armedRef.current && connected && publicKey) setStep('sign')
  }, [step, connected, publicKey])

  // Drive the SIWS signature; complete when authenticated.
  useEffect(() => {
    if (step !== 'sign') return
    if (status === 'authenticated') {
      setStep('done')
      return
    }
    if (status === 'unauthenticated' && !signinRef.current) {
      signinRef.current = true
      void signIn().finally(() => {
        signinRef.current = false
      })
    }
  }, [step, status, signIn])

  useEffect(() => {
    if (step === 'sign' && authError) setErr(authError)
  }, [step, authError])

  // On success: login lands in the app; switch just closes.
  useEffect(() => {
    if (step !== 'done') return
    const t = setTimeout(() => {
      onClose()
      if (isLogin) navigate({ to: '/app' })
    }, 1200)
    return () => clearTimeout(t)
  }, [step, isLogin, navigate, onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && step === 'confirm' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      if (armTimer.current) clearTimeout(armTimer.current)
    }
  }, [step, onClose])

  const retry = () => {
    setErr(null)
    if (step === 'sign') {
      signinRef.current = true
      void signIn().finally(() => {
        signinRef.current = false
      })
    } else {
      pick(target)
    }
  }

  const activeIndex = step === 'connect' ? 0 : step === 'sign' ? 1 : step === 'done' ? 3 : -1

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={step === 'confirm' ? onClose : undefined}
        className="fixed inset-0 animate-in fade-in bg-background/75 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl duration-150">
        <div className="flex items-center gap-2 border-border/60 border-b px-4 py-3">
          <WalletCards className="size-4 text-flame" aria-hidden />
          <h2 className="font-heading font-semibold text-sm">
            {isLogin ? 'Sign in to VESTA' : 'Switch wallet'}
          </h2>
          {step === 'confirm' ? (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="p-5">
          {/* Framed graphic */}
          <div className="mb-5 flex items-center justify-center gap-4">
            {isLogin ? (
              <Node
                seed={step === 'done' ? current : null}
                label={
                  step === 'done'
                    ? (toAlias ?? (current ? shorten(current) : 'You'))
                    : 'Your wallet'
                }
                pending={step === 'connect' || step === 'sign'}
                done={step === 'done'}
                big
              />
            ) : (
              <>
                <Node
                  seed={fromRef.current}
                  label={fromRef.current ? (fromAlias ?? shorten(fromRef.current)) : 'None'}
                  dim={step !== 'confirm'}
                />
                <ArrowRight
                  className={`size-5 shrink-0 text-muted-foreground ${step === 'connect' || step === 'sign' ? 'animate-pulse text-flame' : ''}`}
                  aria-hidden
                />
                <Node
                  seed={step === 'done' ? current : null}
                  label={
                    step === 'done'
                      ? (toAlias ?? (current ? shorten(current) : 'New'))
                      : 'New wallet'
                  }
                  pending={step === 'connect' || step === 'sign'}
                  done={step === 'done'}
                />
              </>
            )}
          </div>

          {step === 'confirm' ? (
            <ConfirmStep
              isLogin={isLogin}
              detected={detected}
              onPick={(n) => pick(n)}
              onBrowse={() => pick(null)}
              onCancel={onClose}
            />
          ) : (
            <div className="space-y-4">
              <Stepper activeIndex={activeIndex} error={!!err} />

              {err ? (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/[0.06] p-3 text-sm">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-red-400">{err}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={retry}
                        className="inline-flex items-center gap-1 rounded-lg border border-flame/40 px-2.5 py-1 text-flame text-xs transition-colors hover:bg-flame/10"
                      >
                        <RotateCcw className="size-3" aria-hidden /> Retry
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-2.5 py-1 text-muted-foreground text-xs hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : step === 'done' ? (
                <p className="flex items-center justify-center gap-2 py-1 text-emerald-400 text-sm">
                  <CircleCheck className="size-4" aria-hidden />
                  {isLogin ? 'Signed in — entering VESTA…' : 'Signed in — welcome back.'}
                </p>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="size-4 animate-spin text-flame" aria-hidden />
                    {step === 'connect'
                      ? 'Approve the connection in your wallet…'
                      : 'Approve the sign-in request…'}
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 text-muted-foreground text-xs underline-offset-2 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function ConfirmStep({
  isLogin,
  detected,
  onPick,
  onBrowse,
  onCancel,
}: {
  isLogin: boolean
  detected: ReturnType<typeof useWallet>['wallets']
  onPick: (name: WalletName) => void
  onBrowse: () => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-border bg-background/60 p-3 text-muted-foreground text-xs leading-relaxed">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-flame" aria-hidden />
        <p>
          {isLogin
            ? 'Pick a wallet — it will connect and sign a one-time message to prove ownership. No transaction, no fees.'
            : 'The new wallet must connect and sign in — two quick approvals. Cached data is cleared, so nothing carries over. To use another account in the same wallet, switch it in the extension first.'}
        </p>
      </div>

      {detected.length > 0 ? (
        <div className="space-y-1.5">
          <p className="px-1 font-medium font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]">
            Detected wallets
          </p>
          {detected.map((w) => (
            <button
              key={w.adapter.name}
              type="button"
              onClick={() => onPick(w.adapter.name)}
              className="group flex w-full items-center gap-3 rounded-xl border border-border bg-background/40 px-3 py-2.5 text-left transition-colors hover:border-flame/40 hover:bg-flame/[0.05]"
            >
              {w.adapter.icon ? (
                <img src={w.adapter.icon} alt="" className="size-7 rounded-md" />
              ) : (
                <span className="grid size-7 place-items-center rounded-md bg-secondary">
                  <WalletCards className="size-4 text-muted-foreground" aria-hidden />
                </span>
              )}
              <span className="flex-1 font-medium text-sm">{w.adapter.name}</span>
              <ArrowRight className="size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-flame" />
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-border border-dashed bg-background/40 p-3 text-center text-muted-foreground text-xs">
          No wallets detected — install Phantom, Solflare, or Backpack, then “Browse all”.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border py-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onBrowse}
          className="flex-1 rounded-lg bg-flame py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-flame-hover"
        >
          Browse all
        </button>
      </div>
    </div>
  )
}

function Stepper({ activeIndex, error }: { activeIndex: number; error: boolean }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const done = activeIndex > i
        const active = activeIndex === i && !error
        const isErr = activeIndex === i && error
        return (
          <div key={s.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`grid size-7 place-items-center rounded-full border transition-colors ${
                  isErr
                    ? 'border-red-500/50 text-red-400'
                    : done
                      ? 'border-flame bg-flame text-primary-foreground'
                      : active
                        ? 'border-flame text-flame'
                        : 'border-border text-muted-foreground/50'
                }`}
              >
                {done ? (
                  <Check className="size-3.5" aria-hidden />
                ) : active && !isErr ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <span className="text-[11px]">{i + 1}</span>
                )}
              </div>
              <span
                className={`text-[10px] ${done || active ? 'text-foreground' : 'text-muted-foreground/50'}`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 ? (
              <div
                className={`mx-1 h-px flex-1 transition-colors ${activeIndex > i ? 'bg-flame/60' : 'bg-border'}`}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function Node({
  seed,
  label,
  dim,
  pending,
  done,
  big,
}: {
  seed: string | null
  label: string
  dim?: boolean
  pending?: boolean
  done?: boolean
  big?: boolean
}) {
  const size = big ? 'size-16' : 'size-12'
  return (
    <div
      className={`flex flex-col items-center gap-1.5 transition-opacity duration-300 ${dim ? 'opacity-40' : ''}`}
    >
      <div
        className={`grid ${size} place-items-center rounded-2xl ring-2 ${done ? 'ring-emerald-400/50' : 'ring-flame/30'}`}
        style={seed ? { background: gradient(seed) } : undefined}
      >
        {!seed ? (
          pending ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
          ) : (
            <WalletCards className="size-5 text-muted-foreground/50" aria-hidden />
          )
        ) : null}
      </div>
      <span className="max-w-24 truncate font-mono text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}
