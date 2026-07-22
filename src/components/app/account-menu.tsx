import { useWallet } from '@solana/wallet-adapter-react'
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Droplets,
  Eye,
  EyeOff,
  Hash,
  Languages,
  LogOut,
  Monitor,
  Moon,
  Shield,
  SlidersHorizontal,
  Store,
  Sun,
  User,
  WalletCards,
} from 'lucide-react'
import { type ComponentType, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAccountOverlay } from '@/components/app/account-overlay'
import { useAuthFlow, useLogout } from '@/components/app/auth-flow'
import { useMoney } from '@/components/app/money'
import { ConnectButton } from '@/components/wallet/connect-button'
import { useVestaAuth } from '@/lib/auth/context'
import { LANGUAGES } from '@/lib/i18n'
import { type Theme, useSettings } from '@/lib/settings/context'
import { useConfig, useMyIssuer, useMyMerchant, useSolBalance } from '@/lib/vesta/queries'
import { useWalletAlias } from '@/lib/wallet/aliases'

const short = (k: string) => `${k.slice(0, 4)}…${k.slice(-4)}`

function gradient(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return `conic-gradient(from 140deg, hsl(${h} 80% 55%), hsl(${(h + 60) % 360} 75% 45%), hsl(${h} 80% 55%))`
}

/** Header account hub: avatar trigger → compact dropdown whose actions open the
 *  full account overlay on top of the current page. */
export function AccountMenu() {
  const { publicKey } = useWallet()
  const { status } = useVestaAuth()

  if (!publicKey || status !== 'authenticated') return <ConnectButton />
  return <AuthedMenu address={publicKey.toBase58()} />
}

type View = 'main' | 'preferences'

function AuthedMenu({ address }: { address: string }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('main')
  const ref = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const prefsRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | undefined>(undefined)
  const overlay = useAccountOverlay()
  const alias = useWalletAlias(address)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') view === 'preferences' ? setView('main') : setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, view])

  // Animate the panel height to whichever layer is showing (the "push").
  useLayoutEffect(() => {
    if (!open) return
    const el = view === 'main' ? mainRef.current : prefsRef.current
    if (el) setHeight(el.scrollHeight)
  }, [open, view])

  useEffect(() => {
    if (!open) setView('main')
  }, [open])

  const go = (section: Parameters<typeof overlay.open>[0]) => {
    setOpen(false)
    overlay.open(section)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border py-1 pr-2.5 pl-1 transition-colors hover:border-flame/40"
      >
        <span
          className="size-7 rounded-full ring-1 ring-flame/30"
          style={{ background: gradient(address) }}
          aria-hidden
        />
        <span className="hidden text-sm sm:inline">
          {alias ? (
            <span className="font-medium">{alias}</span>
          ) : (
            <span className="font-mono">{short(address)}</span>
          )}
        </span>
        <ChevronDown
          className={`size-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          style={{ height }}
          className="absolute right-0 z-[80] mt-2 w-72 animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl transition-[height] duration-300 ease-out"
        >
          {/* Two stacked panels on a track; slide horizontally between them. */}
          <div
            className="flex w-[200%] transition-transform duration-300 ease-out"
            style={{ transform: view === 'preferences' ? 'translateX(-50%)' : 'translateX(0)' }}
          >
            <div
              ref={mainRef}
              className={`w-1/2 transition-opacity duration-200 ${view === 'preferences' ? 'opacity-40' : 'opacity-100'}`}
            >
              <MainLayer
                address={address}
                onPreferences={() => setView('preferences')}
                onOpen={go}
              />
            </div>
            <div
              ref={prefsRef}
              className={`w-1/2 transition-opacity duration-200 ${view === 'preferences' ? 'opacity-100' : 'opacity-40'}`}
            >
              <PreferencesLayer onBack={() => setView('main')} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MainLayer({
  address,
  onPreferences,
  onOpen,
}: {
  address: string
  onPreferences: () => void
  onOpen: (section: 'profile' | 'wallets' | 'funds' | 'admin') => void
}) {
  const balance = useSolBalance()
  const { format } = useMoney()
  const { switchWallet: requestSwitch } = useAuthFlow()
  const logout = useLogout()
  const alias = useWalletAlias(address)
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div>
      <div className="relative overflow-hidden border-border/60 border-b p-4">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-8 size-28 rounded-full bg-flame/10 blur-2xl"
        />
        <div className="relative flex items-center gap-3">
          <span
            className="size-11 shrink-0 rounded-xl ring-1 ring-flame/30"
            style={{ background: gradient(address) }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            {alias ? <p className="truncate font-medium text-sm">{alias}</p> : null}
            <div className="flex items-center gap-1.5">
              <p className={`font-mono ${alias ? 'text-muted-foreground text-xs' : 'text-sm'}`}>
                {short(address)}
              </p>
              <button
                type="button"
                onClick={copyAddress}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Copy address"
              >
                {copied ? (
                  <Check className="size-3 text-emerald-400" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
            </div>
            <p className="font-heading font-semibold text-lg tabular-nums">
              {balance.isLoading ? '…' : format(balance.data ?? 0, { digits: 3 })}
              <span className="ml-1 text-muted-foreground text-xs">SOL</span>
            </p>
          </div>
        </div>
      </div>

      <Capabilities address={address} />

      <div className="p-1.5">
        <Item icon={User} label="Profile" onClick={() => onOpen('profile')} chevron />
        <Item icon={WalletCards} label="Wallets" onClick={() => onOpen('wallets')} chevron />
        <Item icon={SlidersHorizontal} label="Preferences" onClick={onPreferences} chevron />
        <Item icon={Droplets} label="Wallet & funds" onClick={() => onOpen('funds')} chevron />
        <Item icon={Shield} label="Admin & protocol" onClick={() => onOpen('admin')} chevron />
      </div>

      <div className="border-border/60 border-t p-1.5">
        <Item icon={WalletCards} label="Switch wallet" onClick={requestSwitch} />
        <Item icon={LogOut} label="Sign out" onClick={logout} />
      </div>
    </div>
  )
}

/** Second-stage layer: quick prefs + language, reachable by drilling in. */
function PreferencesLayer({ onBack }: { onBack: () => void }) {
  const { i18n } = useTranslation()

  return (
    <div>
      <div className="flex items-center gap-2 border-border/60 border-b p-3">
        <button
          type="button"
          onClick={onBack}
          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </button>
        <p className="font-medium text-sm">Preferences</p>
      </div>

      <QuickSettings />

      <div className="px-4 py-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-muted-foreground text-xs">
          <Languages className="size-3.5" aria-hidden /> Language
        </p>
        <div className="grid grid-cols-4 gap-1">
          {LANGUAGES.map((o) => (
            <button
              key={o.code}
              type="button"
              onClick={() => void i18n.changeLanguage(o.code)}
              className={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
                i18n.resolvedLanguage === o.code
                  ? 'border-flame/60 bg-flame/10 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Live role badges read from the chain — the fine-grained "who am I" surface. */
function Capabilities({ address }: { address: string }) {
  const merchant = useMyMerchant()
  const issuer = useMyIssuer()
  const config = useConfig()
  const isAdmin = !!config.data && config.data.admin.toBase58() === address

  const chips: { label: string; icon: ComponentType<{ className?: string }>; tone: string }[] = [
    { label: 'Customer', icon: User, tone: 'bg-emerald-500/10 text-emerald-300' },
  ]
  if (merchant.data) chips.push({ label: 'Merchant', icon: Store, tone: 'bg-flame/10 text-flame' })
  if (issuer.data)
    chips.push({ label: 'Issuer', icon: BadgeCheck, tone: 'bg-cyan-500/10 text-cyan-300' })
  if (isAdmin)
    chips.push({ label: 'Admin', icon: Shield, tone: 'bg-purple-500/10 text-purple-300' })

  return (
    <div className="flex flex-wrap gap-1.5 border-border/60 border-b px-4 py-3">
      {chips.map((c) => (
        <span
          key={c.label}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${c.tone}`}
        >
          <c.icon className="size-2.5" aria-hidden />
          {c.label}
        </span>
      ))}
    </div>
  )
}

const THEMES: { value: Theme; icon: ComponentType<{ className?: string }> }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
]

/** Inline quick prefs — flip the common switches without opening the overlay. */
function QuickSettings() {
  const { theme, setTheme, hideBalances, setHideBalances, compact, setCompact } = useSettings()
  return (
    <div className="space-y-2.5 border-border/60 border-b px-4 py-3">
      <QuickRow icon={hideBalances ? EyeOff : Eye} label="Hide balances">
        <MiniSwitch checked={hideBalances} onChange={setHideBalances} />
      </QuickRow>
      <QuickRow icon={Hash} label="Round figures">
        <MiniSwitch checked={compact} onChange={setCompact} />
      </QuickRow>
      <QuickRow label="Theme">
        <div className="inline-flex rounded-lg border border-border p-0.5">
          {THEMES.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setTheme(o.value)}
              aria-label={o.value}
              className={`flex size-6 items-center justify-center rounded-md transition-colors ${
                theme === o.value
                  ? 'bg-flame text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <o.icon className="size-3.5" aria-hidden />
            </button>
          ))}
        </div>
      </QuickRow>
    </div>
  )
}

function QuickRow({
  icon: Icon,
  label,
  children,
}: {
  icon?: ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      {Icon ? (
        <Icon className="size-3.5 text-muted-foreground/70" aria-hidden />
      ) : (
        <span className="size-3.5" />
      )}
      <span className="flex-1 text-muted-foreground text-xs">{label}</span>
      {children}
    </div>
  )
}

function MiniSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-flame' : 'bg-secondary'}`}
    >
      <span
        className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm ring-1 ring-black/10 transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
      />
    </button>
  )
}

function Item({
  icon: Icon,
  label,
  onClick,
  chevron,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  chevron?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
    >
      <Icon className="size-4 text-muted-foreground" aria-hidden />
      {label}
      {chevron ? (
        <ChevronRight className="ml-auto size-4 text-muted-foreground/50" aria-hidden />
      ) : null}
    </button>
  )
}
