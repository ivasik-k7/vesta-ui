import { PublicKey } from '@solana/web3.js'

// Minimal cursor for Anchor/borsh fixed-layout account reads — we only decode
// the leading fixed fields the UI needs, then stop (strings/options that would
// follow are skipped by returning early where possible).
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

export interface Merchant {
  address: PublicKey
  authority: PublicKey
  pointMint: PublicKey
  treasury: PublicKey
  name: string
  decayRateBps: number
  baseEarnRate: bigint
  lifetimePointsIssued: bigint
  customerCount: bigint
  joinedAlliance: PublicKey | null
}

export function decodeMerchant(address: PublicKey, data: Uint8Array): Merchant {
  const c = new Cursor(data, 8) // skip discriminator
  return {
    address,
    authority: c.pubkey(),
    pointMint: c.pubkey(),
    treasury: c.pubkey(),
    name: c.string(),
    decayRateBps: c.i16(),
    baseEarnRate: c.u64(),
    lifetimePointsIssued: c.u128(),
    customerCount: c.u64(),
    joinedAlliance: c.option(() => c.pubkey()),
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
  multiplierBps: number
  startsAt: bigint
  endsAt: bigint
  active: boolean
}

export function decodeCampaign(address: PublicKey, data: Uint8Array): Campaign {
  const c = new Cursor(data, 8)
  return {
    address,
    merchant: c.pubkey(),
    id: c.u64(),
    multiplierBps: c.u16(),
    startsAt: c.i64(),
    endsAt: c.i64(),
    active: c.bool(),
  }
}
