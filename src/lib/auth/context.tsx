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

import {
  buildSession,
  isExpired,
  type SessionPayload,
  sessionMessage,
  verifySignature,
} from './message'
import { clearSession, readBook, readStoredSession, writeBook, writeSession } from './session-store'

export type AuthStatus =
  | 'disconnected' // no wallet connected
  | 'restoring' // stored session + wallet reconnecting (autoConnect)
  | 'unauthenticated' // wallet connected, not signed in
  | 'authenticating' // sign-in in progress
  | 'authenticated' // valid signed session

interface AuthState {
  status: AuthStatus
  session: SessionPayload | null
  walletBook: string[]
  signIn: () => Promise<void>
  signOut: () => void
  forgetWallet: (address: string) => void
  error: string | null
}

const AuthContext = createContext<AuthState | null>(null)

export function VestaAuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, disconnect, connected, connecting } = useWallet()
  const [session, setSession] = useState<SessionPayload | null>(() =>
    typeof window === 'undefined' ? null : readStoredSession(),
  )
  const [walletBook, setWalletBook] = useState<string[]>(() =>
    typeof window === 'undefined' ? [] : readBook(),
  )
  const [authenticating, setAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const address = publicKey?.toBase58() ?? null

  const validSession =
    session && address && session.address === address && !isExpired(session) ? session : null

  // Clear a session whose key no longer matches the connected wallet.
  useEffect(() => {
    if (session && address && session.address !== address) {
      clearSession()
      setSession(null)
    }
  }, [address, session])

  const signIn = useCallback(async () => {
    if (!publicKey || !signMessage) {
      setError('This wallet cannot sign messages.')
      return
    }
    setAuthenticating(true)
    setError(null)
    try {
      const payload = buildSession(publicKey.toBase58())
      const message = sessionMessage(payload)
      const signature = await signMessage(new TextEncoder().encode(message))
      if (!verifySignature(message, signature, publicKey)) {
        throw new Error('auth.verifyFailed')
      }
      writeSession(payload)
      setSession(payload)
      setWalletBook((prev) => {
        const next = [payload.address, ...prev.filter((a) => a !== payload.address)].slice(0, 6)
        writeBook(next)
        return next
      })
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'auth.rejected')
    } finally {
      setAuthenticating(false)
    }
  }, [publicKey, signMessage])

  const signOut = useCallback(() => {
    clearSession()
    setSession(null)
    void disconnect()
  }, [disconnect])

  const forgetWallet = useCallback((addr: string) => {
    setWalletBook((prev) => {
      const next = prev.filter((a) => a !== addr)
      writeBook(next)
      return next
    })
  }, [])

  const status: AuthStatus = validSession
    ? 'authenticated'
    : authenticating
      ? 'authenticating'
      : connected
        ? 'unauthenticated'
        : // stored session but wallet still reconnecting → restoring, not a hard wall
          session && connecting
          ? 'restoring'
          : 'disconnected'

  const value = useMemo<AuthState>(
    () => ({ status, session: validSession, walletBook, signIn, signOut, forgetWallet, error }),
    [status, validSession, walletBook, signIn, signOut, forgetWallet, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useVestaAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useVestaAuth must be used within VestaAuthProvider')
  return ctx
}
