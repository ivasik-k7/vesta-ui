import { useWallet } from '@solana/wallet-adapter-react'
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

export type NotifyKind = 'success' | 'error' | 'info'

export interface AppNotification {
  id: string
  kind: NotifyKind
  title: string
  message?: string
  txSig?: string
  at: number
  seen: boolean
}

interface Toast {
  id: string
  kind: NotifyKind
  title: string
  message?: string
  txSig?: string
}

interface NotifyOpts {
  message?: string
  txSig?: string
  /** Also raise an ephemeral toast (default true). */
  toast?: boolean
  /** Also persist to the notification center (default true). */
  persist?: boolean
}

interface NotifyState {
  toasts: Toast[]
  notifications: AppNotification[]
  unread: number
  notify: (kind: NotifyKind, title: string, opts?: NotifyOpts) => void
  dismissToast: (id: string) => void
  markAllSeen: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotifyContext = createContext<NotifyState | null>(null)
const STORE_PREFIX = 'vesta.notifications'
const MAX = 60

// Notifications are private to a wallet — a switched-in account must never
// see the previous session's activity. Namespace the store by address.
const storeKey = (address: string | null) => `${STORE_PREFIX}:${address ?? 'anon'}`

let counter = 0
const nextId = () => {
  counter += 1
  return `n${Date.now().toString(36)}-${counter}`
}

function load(address: string | null): AppNotification[] {
  try {
    const raw = localStorage.getItem(storeKey(address))
    if (!raw) return []
    const parsed = JSON.parse(raw) as AppNotification[]
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : []
  } catch {
    return []
  }
}

export function NotifyProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet()
  const address = publicKey?.toBase58() ?? null
  const [toasts, setToasts] = useState<Toast[]>([])
  // Bundle the owning address with its items so the two can never drift: a
  // persist that runs mid-reswitch sees the old address and skips, and only
  // writes once the loaded history matches the connected wallet.
  const [store, setStore] = useState<{ address: string | null; items: AppNotification[] }>(() => ({
    address,
    items: load(address),
  }))
  const notifications = store.items
  const setNotifications = useCallback(
    (update: (prev: AppNotification[]) => AppNotification[]) =>
      setStore((prev) => ({ address: prev.address, items: update(prev.items) })),
    [],
  )
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Re-scope to the active wallet: load its history and drop any stale toasts
  // left over from the previous session.
  useEffect(() => {
    setStore((prev) => (prev.address === address ? prev : { address, items: load(address) }))
    setToasts((prev) => (prev.length === 0 ? prev : []))
  }, [address])

  useEffect(() => {
    if (store.address !== address) return // reconcile pending — don't cross-write
    try {
      localStorage.setItem(storeKey(address), JSON.stringify(store.items.slice(0, MAX)))
    } catch {
      // storage full / unavailable — non-fatal
    }
  }, [store, address])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const notify = useCallback(
    (kind: NotifyKind, title: string, opts: NotifyOpts = {}) => {
      const { message, txSig, toast = true, persist = true } = opts
      const id = nextId()
      if (persist) {
        setNotifications((prev) =>
          [{ id, kind, title, message, txSig, at: Date.now(), seen: false }, ...prev].slice(0, MAX),
        )
      }
      if (toast) {
        setToasts((prev) => [...prev, { id, kind, title, message, txSig }])
        const ttl = kind === 'error' ? 7000 : 4500
        const timer = setTimeout(() => dismissToast(id), ttl)
        timers.current.set(id, timer)
      }
    },
    [dismissToast, setNotifications],
  )

  const markAllSeen = useCallback(() => {
    setNotifications((prev) => prev.map((n) => (n.seen ? n : { ...n, seen: true })))
  }, [setNotifications])
  const removeNotification = useCallback(
    (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    },
    [setNotifications],
  )
  const clearAll = useCallback(() => setNotifications(() => []), [setNotifications])

  const unread = notifications.reduce((a, n) => a + (n.seen ? 0 : 1), 0)

  const value = useMemo<NotifyState>(
    () => ({
      toasts,
      notifications,
      unread,
      notify,
      dismissToast,
      markAllSeen,
      removeNotification,
      clearAll,
    }),
    [
      toasts,
      notifications,
      unread,
      notify,
      dismissToast,
      markAllSeen,
      removeNotification,
      clearAll,
    ],
  )

  return <NotifyContext.Provider value={value}>{children}</NotifyContext.Provider>
}

export function useNotify(): NotifyState {
  const ctx = useContext(NotifyContext)
  if (!ctx) throw new Error('useNotify must be used within NotifyProvider')
  return ctx
}

/** Normalize a thrown value / RPC error into a short, human message. */
export function humanizeError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const first = raw.split('\n')[0] ?? raw
  if (/user rejected|rejected the request|declined/i.test(first))
    return 'You declined the transaction.'
  if (/blockhash not found|block height exceeded/i.test(first))
    return 'Network was busy — please try again.'
  if (/insufficient|0x1\b/i.test(first)) return 'Insufficient funds for this transaction.'
  if (/custom program error: 0x/i.test(first))
    return `Program rejected the transaction (${first.match(/0x[0-9a-f]+/i)?.[0]}).`
  return first.length > 160 ? `${first.slice(0, 160)}…` : first
}
