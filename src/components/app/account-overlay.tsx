import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  type TransactionInstruction,
} from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeftRight,
  BadgeCheck,
  Check,
  Copy,
  Droplets,
  ExternalLink,
  Eye,
  EyeOff,
  Hash,
  Loader2,
  LogOut,
  Monitor,
  Moon,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sun,
  Trash2,
  User,
  UserCog,
  WalletCards,
  X,
} from 'lucide-react'
import {
  type ComponentType,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { isPubkey } from '@/components/app/action-panel'
import { useAuthFlow, useLogout } from '@/components/app/auth-flow'
import { useMoney } from '@/components/app/money'
import {
  DataRow,
  FieldRow,
  Group,
  Input,
  Row,
  Segmented,
  Switch,
} from '@/components/app/settings-kit'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { activeRpcEndpoint, RPC_OVERRIDE_KEY } from '@/components/wallet/provider'
import { useVestaAuth } from '@/lib/auth/context'
import { LANGUAGES } from '@/lib/i18n'
import { humanizeError, useNotify } from '@/lib/notify/context'
import { type Theme, useSettings } from '@/lib/settings/context'
import type { Merchant } from '@/lib/vesta/decode'
import { acceptAdminIx, setAdminIx, setPausedIx, verifyMerchantIx } from '@/lib/vesta/ixns'
import {
  useConfig,
  useHoldings,
  useMerchants,
  useMyIssuer,
  useMyMerchant,
  useSolBalance,
} from '@/lib/vesta/queries'
import { sendIxns } from '@/lib/vesta/tx'
import { setAlias, useWalletAlias, useWalletAliases } from '@/lib/wallet/aliases'

export type AccountSection = 'profile' | 'wallets' | 'funds' | 'preferences' | 'admin'

interface OverlayState {
  open: (section?: AccountSection) => void
  close: () => void
}
const Ctx = createContext<OverlayState | null>(null)

export function useAccountOverlay(): OverlayState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAccountOverlay must be used within AccountOverlayProvider')
  return ctx
}

const MENU: {
  id: AccountSection
  label: string
  icon: ComponentType<{ className?: string }>
  desc: string
}[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    desc: 'Your identity, roles, and session on VESTA.',
  },
  {
    id: 'wallets',
    label: 'Wallets',
    icon: WalletCards,
    desc: 'Manage connected wallets and set aliases.',
  },
  {
    id: 'funds',
    label: 'Wallet & funds',
    icon: Droplets,
    desc: 'Top up devnet SOL, send it, and pick your RPC.',
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: Hash,
    desc: 'Display, privacy, theme, and language.',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: Shield,
    desc: 'Protocol controls and the merchant registry.',
  },
]

/** Provides the account overlay to the whole app subtree and renders it once. */
export function AccountOverlayProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; section: AccountSection }>({
    open: false,
    section: 'profile',
  })
  const value = useMemo<OverlayState>(
    () => ({
      open: (section = 'profile') => setState({ open: true, section }),
      close: () => setState((s) => ({ ...s, open: false })),
    }),
    [],
  )
  return (
    <Ctx.Provider value={value}>
      {children}
      {state.open ? <AccountOverlay initial={state.section} onClose={value.close} /> : null}
    </Ctx.Provider>
  )
}

function AccountOverlay({ initial, onClose }: { initial: AccountSection; onClose: () => void }) {
  const { publicKey } = useWallet()
  const logout = useLogout()
  const handleLogout = () => {
    onClose()
    logout()
  }
  const [section, setSection] = useState<AccountSection>(initial)
  const active = MENU.find((m) => m.id === section)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // Compact centered modal: a settings card with a left section rail and a
  // scrollable content pane — sized to its content, not the whole viewport.
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 animate-in fade-in bg-background/70 backdrop-blur-sm"
      />

      <div className="relative z-10 flex h-[72vh] max-h-[88vh] min-h-[540px] w-full max-w-3xl animate-in fade-in zoom-in-95 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl duration-150 sm:min-w-[640px]">
        <div className="flex items-center gap-3 border-border/60 border-b px-4 py-3">
          {active ? <active.icon className="size-4 text-flame" aria-hidden /> : null}
          <div className="min-w-0 flex-1">
            <h2 className="font-heading font-semibold text-sm">{active?.label}</h2>
            <p className="truncate text-muted-foreground text-xs">{active?.desc}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Rail */}
          <nav className="scrollbar-none hidden w-44 shrink-0 flex-col gap-0.5 overflow-y-auto border-border/60 border-r p-2 sm:flex">
            {MENU.map((m) => (
              <RailButton
                key={m.id}
                active={section === m.id}
                onClick={() => setSection(m.id)}
                icon={m.icon}
                label={m.label}
              />
            ))}
            {publicKey ? (
              <>
                <div className="my-1 h-px bg-border/60" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-red-400/90 text-sm transition-colors hover:bg-red-500/10"
                >
                  <LogOut className="size-4 shrink-0" aria-hidden />
                  Sign out
                </button>
              </>
            ) : null}
          </nav>

          {/* Mobile section tabs */}
          <div className="scrollbar-none flex gap-1 overflow-x-auto border-border/60 border-b p-2 sm:hidden">
            {MENU.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSection(m.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  section === m.id ? 'bg-flame/10 font-medium text-flame' : 'text-muted-foreground'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="scrollbar-flame min-w-0 flex-1 overflow-y-auto p-5">
            {!publicKey ? (
              <p className="text-muted-foreground text-sm">
                Connect a wallet to manage your account.
              </p>
            ) : section === 'profile' ? (
              <ProfileSection address={publicKey.toBase58()} onLogout={handleLogout} />
            ) : section === 'wallets' ? (
              <WalletsSection current={publicKey.toBase58()} />
            ) : section === 'funds' ? (
              <FundsSection />
            ) : section === 'preferences' ? (
              <PreferencesSection />
            ) : (
              <AdminSection />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function RailButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
        active
          ? 'bg-flame/10 font-medium text-flame'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      }`}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {label}
    </button>
  )
}

// ── wallets ───────────────────────────────────────────────────────────────────

function WalletsSection({ current }: { current: string }) {
  const { walletBook, forgetWallet } = useVestaAuth()
  const { setVisible } = useWalletModal()
  const { switchWallet } = useAuthFlow()
  const aliases = useWalletAliases()
  const list = Array.from(new Set([current, ...walletBook]))

  return (
    <div className="space-y-4">
      <Group
        title="Your wallets"
        icon={WalletCards}
        desc="Switching disconnects the current wallet and opens the picker. To pick a different account inside the same wallet, change it in the extension first."
      >
        {list.map((addr) => (
          <WalletRow
            key={addr}
            address={addr}
            alias={aliases[addr]}
            isActive={addr === current}
            onForget={() => forgetWallet(addr)}
            onSwitch={switchWallet}
          />
        ))}
        <Row
          icon={Plus}
          title={<span className="text-flame">Connect another wallet</span>}
          onClick={() => setVisible(true)}
        />
      </Group>
    </div>
  )
}

function WalletRow({
  address,
  alias,
  isActive,
  onForget,
  onSwitch,
}: {
  address: string
  alias?: string
  isActive: boolean
  onForget: () => void
  onSwitch: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(alias ?? '')
  const [copied, setCopied] = useState(false)

  const save = () => {
    setAlias(address, draft)
    setEditing(false)
  }
  const copy = () => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    })
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className="size-9 shrink-0 rounded-lg ring-1 ring-flame/30"
          style={{ background: gradient(address) }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium text-sm">{alias || 'Unnamed wallet'}</p>
            {isActive ? (
              <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">
                Active
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5">
            <p className="truncate font-mono text-muted-foreground text-xs">
              {address.slice(0, 6)}…{address.slice(-6)}
            </p>
            <button
              type="button"
              onClick={copy}
              className="text-muted-foreground/70 hover:text-foreground"
              aria-label="Copy"
            >
              {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            </button>
          </div>
        </div>
        {!isActive ? (
          <button
            type="button"
            onClick={onSwitch}
            className="inline-flex items-center gap-1 rounded-lg border border-flame/40 px-2.5 py-1 text-flame text-xs transition-colors hover:bg-flame/10"
          >
            <ArrowLeftRight className="size-3" aria-hidden />
            Switch
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setDraft(alias ?? '')
            setEditing((v) => !v)
          }}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Rename"
        >
          <Pencil className="size-3.5" />
        </button>
        {!isActive ? (
          <button
            type="button"
            onClick={onForget}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
            aria-label="Forget"
          >
            <Trash2 className="size-3.5" />
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-3 flex gap-2">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            maxLength={24}
            placeholder="e.g. Main, Treasury, Demo"
          />
          <Button size="sm" onClick={save}>
            Save
          </Button>
        </div>
      ) : null}
    </div>
  )
}

// ── profile ───────────────────────────────────────────────────────────────────

function ProfileSection({ address, onLogout }: { address: string; onLogout: () => void }) {
  const balance = useSolBalance()
  const { format } = useMoney()
  const { session } = useVestaAuth()
  const holdings = useHoldings()
  const merchant = useMyMerchant()
  const issuer = useMyIssuer()
  const config = useConfig()
  const alias = useWalletAlias(address)
  const isAdmin = !!config.data && config.data.admin.toBase58() === address
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const roles: { label: string; icon: ComponentType<{ className?: string }>; tone: string }[] = [
    { label: 'Customer', icon: User, tone: 'bg-emerald-500/10 text-emerald-300' },
  ]
  if (merchant.data)
    roles.push({ label: 'Merchant', icon: Droplets, tone: 'bg-flame/10 text-flame' })
  if (issuer.data)
    roles.push({ label: 'Issuer', icon: BadgeCheck, tone: 'bg-cyan-500/10 text-cyan-300' })
  if (isAdmin)
    roles.push({ label: 'Admin', icon: Shield, tone: 'bg-purple-500/10 text-purple-300' })

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="flex items-center gap-4 rounded-xl border border-flame/30 bg-gradient-to-br from-flame/[0.06] to-transparent p-4">
        <Avatar seed={address} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading font-semibold text-lg">{alias ?? 'Your wallet'}</p>
          <p className="font-heading font-semibold text-2xl tabular-nums">
            {balance.isLoading ? '…' : format(balance.data ?? 0, { digits: 3 })}
            <span className="ml-1.5 text-muted-foreground text-sm">SOL</span>
          </p>
        </div>
      </div>

      <Group title="Identity">
        <DataRow label="Address" value={`${address.slice(0, 8)}…${address.slice(-8)}`}>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={copy}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Copy"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
            <a
              href={`https://explorer.solana.com/address/${address}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Explorer"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </DataRow>
        <div className="flex flex-wrap gap-1.5 px-4 py-3">
          {roles.map((r) => (
            <span
              key={r.label}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${r.tone}`}
            >
              <r.icon className="size-2.5" aria-hidden />
              {r.label}
            </span>
          ))}
        </div>
      </Group>

      <Group title="Overview">
        <DataRow
          label="Devnet SOL"
          value={balance.isLoading ? '…' : `${format(balance.data ?? 0, { digits: 4 })}`}
        />
        <DataRow
          label="Tokens held"
          value={holdings.isLoading ? '…' : String(holdings.data?.length ?? 0)}
          mono={false}
        />
        <DataRow label="Merchant account" value={merchant.data ? 'Yes' : 'No'} mono={false} />
        <DataRow label="Attestation issuer" value={issuer.data ? 'Yes' : 'No'} mono={false} />
      </Group>

      {session ? (
        <Group title="Session">
          <DataRow
            label="Signed in"
            value={new Date(session.issuedAt).toLocaleString()}
            mono={false}
          />
          <DataRow
            label="Expires"
            value={new Date(session.expiresAt).toLocaleString()}
            mono={false}
          />
          <Row title="End this session">
            <Button variant="outline" size="sm" className="border-line-strong" onClick={onLogout}>
              <LogOut className="size-4" aria-hidden />
              Sign out
            </Button>
          </Row>
        </Group>
      ) : null}
    </div>
  )
}

function gradient(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return `conic-gradient(from 140deg, hsl(${h} 80% 55%), hsl(${(h + 60) % 360} 75% 45%), hsl(${h} 80% 55%))`
}

function Avatar({ seed }: { seed: string }) {
  return (
    <div
      className="size-14 shrink-0 rounded-2xl ring-2 ring-flame/30"
      style={{ background: gradient(seed) }}
      aria-hidden
    />
  )
}

// ── funds ─────────────────────────────────────────────────────────────────────

const FAUCETS = [
  { label: 'faucet.solana.com', href: 'https://faucet.solana.com' },
  { label: 'Helius', href: 'https://www.helius.dev/faucet' },
  { label: 'QuickNode', href: 'https://faucet.quicknode.com/solana/devnet' },
]

/** Sign+send a set of instructions with unified busy state + toast feedback. */
function useSignAction() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const qc = useQueryClient()
  const { notify } = useNotify()
  const [busy, setBusy] = useState(false)
  const run = async (label: string, ixns: TransactionInstruction[]) => {
    if (!wallet.publicKey) return
    setBusy(true)
    try {
      const sig = await sendIxns(connection, wallet, ixns)
      notify('success', label, { message: 'Confirmed on devnet.', txSig: sig })
      await qc.invalidateQueries()
    } catch (e) {
      notify('error', `${label} failed`, { message: humanizeError(e) })
    } finally {
      setBusy(false)
    }
  }
  return { run, busy }
}

function FundsSection() {
  return (
    <div className="space-y-4">
      <AirdropCard />
      <SendSolCard />
      <RpcCard />
    </div>
  )
}

function AirdropCard() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const { notify } = useNotify()
  const queryClient = useQueryClient()
  const balance = useSolBalance()
  const { format } = useMoney()
  const [busy, setBusy] = useState<number | null>(null)

  const airdrop = async (amount: number) => {
    if (!publicKey) return
    setBusy(amount)
    try {
      const sig = await connection.requestAirdrop(publicKey, amount * LAMPORTS_PER_SOL)
      const bh = await connection.getLatestBlockhash()
      await connection.confirmTransaction({ signature: sig, ...bh }, 'confirmed')
      await queryClient.invalidateQueries({ queryKey: ['sol-balance'] })
      notify('success', 'Airdrop confirmed', { message: `${amount} SOL received.`, txSig: sig })
    } catch {
      notify('error', 'Airdrop failed', {
        message: 'The public faucet is rate-limited — try a web faucet below.',
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <Group
      title="Devnet SOL"
      icon={Droplets}
      desc="The public faucet is often rate-limited — the web faucets are reliable fallbacks."
    >
      <DataRow
        label="Balance"
        value={balance.isLoading ? '…' : `${format(balance.data ?? 0, { digits: 4 })} SOL`}
      />
      <Row icon={Droplets} title="Airdrop" desc="Top up gas for signing">
        <div className="flex gap-1.5">
          {[1, 2, 5].map((a) => (
            <Button
              key={a}
              variant="outline"
              size="sm"
              className="border-line-strong"
              disabled={busy !== null}
              onClick={() => airdrop(a)}
            >
              {busy === a ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
              {a}
            </Button>
          ))}
        </div>
      </Row>
      <div className="flex flex-wrap gap-3 px-4 py-3">
        {FAUCETS.map((f) => (
          <a
            key={f.href}
            href={f.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-flame text-xs transition-colors hover:text-flame-hover"
          >
            {f.label} <ExternalLink className="size-3" aria-hidden />
          </a>
        ))}
      </div>
    </Group>
  )
}

function SendSolCard() {
  const { publicKey } = useWallet()
  const { run, busy } = useSignAction()
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const lamports = (() => {
    const n = Number(amount)
    return Number.isFinite(n) && n > 0 ? Math.round(n * LAMPORTS_PER_SOL) : 0
  })()
  const ready = isPubkey(to) && lamports > 0 && !!publicKey

  return (
    <Group title="Send SOL" desc="A plain System Program transfer, signed by you.">
      <FieldRow label="Recipient">
        <Input
          mono
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Wallet address"
        />
      </FieldRow>
      <FieldRow label="Amount (SOL)">
        <Input
          value={amount}
          inputMode="decimal"
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder="0.00"
        />
      </FieldRow>
      <div className="px-4 py-3">
        <Button
          className="w-full"
          disabled={!ready || busy}
          onClick={() =>
            publicKey &&
            run('Send SOL', [
              SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: new PublicKey(to),
                lamports,
              }),
            ])
          }
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Send SOL
        </Button>
      </div>
    </Group>
  )
}

function RpcCard() {
  const [value, setValue] = useState(() => localStorage.getItem(RPC_OVERRIDE_KEY) ?? '')
  const [saved, setSaved] = useState(false)
  const current = activeRpcEndpoint()

  const apply = () => {
    const trimmed = value.trim()
    if (trimmed) localStorage.setItem(RPC_OVERRIDE_KEY, trimmed)
    else localStorage.removeItem(RPC_OVERRIDE_KEY)
    setSaved(true)
  }

  return (
    <Group title="Network / RPC" desc={`Active: ${current}`}>
      <FieldRow
        label="Custom devnet RPC"
        desc="Point the app at a private endpoint (e.g. Helius) to dodge public rate limits. Applies on reload."
      >
        <Input
          mono
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setSaved(false)
          }}
          placeholder="https://devnet.helius-rpc.com/?api-key=…"
        />
      </FieldRow>
      <div className="flex items-center gap-3 px-4 py-3">
        <Button size="sm" onClick={apply}>
          Save
        </Button>
        {saved ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 text-flame text-sm hover:text-flame-hover"
          >
            <RefreshCw className="size-3.5" aria-hidden /> Reload to apply
          </button>
        ) : null}
      </div>
    </Group>
  )
}

// ── preferences ───────────────────────────────────────────────────────────────

const THEMES: { value: Theme; key: string; icon: ComponentType<{ className?: string }> }[] = [
  { value: 'light', key: 'theme.light', icon: Sun },
  { value: 'dark', key: 'theme.dark', icon: Moon },
  { value: 'system', key: 'theme.system', icon: Monitor },
]

function PreferencesSection() {
  const { theme, setTheme, hideBalances, setHideBalances, compact, setCompact } = useSettings()
  const { t, i18n } = useTranslation()

  return (
    <div className="space-y-4">
      <Group title="Display">
        <Row
          icon={hideBalances ? EyeOff : Eye}
          title="Hide balances"
          desc="Mask every monetary value behind dots."
        >
          <Switch checked={hideBalances} onChange={setHideBalances} />
        </Row>
        <Row icon={Hash} title="Round figures" desc="Drop cents and compact large numbers.">
          <Switch checked={compact} onChange={setCompact} />
        </Row>
      </Group>

      <Group title="Appearance">
        <Row title={t('settings.theme')}>
          <Segmented
            value={theme}
            onChange={setTheme}
            options={THEMES.map((x) => ({ value: x.value, icon: x.icon }))}
          />
        </Row>
      </Group>

      <Group title={t('settings.language')}>
        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
          {LANGUAGES.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => void i18n.changeLanguage(opt.code)}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                i18n.resolvedLanguage === opt.code
                  ? 'border-flame/60 bg-flame/10 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Group>
    </div>
  )
}

// ── admin ─────────────────────────────────────────────────────────────────────

function AdminSection() {
  const { publicKey } = useWallet()
  const config = useConfig()
  const { run, busy } = useSignAction()
  const isAdmin = !!publicKey && !!config.data && config.data.admin.equals(publicKey)
  const isPending =
    !!publicKey && !!config.data?.pendingAdmin && config.data.pendingAdmin.equals(publicKey)
  const paused = config.data?.paused
  const shortA = (k?: string) => (k ? `${k.slice(0, 6)}…${k.slice(-6)}` : '—')

  return (
    <div className="space-y-4">
      <Group title="Protocol" icon={Shield}>
        <DataRow
          label="Status"
          mono={false}
          value={
            config.isLoading ? (
              '…'
            ) : (
              <span
                className={paused ? 'font-medium text-red-400' : 'font-medium text-emerald-400'}
              >
                {paused ? 'Paused' : 'Live'}
              </span>
            )
          }
        />
        <DataRow label="Admin" value={shortA(config.data?.admin.toBase58())} />
        <DataRow
          label="Pending admin"
          value={config.data?.pendingAdmin ? shortA(config.data.pendingAdmin.toBase58()) : 'none'}
        />
      </Group>

      {!config.isLoading && !isAdmin && !isPending ? (
        <Group title="Access">
          <Row
            icon={ShieldAlert}
            title="Read-only"
            desc="This wallet isn't the protocol admin. You can monitor status and the registry, but controls are hidden."
          />
        </Group>
      ) : null}

      {isAdmin ? (
        <Group title="Controls">
          <Row
            icon={paused ? PlayCircle : PauseCircle}
            title={paused ? 'Resume protocol' : 'Pause protocol'}
            desc="Circuit breaker — halts earn / redeem / swap. Transfers keep working."
          >
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                publicKey &&
                run(paused ? 'Resume protocol' : 'Pause protocol', [
                  setPausedIx(publicKey, !paused),
                ])
              }
            >
              {paused ? 'Resume' : 'Pause'}
            </Button>
          </Row>
          <TransferAdminRow run={run} busy={busy} />
        </Group>
      ) : null}

      {isPending ? (
        <Group title="Handover">
          <Row
            icon={UserCog}
            title="Accept admin role"
            desc="You're the pending admin — accept to complete the two-step transfer."
          >
            <Button
              size="sm"
              disabled={busy}
              onClick={() => publicKey && run('Accept admin', [acceptAdminIx(publicKey)])}
            >
              Accept
            </Button>
          </Row>
        </Group>
      ) : null}

      <MerchantRegistry isAdmin={isAdmin} />
    </div>
  )
}

function TransferAdminRow({
  run,
  busy,
}: {
  run: (label: string, ixns: TransactionInstruction[]) => void
  busy: boolean
}) {
  const { publicKey } = useWallet()
  const [next, setNext] = useState('')
  return (
    <>
      <FieldRow
        label="Transfer admin"
        desc="Two-step — the recipient must accept from their own wallet, so a typo can't lock you out."
      >
        <Input
          mono
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="New admin wallet"
        />
      </FieldRow>
      <div className="px-4 py-3">
        <Button
          size="sm"
          disabled={!isPubkey(next) || busy}
          onClick={() =>
            publicKey && run('Propose admin', [setAdminIx(publicKey, new PublicKey(next))])
          }
        >
          Propose new admin
        </Button>
      </div>
    </>
  )
}

function MerchantRegistry({ isAdmin }: { isAdmin: boolean }) {
  const merchants = useMerchants()
  return (
    <Group
      title="Merchant registry"
      icon={BadgeCheck}
      right={
        merchants.data ? (
          <span className="text-muted-foreground/60 text-xs tabular-nums">
            {merchants.data.length}
          </span>
        ) : undefined
      }
    >
      {merchants.isLoading ? (
        <div className="p-4">
          <Skeleton className="h-24" />
        </div>
      ) : merchants.data && merchants.data.length > 0 ? (
        merchants.data.map((m) => (
          <MerchantRow key={m.address.toBase58()} merchant={m} isAdmin={isAdmin} />
        ))
      ) : (
        <div className="px-4 py-6 text-center text-muted-foreground text-sm">
          No merchants registered.
        </div>
      )}
    </Group>
  )
}

function MerchantRow({ merchant, isAdmin }: { merchant: Merchant; isAdmin: boolean }) {
  const { publicKey } = useWallet()
  const { run, busy } = useSignAction()

  return (
    <Row
      title={
        <span className="flex items-center gap-1.5">
          <span className="truncate">{merchant.name}</span>
          {merchant.verified ? (
            <BadgeCheck className="size-3.5 shrink-0 text-flame" aria-label="Verified" />
          ) : null}
        </span>
      }
      desc={`${merchant.customerCount.toString()} customers`}
    >
      {isAdmin ? (
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            publicKey &&
            run(merchant.verified ? 'Unverify merchant' : 'Verify merchant', [
              verifyMerchantIx(publicKey, merchant.address, !merchant.verified),
            ])
          }
          className={`rounded-lg border px-2.5 py-1 text-xs transition-colors disabled:opacity-50 ${
            merchant.verified
              ? 'border-border text-muted-foreground hover:text-foreground'
              : 'border-flame/40 text-flame hover:bg-flame/10'
          }`}
        >
          {busy ? '…' : merchant.verified ? 'Unverify' : 'Verify'}
        </button>
      ) : null}
    </Row>
  )
}
