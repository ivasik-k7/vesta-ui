import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

import { RPC_URL } from '@/lib/vesta/constants'

import '@solana/wallet-adapter-react-ui/styles.css'

export const RPC_OVERRIDE_KEY = 'vesta.rpc'

/** A user-set devnet RPC (e.g. Helius) overrides the default — a lifeline
 *  when the public endpoint rate-limits. Read once at load; changing it
 *  requires a reload (Settings prompts for it). */
export function activeRpcEndpoint(): string {
  if (typeof window === 'undefined') return RPC_URL
  return localStorage.getItem(RPC_OVERRIDE_KEY) || RPC_URL
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  // Empty adapter array → wallet-standard auto-discovery (Phantom, Solflare,
  // Backpack register themselves). No hardcoded adapter list to drift.
  const wallets = useMemo(() => [], [])
  const endpoint = useMemo(() => activeRpcEndpoint(), [])
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
