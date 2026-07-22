import { useWallet } from '@solana/wallet-adapter-react'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type { Merchant } from '@/lib/vesta/decode'
import { useConfig, useMyIssuer, useMyMerchants } from '@/lib/vesta/queries'

/**
 * Workspaces are role contexts derived live from chain. A wallet is always a
 * Customer; it additionally becomes a Merchant workspace per Merchant PDA it
 * owns (a wallet may run many brands), an Issuer workspace if it holds an aegis
 * Issuer, and an Admin workspace if it is the protocol admin. The active
 * workspace decides which grouped sidebar + home route the shell renders.
 */
export type WorkspaceKind = 'customer' | 'merchant' | 'issuer' | 'admin'

export interface Workspace {
  /** Stable id: 'customer' | `merchant:<id>` | 'issuer' | 'admin'. */
  id: string
  kind: WorkspaceKind
  label: string
  /** Seed for the deterministic gradient glyph (a base58 address). */
  seed: string
  /** Present when kind === 'merchant'. */
  merchant?: Merchant
}

export const WORKSPACE_HOME: Record<WorkspaceKind, string> = {
  customer: '/app',
  merchant: '/app/console',
  issuer: '/app/issuer',
  admin: '/app/admin',
}

interface WorkspaceState {
  workspaces: Workspace[]
  active: Workspace
  activeId: string
  setActiveId: (id: string) => void
  /** The workspace home route for the active (or a given) workspace. */
  homeOf: (id?: string) => string
  merchants: Merchant[]
  /** The merchant of the active workspace, or null when not in a merchant. */
  activeMerchant: Merchant | null
  roles: { customer: true; merchant: boolean; issuer: boolean; admin: boolean }
  isLoading: boolean
}

const WorkspaceContext = createContext<WorkspaceState | null>(null)
const STORE_PREFIX = 'vesta.workspace'
const storeKey = (address: string | null) => `${STORE_PREFIX}:${address ?? 'anon'}`

const CUSTOMER: Workspace = {
  id: 'customer',
  kind: 'customer',
  label: 'Customer',
  seed: 'customer',
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet()
  const address = publicKey?.toBase58() ?? null

  const merchantsQ = useMyMerchants()
  const issuerQ = useMyIssuer()
  const configQ = useConfig()

  const merchants = useMemo(() => merchantsQ.data ?? [], [merchantsQ.data])
  const issuer = issuerQ.data ?? null
  const isAdmin = !!configQ.data && !!address && configQ.data.admin.toBase58() === address
  // A pending admin (mid two-step handover) also gets the Admin workspace so it
  // can navigate in and accept the transfer.
  const isPendingAdmin =
    !!configQ.data?.pendingAdmin && !!address && configQ.data.pendingAdmin.toBase58() === address
  const showAdmin = isAdmin || isPendingAdmin

  // Build the ordered workspace list: Customer, then each owned Merchant, then
  // Issuer, then Admin — matching the switcher's grouping.
  const workspaces = useMemo<Workspace[]>(() => {
    const list: Workspace[] = [CUSTOMER]
    for (const m of merchants) {
      list.push({
        id: `merchant:${m.id.toString()}`,
        kind: 'merchant',
        label: m.name || `Merchant #${m.id.toString()}`,
        seed: m.address.toBase58(),
        merchant: m,
      })
    }
    if (issuer) {
      list.push({
        id: 'issuer',
        kind: 'issuer',
        label: issuer.name || 'Issuer',
        seed: issuer.address.toBase58(),
      })
    }
    if (showAdmin)
      list.push({ id: 'admin', kind: 'admin', label: 'Admin', seed: address ?? 'admin' })
    return list
  }, [merchants, issuer, showAdmin, address])

  const [activeId, setActiveIdRaw] = useState<string>('customer')

  // Load the persisted selection for this wallet whenever the wallet changes.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storeKey(address))
      setActiveIdRaw(stored ?? 'customer')
    } catch {
      setActiveIdRaw('customer')
    }
  }, [address])

  const setActiveId = useCallback(
    (id: string) => {
      setActiveIdRaw(id)
      try {
        localStorage.setItem(storeKey(address), id)
      } catch {
        // non-fatal
      }
    },
    [address],
  )

  // Resolve the active workspace, gracefully falling back to Customer if the
  // stored selection is no longer available (e.g. a merchant was closed).
  const active = useMemo(
    () => workspaces.find((w) => w.id === activeId) ?? CUSTOMER,
    [workspaces, activeId],
  )

  const homeOf = useCallback(
    (id?: string) => {
      const w = id ? workspaces.find((x) => x.id === id) : active
      return WORKSPACE_HOME[w?.kind ?? 'customer']
    },
    [workspaces, active],
  )

  const value = useMemo<WorkspaceState>(
    () => ({
      workspaces,
      active,
      activeId: active.id,
      setActiveId,
      homeOf,
      merchants,
      activeMerchant: active.kind === 'merchant' ? (active.merchant ?? null) : null,
      roles: {
        customer: true,
        merchant: merchants.length > 0,
        issuer: !!issuer,
        admin: isAdmin,
      },
      isLoading: merchantsQ.isLoading || issuerQ.isLoading || configQ.isLoading,
    }),
    [
      workspaces,
      active,
      setActiveId,
      homeOf,
      merchants,
      issuer,
      isAdmin,
      merchantsQ.isLoading,
      issuerQ.isLoading,
      configQ.isLoading,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): WorkspaceState {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
