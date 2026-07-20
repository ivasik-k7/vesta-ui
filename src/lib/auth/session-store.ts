import { isExpired, type SessionPayload } from './message'

// Synchronous session storage — usable both in React (auth context) and in
// TanStack Router `beforeLoad` guards (which run before React mounts). This is
// the single source of truth for "is there a usable session".

export const SESSION_KEY = 'vesta.session'
export const BOOK_KEY = 'vesta.wallet-book'

export function readStoredSession(): SessionPayload | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SessionPayload
    return isExpired(parsed) ? null : parsed
  } catch {
    return null
  }
}

/** Coarse gate for route protection: a non-expired session exists on disk. */
export function hasValidStoredSession(): boolean {
  return readStoredSession() !== null
}

export function writeSession(payload: SessionPayload): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function readBook(): string[] {
  try {
    return JSON.parse(localStorage.getItem(BOOK_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function writeBook(addresses: string[]): void {
  localStorage.setItem(BOOK_KEY, JSON.stringify(addresses))
}
