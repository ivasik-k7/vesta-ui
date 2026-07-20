import { useSyncExternalStore } from 'react'

// Local, per-browser wallet aliases (address → friendly name). Purely a display
// convenience; never sent anywhere.
const KEY = 'vesta.walletAliases'
type Aliases = Record<string, string>

function read(): Aliases {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Aliases) : {}
  } catch {
    return {}
  }
}

let cache: Aliases = read()
const subs = new Set<() => void>()
const emit = () => {
  for (const s of subs) s()
}

export function setAlias(address: string, alias: string) {
  const next = { ...cache }
  const trimmed = alias.trim()
  if (trimmed) next[address] = trimmed
  else delete next[address]
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage unavailable — keep in-memory only
  }
  emit()
}

function subscribe(cb: () => void) {
  subs.add(cb)
  return () => {
    subs.delete(cb)
  }
}

/** All aliases, reactive across the app. */
export function useWalletAliases(): Aliases {
  return useSyncExternalStore(
    subscribe,
    () => cache,
    () => cache,
  )
}

/** The alias for one address, or undefined. */
export function useWalletAlias(address?: string): string | undefined {
  const aliases = useWalletAliases()
  return address ? aliases[address] : undefined
}
