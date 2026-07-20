import { PublicKey } from '@solana/web3.js'

// Minimal cursor for Anchor/borsh fixed-layout account reads. Fields must be
// read in exact on-chain declaration order.
class Cursor {
  private view: DataView
  private data: Uint8Array
  offset: number
  constructor(data: Uint8Array, start = 0) {
    this.data = data
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    this.offset = start
  }
  u8(): number {
    return this.view.getUint8(this.offset++)
  }
  bool(): boolean {
    return this.u8() !== 0
  }
  u16(): number {
    const v = this.view.getUint16(this.offset, true)
    this.offset += 2
    return v
  }
  i16(): number {
    const v = this.view.getInt16(this.offset, true)
    this.offset += 2
    return v
  }
  u32(): number {
    const v = this.view.getUint32(this.offset, true)
    this.offset += 4
    return v
  }
  u64(): bigint {
    const v = this.view.getBigUint64(this.offset, true)
    this.offset += 8
    return v
  }
  i64(): bigint {
    const v = this.view.getBigInt64(this.offset, true)
    this.offset += 8
    return v
  }
  u128(): bigint {
    const lo = this.u64()
    const hi = this.u64()
    return lo + (hi << 64n)
  }
  pubkey(): PublicKey {
    const key = new PublicKey(this.data.subarray(this.offset, this.offset + 32))
    this.offset += 32
    return key
  }
  pubkeys(n: number): PublicKey[] {
    return Array.from({ length: n }, () => this.pubkey())
  }
  string(): string {
    const len = this.u32()
    const bytes = this.data.subarray(this.offset, this.offset + len)
    this.offset += len
    return new TextDecoder().decode(bytes)
  }
  option<T>(read: () => T): T | null {
    return this.bool() ? read() : null
  }
}

// ── vesta_core ──────────────────────────────────────────────────────────────

export interface Merchant {
  address: PublicKey
  id: bigint
  authority: PublicKey
  pointMint: PublicKey
  treasury: PublicKey
  name: string
  decayRateBps: number
  baseEarnRate: bigint
  lifetimePointsIssued: bigint
  customerCount: bigint
  joinedAlliance: PublicKey | null
  operators: PublicKey[]
  paused: boolean
  verified: boolean
  category: number
  metadataUri: string
  lifetimeRedemptions: bigint
  badgesIssued: bigint
  lifetimeClawedBack: bigint
  clawbackCount: bigint
  clawbackDailyCapRaw: bigint
}

export function decodeMerchant(address: PublicKey, data: Uint8Array): Merchant {
  const c = new Cursor(data, 8)
  const id = c.u64()
  const authority = c.pubkey()
  const pointMint = c.pubkey()
  const treasury = c.pubkey()
  const name = c.string()
  const decayRateBps = c.i16()
  const baseEarnRate = c.u64()
  const lifetimePointsIssued = c.u128()
  const customerCount = c.u64()
  const joinedAlliance = c.option(() => c.pubkey())
  const all = c.pubkeys(4)
  const operatorCount = c.u8()
  const operators = all.slice(0, operatorCount)
  const paused = c.bool()
  const verified = c.bool()
  const category = c.u8()
  const metadataUri = c.string()
  const lifetimeRedemptions = c.u64()
  const badgesIssued = c.u64()
  const lifetimeClawedBack = c.u128()
  const clawbackCount = c.u64()
  const clawbackDailyCapRaw = c.u64()
  return {
    address,
    id,
    authority,
    pointMint,
    treasury,
    name,
    decayRateBps,
    baseEarnRate,
    lifetimePointsIssued,
    customerCount,
    joinedAlliance,
    operators,
    paused,
    verified,
    category,
    metadataUri,
    lifetimeRedemptions,
    badgesIssued,
    lifetimeClawedBack,
    clawbackCount,
    clawbackDailyCapRaw,
  }
}

export interface Offer {
  address: PublicKey
  merchant: PublicKey
  id: bigint
  pricePoints: bigint
  supplyRemaining: number
  active: boolean
}

export function decodeOffer(address: PublicKey, data: Uint8Array): Offer {
  const c = new Cursor(data, 8)
  return {
    address,
    merchant: c.pubkey(),
    id: c.u64(),
    pricePoints: c.u64(),
    supplyRemaining: c.u32(),
    active: c.bool(),
  }
}

export interface CustomerProfile {
  wallet: PublicKey
  merchant: PublicKey
  streakDays: number
  lastVisitDay: number
  lifetimeEarned: bigint
  lifetimeRedemptions: number
  tier: number
  lifetimeSpendBase: bigint
  campaignsCompleted: number
  lifetimeClawedBack: bigint
  clawbackCount: number
}

export function decodeCustomerProfile(data: Uint8Array): CustomerProfile {
  const c = new Cursor(data, 8)
  return {
    wallet: c.pubkey(),
    merchant: c.pubkey(),
    streakDays: c.u16(),
    lastVisitDay: c.u32(),
    lifetimeEarned: c.u64(),
    lifetimeRedemptions: c.u32(),
    tier: c.u8(),
    lifetimeSpendBase: c.u64(),
    campaignsCompleted: c.u16(),
    lifetimeClawedBack: c.u64(),
    clawbackCount: c.u32(),
  }
}

export interface Config {
  admin: PublicKey
  pendingAdmin: PublicKey | null
  paused: boolean
}

export function decodeConfig(data: Uint8Array): Config {
  const c = new Cursor(data, 8)
  return {
    admin: c.pubkey(),
    pendingAdmin: c.option(() => c.pubkey()),
    paused: c.bool(),
  }
}

export interface Campaign {
  address: PublicKey
  merchant: PublicKey
  id: bigint
  kind: number
  multiplierBps: number
  flatBonus: bigint
  questTarget: number
  questReward: bigint
  minSpendBase: bigint
  minTier: number
  pointsBudget: bigint
  pointsSpent: bigint
  perCustomerCap: bigint
  startsAt: bigint
  endsAt: bigint
  participantCount: number
  redemptions: bigint
  name: string
  active: boolean
  paused: boolean
}

export function decodeCampaign(address: PublicKey, data: Uint8Array): Campaign {
  const c = new Cursor(data, 8)
  return {
    address,
    merchant: c.pubkey(),
    id: c.u64(),
    kind: c.u8(),
    multiplierBps: c.u16(),
    flatBonus: c.u64(),
    questTarget: c.u16(),
    questReward: c.u64(),
    minSpendBase: c.u64(),
    minTier: c.u8(),
    pointsBudget: c.u64(),
    pointsSpent: c.u64(),
    perCustomerCap: c.u64(),
    startsAt: c.i64(),
    endsAt: c.i64(),
    participantCount: c.u32(),
    redemptions: c.u64(),
    name: c.string(),
    active: c.bool(),
    paused: c.bool(),
  }
}

export interface Alliance {
  address: PublicKey
  id: bigint
  authority: PublicKey
  pendingAuthority: PublicKey | null
  name: string
  memberCount: number
  paused: boolean
  feeBps: number
  minRateBps: number
  maxRateBps: number
  category: number
  metadataUri: string
  totalSwaps: bigint
  totalUiVolume: bigint
}

export function decodeAlliance(address: PublicKey, data: Uint8Array): Alliance {
  const c = new Cursor(data, 8)
  return {
    address,
    id: c.u64(),
    authority: c.pubkey(),
    pendingAuthority: c.option(() => c.pubkey()),
    name: c.string(),
    memberCount: c.u16(),
    paused: c.bool(),
    feeBps: c.u16(),
    minRateBps: c.u32(),
    maxRateBps: c.u32(),
    category: c.u8(),
    metadataUri: c.string(),
    totalSwaps: c.u64(),
    totalUiVolume: c.u128(),
  }
}

export interface AllianceMember {
  address: PublicKey
  alliance: PublicKey
  merchant: PublicKey
  rateBpsToAlliance: number
  swapInBudgetRaw: bigint
  swappedInToday: bigint
  active: boolean
  joinedAt: bigint
  totalSwappedIn: bigint
  totalSwappedOut: bigint
}

export function decodeAllianceMember(address: PublicKey, data: Uint8Array): AllianceMember {
  const c = new Cursor(data, 8)
  const alliance = c.pubkey()
  const merchant = c.pubkey()
  const rateBpsToAlliance = c.u32()
  const swapInBudgetRaw = c.u64()
  const swappedInToday = c.u64()
  c.u32() // budget_day
  const active = c.bool()
  const joinedAt = c.i64()
  const totalSwappedIn = c.u64()
  const totalSwappedOut = c.u64()
  return {
    address,
    alliance,
    merchant,
    rateBpsToAlliance,
    swapInBudgetRaw,
    swappedInToday,
    active,
    joinedAt,
    totalSwappedIn,
    totalSwappedOut,
  }
}

// ── argus ─────────────────────────────────────────────────────────────────

export interface GuardConfig {
  mint: PublicKey
  authority: PublicKey
  treasury: PublicKey
  attestationIssuer: PublicKey
  paused: boolean
  flags: number
  dailyGiftCap: bigint
  perTxCap: bigint
  maxWalletBalance: bigint
  transfersPerDayCap: number
  cooldownSecs: number
  attestationSchema: number
  attestationMask: bigint
}

export function decodeGuardConfig(data: Uint8Array): GuardConfig {
  const c = new Cursor(data, 8)
  const mint = c.pubkey()
  const authority = c.pubkey()
  c.option(() => c.pubkey()) // pending_authority
  const treasury = c.pubkey()
  const attestationIssuer = c.pubkey()
  const paused = c.bool()
  const flags = c.u16()
  const dailyGiftCap = c.u64()
  const perTxCap = c.u64()
  const maxWalletBalance = c.u64()
  const transfersPerDayCap = c.u16()
  const cooldownSecs = c.u32()
  const attestationSchema = c.u16()
  const attestationMask = c.u64()
  return {
    mint,
    authority,
    treasury,
    attestationIssuer,
    paused,
    flags,
    dailyGiftCap,
    perTxCap,
    maxWalletBalance,
    transfersPerDayCap,
    cooldownSecs,
    attestationSchema,
    attestationMask,
  }
}

// ── aegis ─────────────────────────────────────────────────────────────────

export interface Attestation {
  address: PublicKey
  issuer: PublicKey
  subject: PublicKey
  schema: number
  value: bigint
  issuedAt: bigint
  validFrom: bigint
  expiresAt: bigint
  revoked: boolean
}

export function decodeAttestation(address: PublicKey, data: Uint8Array): Attestation {
  const c = new Cursor(data, 8)
  return {
    address,
    issuer: c.pubkey(),
    subject: c.pubkey(),
    schema: c.u16(),
    value: c.u64(),
    issuedAt: c.i64(),
    validFrom: c.i64(),
    expiresAt: c.i64(),
    revoked: c.bool(),
  }
}

export interface Issuer {
  address: PublicKey
  id: bigint
  authority: PublicKey
  operator: PublicKey | null
  name: string
  issued: bigint
  paused: boolean
}

export function decodeIssuer(address: PublicKey, data: Uint8Array): Issuer {
  const c = new Cursor(data, 8)
  const id = c.u64()
  const authority = c.pubkey()
  c.option(() => c.pubkey()) // pending_authority
  const operator = c.option(() => c.pubkey())
  const name = c.string()
  const issued = c.u64()
  const paused = c.bool()
  return { address, id, authority, operator, name, issued, paused }
}
