import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import type { Connection, PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

import { DISCRIMINATOR, VESTA_CORE } from './constants'
import { type DecayingMint, parseDecayingMint } from './decay'
import { decodeMerchant, decodeOffer, type Merchant, type Offer } from './decode'
import { ata, pdas } from './pda'

const memcmpDiscriminator = (disc: readonly number[]) => ({
  memcmp: { offset: 0, bytes: bs58FromBytes(disc) },
})

// getProgramAccounts memcmp wants base58 bytes; encode the discriminator.
function bs58FromBytes(bytes: readonly number[]): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let value = 0n
  for (const b of bytes) value = value * 256n + BigInt(b)
  let out = ''
  while (value > 0n) {
    out = ALPHABET[Number(value % 58n)] + out
    value /= 58n
  }
  for (const b of bytes) {
    if (b === 0) out = `1${out}`
    else break
  }
  return out
}

async function fetchMerchants(connection: Connection): Promise<Merchant[]> {
  const accounts = await connection.getProgramAccounts(VESTA_CORE, {
    filters: [memcmpDiscriminator(DISCRIMINATOR.Merchant)],
  })
  return accounts.map(({ pubkey, account }) => decodeMerchant(pubkey, new Uint8Array(account.data)))
}

export function useMerchants() {
  const { connection } = useConnection()
  return useQuery({
    queryKey: ['merchants'],
    queryFn: () => fetchMerchants(connection),
    staleTime: 30_000,
  })
}

async function fetchOffers(connection: Connection, merchant: PublicKey): Promise<Offer[]> {
  const accounts = await connection.getProgramAccounts(VESTA_CORE, {
    filters: [
      memcmpDiscriminator(DISCRIMINATOR.Offer),
      { memcmp: { offset: 8, bytes: merchant.toBase58() } },
    ],
  })
  return accounts
    .map(({ pubkey, account }) => decodeOffer(pubkey, new Uint8Array(account.data)))
    .filter((o) => o.active)
    .sort((a, b) => Number(a.id - b.id))
}

export function useOffers(merchant: PublicKey | undefined) {
  const { connection } = useConnection()
  return useQuery({
    queryKey: ['offers', merchant?.toBase58()],
    queryFn: () => (merchant ? fetchOffers(connection, merchant) : Promise.resolve([])),
    enabled: !!merchant,
    staleTime: 30_000,
  })
}

export interface Holding {
  merchant: Merchant
  mint: DecayingMint
  raw: bigint
}

async function fetchHoldings(
  connection: Connection,
  owner: PublicKey,
  merchants: Merchant[],
): Promise<Holding[]> {
  const holdings: Holding[] = []
  for (const merchant of merchants) {
    const account = ata(merchant.pointMint, owner)
    const [balance, mintInfo] = await Promise.all([
      connection.getTokenAccountBalance(account).catch(() => null),
      connection.getAccountInfo(merchant.pointMint),
    ])
    if (!balance || !mintInfo) continue
    const raw = BigInt(balance.value.amount)
    if (raw === 0n) continue
    const mint = parseDecayingMint(merchant.pointMint, mintInfo)
    if (!mint) continue
    holdings.push({ merchant, mint, raw })
  }
  return holdings
}

export function useHoldings() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const merchants = useMerchants()
  return useQuery({
    queryKey: ['holdings', publicKey?.toBase58(), merchants.data?.length],
    queryFn: () =>
      publicKey && merchants.data
        ? fetchHoldings(connection, publicKey, merchants.data)
        : Promise.resolve([]),
    enabled: !!publicKey && !!merchants.data,
    staleTime: 15_000,
  })
}

export function useCustomerProfile(merchant: PublicKey | undefined) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  return useQuery({
    queryKey: ['profile', merchant?.toBase58(), publicKey?.toBase58()],
    queryFn: async () => {
      if (!merchant || !publicKey) return null
      const info = await connection.getAccountInfo(pdas.customerProfile(merchant, publicKey))
      if (!info) return null
      const { decodeCustomerProfile } = await import('./decode')
      return decodeCustomerProfile(new Uint8Array(info.data))
    },
    enabled: !!merchant && !!publicKey,
  })
}
