import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { LogOut, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'

const short = (key: string) => `${key.slice(0, 4)}…${key.slice(-4)}`

// Our own trigger over the adapter modal — keeps the sicilian-orange system
// instead of the adapter's default purple button.
export function ConnectButton({ size = 'sm' }: { size?: 'sm' | 'default' | 'lg' }) {
  const { publicKey, disconnect, connecting } = useWallet()
  const { setVisible } = useWalletModal()

  if (publicKey) {
    return (
      <Button
        variant="outline"
        size={size}
        className="group border-line-strong"
        onClick={() => disconnect()}
      >
        <Wallet className="size-4 text-flame" aria-hidden />
        <span className="font-mono">{short(publicKey.toBase58())}</span>
        <LogOut
          className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      </Button>
    )
  }

  return (
    <Button size={size} onClick={() => setVisible(true)} disabled={connecting}>
      <Wallet className="size-4" aria-hidden />
      {connecting ? 'Connecting…' : 'Connect wallet'}
    </Button>
  )
}
