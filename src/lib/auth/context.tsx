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

const SESSION_KEY = 'vesta.session'
const BOOK_KEY = 'vesta.wallet-book'

export type AuthStatus =
  | 'disconnected' // no wallet connected
  | 'unauthenticated' // wallet connected, not signed in
  | 'authenticating' // sign-in in progress
  | 'authenticated' // valid signed session

interface AuthState {
  status: AuthStatus
  session: SessionPayload | null
  /** Previously authenticated addresses, most-recent first. */
  walletBook: string[]
  signIn: () => Promise<void>
  signOut: () => void
  forgetWallet: (address: string) => void
  error: string | null
}

const AuthContext = createContext<AuthState | null>(null)

function loadSession(): SessionPayload | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SessionPayload
    return isExpired(parsed) ? null : parsed
  } catch {
    return null
  }
}

function loadBook(): string[] {
  try {
    return JSON.parse(localStorage.getItem(BOOK_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function VestaAuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, disconnect, connected } = useWallet()
  const [session, setSession] = useState<SessionPayload | null>(() =>
    typeof window === 'undefined' ? null : loadSession(),
  )
  const [walletBook, setWalletBook] = useState<string[]>(() =>
    typeof window === 'undefined' ? [] : loadBook(),
  )
  const [authenticating, setAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const address = publicKey?.toBase58() ?? null

  // A session is only valid for the currently connected key and not expired.
  const validSession =
    session && address && session.address === address && !isExpired(session) ? session : null

  // Drop a stale session when the connected wallet changes or disconnects.
  useEffect(() => {
    if (session && (!address || session.address !== address || isExpired(session))) {
      if (!address || session.address !== address) {
        localStorage.removeItem(SESSION_KEY)
        setSession(null)
      }
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
        throw new Error('Signature verification failed.')
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(payload))
      setSession(payload)
      setWalletBook((prev) => {
        const next = [payload.address, ...prev.filter((a) => a !== payload.address)].slice(0, 6)
        localStorage.setItem(BOOK_KEY, JSON.stringify(next))
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in rejected.')
    } finally {
      setAuthenticating(false)
    }
  }, [publicKey, signMessage])

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
    void disconnect()
  }, [disconnect])

  const forgetWallet = useCallback((addr: string) => {
    setWalletBook((prev) => {
      const next = prev.filter((a) => a !== addr)
      localStorage.setItem(BOOK_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const status: AuthStatus = !connected
    ? 'disconnected'
    : authenticating
      ? 'authenticating'
      : validSession
        ? 'authenticated'
        : 'unauthenticated'

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
