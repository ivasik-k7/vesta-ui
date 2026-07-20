import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Check, ChevronDown, LogOut, ShieldCheck, Wallet } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useVestaAuth } from '@/lib/auth/context'

const short = (key: string) => `${key.slice(0, 4)}…${key.slice(-4)}`

export function ConnectButton({ size = 'sm' }: { size?: 'sm' | 'default' | 'lg' }) {
  const { publicKey, connecting } = useWallet()
  const { setVisible } = useWalletModal()
  const { status, signIn } = useVestaAuth()

  if (!publicKey) {
    return (
      <Button size={size} onClick={() => setVisible(true)} disabled={connecting}>
        <Wallet className="size-4" aria-hidden />
        {connecting ? 'Connecting…' : 'Connect wallet'}
      </Button>
    )
  }

  if (status !== 'authenticated') {
    return (
      <Button size={size} onClick={() => signIn()} disabled={status === 'authenticating'}>
        <ShieldCheck className="size-4" aria-hidden />
        {status === 'authenticating' ? 'Check your wallet…' : 'Sign in'}
      </Button>
    )
  }

  return <WalletMenu size={size} address={publicKey.toBase58()} />
}

function WalletMenu({ size, address }: { size: 'sm' | 'default' | 'lg'; address: string }) {
  const { setVisible } = useWalletModal()
  const { signOut, walletBook, forgetWallet } = useVestaAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size={size}
        className="group border-line-strong"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full rounded-full bg-flame/50" />
          <span className="relative inline-flex size-2 rounded-full bg-flame" />
        </span>
        <span className="font-mono">{short(address)}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
      </Button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
          <div className="border-border/60 border-b px-4 py-3">
            <p className="flex items-center gap-1.5 text-flame text-xs">
              <ShieldCheck className="size-3.5" aria-hidden />
              Signed in
            </p>
            <p className="mt-1 font-mono text-sm">{short(address)}</p>
          </div>

          {walletBook.length > 1 ? (
            <div className="border-border/60 border-b py-1">
              <p className="px-4 py-1 text-[11px] text-muted-foreground/70">Known wallets</p>
              {walletBook.map((addr) => (
                <div
                  key={addr}
                  className="flex items-center justify-between px-4 py-1.5 font-mono text-sm"
                >
                  <span className="flex items-center gap-2">
                    {addr === address ? (
                      <Check className="size-3.5 text-flame" aria-hidden />
                    ) : (
                      <span className="size-3.5" />
                    )}
                    {short(addr)}
                  </span>
                  {addr !== address ? (
                    <button
                      type="button"
                      onClick={() => forgetWallet(addr)}
                      className="text-muted-foreground/60 text-xs hover:text-foreground"
                    >
                      forget
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setVisible(true)
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-secondary"
          >
            <Wallet className="size-4 text-muted-foreground" aria-hidden />
            Add / switch wallet
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              signOut()
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-secondary"
          >
            <LogOut className="size-4 text-muted-foreground" aria-hidden />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
