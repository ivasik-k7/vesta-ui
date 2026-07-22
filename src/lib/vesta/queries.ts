import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import type { Connection, PublicKey } from '@solana/web3.js'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { AEGIS, DISCRIMINATOR, VESTA_CORE } from './constants'
import { type DecayingMint, parseDecayingMint } from './decay'
import {
  type Alliance,
  type Attestation,
  decodeAlliance,
  decodeAttestation,
  decodeIssuer,
  decodeMerchant,
  decodeOffer,
  type Issuer,
  type Merchant,
  type Offer,
} from './decode'
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

// Decode a fetched account set, skipping any that fail to decode — a single
// malformed/legacy account must never blank the whole list.
function decodeAll<T>(
  accounts: readonly { pubkey: PublicKey; account: { data: Uint8Array } }[],
  decode: (pubkey: PublicKey, data: Uint8Array) => T,
): T[] {
  const out: T[] = []
  for (const { pubkey, account } of accounts) {
    try {
      out.push(decode(pubkey, new Uint8Array(account.data)))
    } catch {
      // skip undecodable account
    }
  }
  return out
}

async function fetchMerchants(connection: Connection): Promise<Merchant[]> {
  const accounts = await connection.getProgramAccounts(VESTA_CORE, {
    filters: [memcmpDiscriminator(DISCRIMINATOR.Merchant)],
  })
  return decodeAll(accounts, decodeMerchant)
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
  return decodeAll(accounts, decodeOffer)
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

/** getMultipleAccountsInfo capped at 100 keys/call — batch and flatten. */
async function getMultipleBatched(connection: Connection, keys: PublicKey[]) {
  const out: (Awaited<ReturnType<Connection['getAccountInfo']>> | null)[] = []
  for (let i = 0; i < keys.length; i += 100) {
    const chunk = keys.slice(i, i + 100)
    const infos = await connection.getMultipleAccountsInfo(chunk)
    out.push(...infos)
  }
  return out
}

/** SPL / Token-2022 token-account amount lives at byte offset 64 (u64 LE). */
function readTokenAmount(data: Uint8Array): bigint {
  if (data.length < 72) return 0n
  return new DataView(data.buffer, data.byteOffset, data.byteLength).getBigUint64(64, true)
}

async function fetchHoldings(
  connection: Connection,
  owner: PublicKey,
  merchants: Merchant[],
): Promise<Holding[]> {
  if (merchants.length === 0) return []
  // Two batched round-trips (ATAs + mints) instead of 2×N sequential calls —
  // the difference between a snappy dashboard and a rate-limited one.
  const atas = merchants.map((m) => ata(m.pointMint, owner))
  const mints = merchants.map((m) => m.pointMint)
  const [ataInfos, mintInfos] = await Promise.all([
    getMultipleBatched(connection, atas),
    getMultipleBatched(connection, mints),
  ])

  const holdings: Holding[] = []
  merchants.forEach((merchant, i) => {
    const ataInfo = ataInfos[i]
    const mintInfo = mintInfos[i]
    if (!ataInfo || !mintInfo) return
    const raw = readTokenAmount(new Uint8Array(ataInfo.data))
    if (raw === 0n) return
    const mint = parseDecayingMint(merchant.pointMint, mintInfo)
    if (!mint) return
    holdings.push({ merchant, mint, raw })
  })
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

export function useMyMerchant() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  return useQuery({
    queryKey: ['my-merchant', publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return null
      const merchant = pdas.merchant(publicKey, 0n)
      const info = await connection.getAccountInfo(merchant)
      return info ? decodeMerchant(merchant, new Uint8Array(info.data)) : null
    },
    enabled: !!publicKey,
  })
}

export interface ActivityEntry {
  signature: string
  slot: number
  blockTime: number | null
  err: boolean
}

export function useActivity(limit = 20) {
  const { connection } = useConnection()
  return useQuery({
    queryKey: ['activity', limit],
    queryFn: async (): Promise<ActivityEntry[]> => {
      const sigs = await connection.getSignaturesForAddress(VESTA_CORE, { limit })
      return sigs.map((s) => ({
        signature: s.signature,
        slot: s.slot,
        blockTime: s.blockTime ?? null,
        err: s.err !== null,
      }))
    },
    staleTime: 10_000,
  })
}

export function useConfig() {
  const { connection } = useConnection()
  return useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const { decodeConfig } = await import('./decode')
      const info = await connection.getAccountInfo(pdas.config())
      return info ? decodeConfig(new Uint8Array(info.data)) : null
    },
    staleTime: 20_000,
  })
}

export function useSolBalance() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  return useQuery({
    queryKey: ['sol-balance', publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return 0
      return (await connection.getBalance(publicKey)) / 1e9
    },
    enabled: !!publicKey,
    staleTime: 10_000,
  })
}

// ── enriched activity feed (batch-decoded, filterable) ──────────────────────

export interface ActivityRecord {
  signature: string
  slot: number
  blockTime: number | null
  err: boolean
  feePayer: string | null
  fee: number
  computeUnits: number
  actions: import('./decoder').DecodedIx[]
  primary: import('./decoder').DecodedIx | null
}

async function fetchActivityFeed(
  connection: Connection,
  address: PublicKey,
  limit: number,
): Promise<ActivityRecord[]> {
  const sigs = await connection.getSignaturesForAddress(address, { limit })
  if (sigs.length === 0) return []
  const { decodeTransactionInstructions, primaryAction } = await import('./decoder')

  const records: ActivityRecord[] = []
  // Batch getParsedTransactions to stay within RPC payload limits.
  for (let i = 0; i < sigs.length; i += 25) {
    const chunk = sigs.slice(i, i + 25)
    const txs = await connection.getParsedTransactions(
      chunk.map((s) => s.signature),
      { maxSupportedTransactionVersion: 0 },
    )
    txs.forEach((tx, j) => {
      const sig = chunk[j]
      if (!sig) return
      const actions = tx ? decodeTransactionInstructions(tx.transaction.message.instructions) : []
      const feePayer = tx?.transaction.message.accountKeys[0]?.pubkey.toBase58() ?? null
      records.push({
        signature: sig.signature,
        slot: sig.slot,
        blockTime: sig.blockTime ?? tx?.blockTime ?? null,
        err: sig.err !== null,
        feePayer,
        fee: tx?.meta?.fee ?? 0,
        computeUnits: tx?.meta?.computeUnitsConsumed ?? 0,
        actions,
        primary: primaryAction(actions),
      })
    })
  }
  return records
}

export type ActivityScope = 'protocol' | 'wallet'

/** Transaction history scoped to the whole protocol or one wallet. */
export function useActivityFeed(scope: ActivityScope = 'protocol', limit = 100) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const address = scope === 'wallet' ? publicKey : VESTA_CORE
  return useQuery({
    queryKey: ['activity-feed', scope, address?.toBase58(), limit],
    queryFn: () => (address ? fetchActivityFeed(connection, address, limit) : Promise.resolve([])),
    enabled: !!address,
    staleTime: 15_000,
  })
}

interface ActivityPage {
  records: ActivityRecord[]
  nextCursor: string | undefined
}

/**
 * Paged transaction history: the first page (one signatures call + one parsed
 * batch) renders fast; older pages stream in lazily behind a cursor. Memory is
 * bounded — only the newest `maxPages` pages are kept, older ones are dropped.
 */
export function useActivityPages(scope: ActivityScope = 'protocol', pageSize = 25, maxPages = 8) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const address = scope === 'wallet' ? publicKey : VESTA_CORE
  return useInfiniteQuery({
    queryKey: ['activity-pages', scope, address?.toBase58(), pageSize],
    enabled: !!address,
    staleTime: 15_000,
    gcTime: 60_000, // drop the whole feed from memory shortly after leaving
    maxPages,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }): Promise<ActivityPage> => {
      if (!address) return { records: [], nextCursor: undefined }
      const sigs = await connection.getSignaturesForAddress(address, {
        limit: pageSize,
        before: pageParam,
      })
      if (sigs.length === 0) return { records: [], nextCursor: undefined }
      const { decodeTransactionInstructions, primaryAction } = await import('./decoder')
      const txs = await connection.getParsedTransactions(
        sigs.map((s) => s.signature),
        { maxSupportedTransactionVersion: 0 },
      )
      const records: ActivityRecord[] = []
      txs.forEach((tx, j) => {
        const sig = sigs[j]
        if (!sig) return
        const actions = tx ? decodeTransactionInstructions(tx.transaction.message.instructions) : []
        const feePayer = tx?.transaction.message.accountKeys[0]?.pubkey.toBase58() ?? null
        records.push({
          signature: sig.signature,
          slot: sig.slot,
          blockTime: sig.blockTime ?? tx?.blockTime ?? null,
          err: sig.err !== null,
          feePayer,
          fee: tx?.meta?.fee ?? 0,
          computeUnits: tx?.meta?.computeUnitsConsumed ?? 0,
          actions,
          primary: primaryAction(actions),
        })
      })
      return {
        records,
        nextCursor: sigs.length === pageSize ? sigs[sigs.length - 1]?.signature : undefined,
      }
    },
    getNextPageParam: (last) => last.nextCursor,
  })
}

export function useDecodedTransaction(signature: string | null) {
  const { connection } = useConnection()
  return useQuery({
    queryKey: ['tx', signature],
    queryFn: async () => {
      if (!signature) return null
      const tx = await connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      })
      if (!tx) return null
      const { decodeTransactionInstructions } = await import('./decoder')
      const decoded = decodeTransactionInstructions(tx.transaction.message.instructions)
      return {
        decoded,
        fee: tx.meta?.fee ?? 0,
        logs: tx.meta?.logMessages ?? [],
        computeUnits: tx.meta?.computeUnitsConsumed ?? 0,
      }
    },
    enabled: !!signature,
    staleTime: 60_000,
  })
}

async function fetchAlliances(connection: Connection): Promise<Alliance[]> {
  const accounts = await connection.getProgramAccounts(VESTA_CORE, {
    filters: [memcmpDiscriminator(DISCRIMINATOR.Alliance)],
  })
  return decodeAll(accounts, decodeAlliance).sort((a, b) => b.memberCount - a.memberCount)
}

export function useAlliances() {
  const { connection } = useConnection()
  return useQuery({
    queryKey: ['alliances'],
    queryFn: () => fetchAlliances(connection),
    staleTime: 30_000,
  })
}

/** Protocol-wide aggregates, derived from the live account sets. */
export interface NetworkStats {
  merchants: number
  verified: number
  alliances: number
  totalCustomers: bigint
  totalPointsIssued: bigint
  totalRedemptions: bigint
  totalBadges: bigint
  totalClawedBack: bigint
  allianceSwaps: bigint
  allianceVolume: bigint
}

export function useNetworkStats() {
  const merchants = useMerchants()
  const alliances = useAlliances()
  const stats: NetworkStats | null =
    merchants.data && alliances.data
      ? {
          merchants: merchants.data.length,
          verified: merchants.data.filter((m) => m.verified).length,
          alliances: alliances.data.length,
          totalCustomers: merchants.data.reduce((a, m) => a + m.customerCount, 0n),
          totalPointsIssued: merchants.data.reduce((a, m) => a + m.lifetimePointsIssued, 0n),
          totalRedemptions: merchants.data.reduce((a, m) => a + m.lifetimeRedemptions, 0n),
          totalBadges: merchants.data.reduce((a, m) => a + m.badgesIssued, 0n),
          totalClawedBack: merchants.data.reduce((a, m) => a + m.lifetimeClawedBack, 0n),
          allianceSwaps: alliances.data.reduce((a, x) => a + x.totalSwaps, 0n),
          allianceVolume: alliances.data.reduce((a, x) => a + x.totalUiVolume, 0n),
        }
      : null
  return {
    data: stats,
    isLoading: merchants.isLoading || alliances.isLoading,
  }
}

/** The connected wallet's aegis issuer (id 0), if one exists. */
export function useMyIssuer() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  return useQuery({
    queryKey: ['issuer', publicKey?.toBase58()],
    queryFn: async (): Promise<Issuer | null> => {
      if (!publicKey) return null
      const issuer = pdas.issuer(publicKey, 0n)
      const info = await connection.getAccountInfo(issuer)
      return info ? decodeIssuer(issuer, new Uint8Array(info.data)) : null
    },
    enabled: !!publicKey,
    staleTime: 20_000,
  })
}

/** Public lookup: one subject's attestation under a given issuer. */
export function useAttestation(
  issuer: PublicKey | null,
  subject: PublicKey | null,
  schemaId = 1n, // well-known: REGION
) {
  const { connection } = useConnection()
  return useQuery({
    queryKey: ['attestation', issuer?.toBase58(), subject?.toBase58(), schemaId.toString()],
    queryFn: async (): Promise<Attestation | null> => {
      if (!issuer || !subject) return null
      const pda = pdas.attestation(issuer, subject, schemaId)
      const info = await connection.getAccountInfo(pda)
      return info ? decodeAttestation(pda, new Uint8Array(info.data)) : null
    },
    enabled: !!issuer && !!subject,
  })
}

/** All aegis issuers on the deployment (public registry). */
export function useIssuers() {
  const { connection } = useConnection()
  return useQuery({
    queryKey: ['issuers'],
    queryFn: async (): Promise<Issuer[]> => {
      // Issuer discriminator = sha256("account:Issuer")[..8].
      const disc = new Uint8Array([216, 19, 83, 230, 108, 53, 80, 14])
      const accounts = await connection.getProgramAccounts(AEGIS, {
        filters: [{ memcmp: { offset: 0, bytes: bs58FromBytes([...disc]) } }],
      })
      return decodeAll(accounts, decodeIssuer).sort((a, b) => Number(b.issued - a.issued))
    },
    staleTime: 30_000,
  })
}

/** All achievements defined by a merchant. */
export function useMyAchievements(merchant: PublicKey | undefined) {
  const { connection } = useConnection()
  return useQuery({
    queryKey: ['achievements', merchant?.toBase58()],
    queryFn: async () => {
      if (!merchant) return []
      const { decodeAchievement } = await import('./decode')
      const accounts = await connection.getProgramAccounts(VESTA_CORE, {
        filters: [
          memcmpDiscriminator(DISCRIMINATOR.Achievement),
          { memcmp: { offset: 8, bytes: merchant.toBase58() } },
        ],
      })
      return decodeAll(accounts, decodeAchievement).sort((a, b) => Number(a.id - b.id))
    },
    enabled: !!merchant,
    staleTime: 20_000,
  })
}

/** Live argus guard policy for a mint (null until the guard is initialized). */
export function useGuardConfig(mint: PublicKey | undefined) {
  const { connection } = useConnection()
  return useQuery({
    queryKey: ['guard', mint?.toBase58()],
    queryFn: async () => {
      if (!mint) return null
      const { decodeGuardConfig } = await import('./decode')
      const info = await connection.getAccountInfo(pdas.guardConfig(mint))
      return info ? decodeGuardConfig(new Uint8Array(info.data)) : null
    },
    enabled: !!mint,
    staleTime: 20_000,
  })
}

export function useMyCampaigns(merchant: PublicKey | undefined) {
  const { connection } = useConnection()
  return useQuery({
    queryKey: ['campaigns', merchant?.toBase58()],
    queryFn: async () => {
      if (!merchant) return []
      const { decodeCampaign } = await import('./decode')
      const accounts = await connection.getProgramAccounts(VESTA_CORE, {
        filters: [
          memcmpDiscriminator(DISCRIMINATOR.Campaign),
          { memcmp: { offset: 8, bytes: merchant.toBase58() } },
        ],
      })
      return decodeAll(accounts, decodeCampaign).sort((a, b) => Number(a.id - b.id))
    },
    enabled: !!merchant,
    staleTime: 20_000,
  })
}

// ── customer journey (spec 12: verified segmentation + gamification) ─────────

import {
  type CustomerEligibility,
  type CustomerProfile,
  decodeCustomerEligibility,
  decodeCustomerProfile,
  decodeMerchantSegments,
  type MerchantSegments,
} from './decode'

/** Per-merchant verified-segment definitions (spec 12). */
export function useMerchantSegments(merchant: PublicKey | null | undefined) {
  const { connection } = useConnection()
  return useQuery({
    queryKey: ['segments', merchant?.toBase58()],
    queryFn: async (): Promise<MerchantSegments | null> => {
      if (!merchant) return null
      const info = await connection.getAccountInfo(pdas.merchantSegments(merchant))
      return info ? decodeMerchantSegments(new Uint8Array(info.data)) : null
    },
    enabled: !!merchant,
    staleTime: 30_000,
  })
}

/** The connected wallet's cached eligibility verdict at one merchant (spec 12). */
export function useCustomerEligibility(merchant: PublicKey | null | undefined) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  return useQuery({
    queryKey: ['eligibility', merchant?.toBase58(), publicKey?.toBase58()],
    queryFn: async (): Promise<CustomerEligibility | null> => {
      if (!merchant || !publicKey) return null
      const info = await connection.getAccountInfo(pdas.customerEligibility(merchant, publicKey))
      return info ? decodeCustomerEligibility(new Uint8Array(info.data)) : null
    },
    enabled: !!merchant && !!publicKey,
    staleTime: 15_000,
  })
}

export interface JourneyStop {
  merchant: Merchant
  mint: DecayingMint
  raw: bigint
  profile: CustomerProfile | null
  eligibility: CustomerEligibility | null
  segments: MerchantSegments | null
}

/** One consolidated read of the connected wallet's whole loyalty life: every
 *  merchant it holds points with, plus that relationship's profile (tier,
 *  streak), cached eligibility, and the merchant's segment definitions. */
export function useJourney() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const holdings = useHoldings()
  return useQuery({
    queryKey: ['journey', publicKey?.toBase58(), holdings.data?.length],
    queryFn: async (): Promise<JourneyStop[]> => {
      if (!publicKey || !holdings.data) return []
      return Promise.all(
        holdings.data.map(async (h): Promise<JourneyStop> => {
          const [profileInfo, eligInfo, segInfo] = await connection.getMultipleAccountsInfo([
            pdas.customerProfile(h.merchant.address, publicKey),
            pdas.customerEligibility(h.merchant.address, publicKey),
            pdas.merchantSegments(h.merchant.address),
          ])
          return {
            merchant: h.merchant,
            mint: h.mint,
            raw: h.raw,
            profile: profileInfo ? decodeCustomerProfile(new Uint8Array(profileInfo.data)) : null,
            eligibility: eligInfo ? decodeCustomerEligibility(new Uint8Array(eligInfo.data)) : null,
            segments: segInfo ? decodeMerchantSegments(new Uint8Array(segInfo.data)) : null,
          }
        }),
      )
    },
    enabled: !!publicKey && !!holdings.data,
    staleTime: 15_000,
  })
}
