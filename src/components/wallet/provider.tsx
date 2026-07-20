import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

import { RPC_URL } from '@/lib/vesta/constants'

import '@solana/wallet-adapter-react-ui/styles.css'

export function SolanaProvider({ children }: { children: ReactNode }) {
  // Empty adapter array → wallet-standard auto-discovery (Phantom, Solflare,
  // Backpack register themselves). No hardcoded adapter list to drift.
  const wallets = useMemo(() => [], [])
  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
