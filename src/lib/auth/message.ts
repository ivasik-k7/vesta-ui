// Sign-In With Solana (SIWS-style) message construction and verification.
// The wallet signs a domain-bound, nonce'd, time-stamped statement; we verify
// the ed25519 signature against the connected key. There is no backend — this
// proves key ownership for the client session, not a server trust boundary.

import { ed25519 } from '@noble/curves/ed25519.js'
import type { PublicKey } from '@solana/web3.js'

export const SESSION_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

export interface SessionPayload {
  address: string
  nonce: string
  issuedAt: number
  expiresAt: number
}

function randomNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function buildSession(address: string): SessionPayload {
  const issuedAt = Date.now()
  return { address, nonce: randomNonce(), issuedAt, expiresAt: issuedAt + SESSION_TTL_MS }
}

/** The exact human-readable text the wallet is asked to sign. */
export function sessionMessage(payload: SessionPayload): string {
  const domain = typeof window !== 'undefined' ? window.location.host : 'vesta'
  return [
    `${domain} wants you to sign in with your Solana account:`,
    payload.address,
    '',
    'Sign in to VESTA — the living loyalty protocol.',
    '',
    'This request will not trigger a blockchain transaction or cost any fees.',
    '',
    `Nonce: ${payload.nonce}`,
    `Issued At: ${new Date(payload.issuedAt).toISOString()}`,
    `Expiration Time: ${new Date(payload.expiresAt).toISOString()}`,
  ].join('\n')
}

/** Verify the signature is a valid ed25519 signature of the message by `key`. */
export function verifySignature(message: string, signature: Uint8Array, key: PublicKey): boolean {
  try {
    const bytes = new TextEncoder().encode(message)
    return ed25519.verify(signature, bytes, key.toBytes())
  } catch {
    return false
  }
}

export function isExpired(payload: SessionPayload): boolean {
  return Date.now() >= payload.expiresAt
}
