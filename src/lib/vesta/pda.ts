import { PublicKey } from '@solana/web3.js'

import { AEGIS, ARGUS, ASSOCIATED_TOKEN, TOKEN_2022, VESTA_CORE } from './constants'

const s = (v: string) => new TextEncoder().encode(v)

function u64le(n: bigint): Uint8Array {
  const b = new Uint8Array(8)
  new DataView(b.buffer).setBigUint64(0, n, true)
  return b
}

function u32le(n: number): Uint8Array {
  const b = new Uint8Array(4)
  new DataView(b.buffer).setUint32(0, n, true)
  return b
}

const derive = (seeds: Uint8Array[], program = VESTA_CORE) =>
  PublicKey.findProgramAddressSync(seeds, program)[0]

export const pdas = {
  // ── vesta_core ────────────────────────────────────────────────────────────
  config: () => derive([s('config')]),
  /** Multi-record: a wallet owns many merchants, keyed by (authority, id). */
  merchant: (authority: PublicKey, id: bigint) =>
    derive([s('merchant'), authority.toBytes(), u64le(id)]),
  mint: (merchant: PublicKey) => derive([s('mint'), merchant.toBytes()]),
  customerProfile: (merchant: PublicKey, wallet: PublicKey) =>
    derive([s('customer'), merchant.toBytes(), wallet.toBytes()]),
  offer: (merchant: PublicKey, id: bigint) => derive([s('offer'), merchant.toBytes(), u64le(id)]),
  campaign: (merchant: PublicKey, id: bigint) =>
    derive([s('campaign'), merchant.toBytes(), u64le(id)]),
  campaignProgress: (campaign: PublicKey, customer: PublicKey) =>
    derive([s('cprogress'), campaign.toBytes(), customer.toBytes()]),
  achievement: (merchant: PublicKey, id: bigint) =>
    derive([s('achieve'), merchant.toBytes(), u64le(id)]),
  badge: (achievement: PublicKey, customer: PublicKey) =>
    derive([s('badge'), achievement.toBytes(), customer.toBytes()]),
  kleosReceipt: (achievement: PublicKey, customer: PublicKey) =>
    derive([s('kleos'), achievement.toBytes(), customer.toBytes()]),
  receipt: (offer: PublicKey, customer: PublicKey, redemptionIndex: number) =>
    derive([s('receipt'), offer.toBytes(), customer.toBytes(), u32le(redemptionIndex)]),
  alliance: (creator: PublicKey, id: bigint) =>
    derive([s('alliance'), creator.toBytes(), u64le(id)]),
  member: (alliance: PublicKey, merchant: PublicKey) =>
    derive([s('member'), alliance.toBytes(), merchant.toBytes()]),

  /** Per-merchant verified-segment definitions (spec 12). */
  merchantSegments: (merchant: PublicKey) => derive([s('segments'), merchant.toBytes()]),
  /** Per-(merchant, customer) cached segment verdicts (spec 12). */
  customerEligibility: (merchant: PublicKey, customer: PublicKey) =>
    derive([s('celig'), merchant.toBytes(), customer.toBytes()]),

  // ── argus (transfer-hook policy engine) ─────────────────────────────────────
  guardConfig: (mint: PublicKey) => derive([s('guard'), mint.toBytes()], ARGUS),
  /** Cached eligibility capability the hook reads (spec 09). */
  capability: (mint: PublicKey, subject: PublicKey) =>
    derive([s('cap'), mint.toBytes(), subject.toBytes()], ARGUS),
  walletState: (mint: PublicKey, owner: PublicKey) =>
    derive([s('wstate'), mint.toBytes(), owner.toBytes()], ARGUS),
  listEntry: (mint: PublicKey, target: PublicKey) =>
    derive([s('entry'), mint.toBytes(), target.toBytes()], ARGUS),
  extraAccountMetaList: (mint: PublicKey) =>
    derive([s('extra-account-metas'), mint.toBytes()], ARGUS),

  // ── aegis (attestation issuer) ──────────────────────────────────────────────
  issuer: (authority: PublicKey, id: bigint) =>
    derive([s('issuer'), authority.toBytes(), u64le(id)], AEGIS),
  /** Multi-credential: one attestation per (issuer, subject, schema). */
  attestation: (issuer: PublicKey, subject: PublicKey, schemaId: bigint) =>
    derive([s('attestation'), issuer.toBytes(), subject.toBytes(), u64le(schemaId)], AEGIS),
}

/** ATA under Token-2022 (off-curve owners allowed for PDA treasuries). */
export function ata(mint: PublicKey, owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBytes(), TOKEN_2022.toBytes(), mint.toBytes()],
    ASSOCIATED_TOKEN,
  )[0]
}
