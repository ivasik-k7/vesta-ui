import { sha256 } from '@noble/hashes/sha2.js'
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
} from '@solana/spl-token'
import {
  type AccountMeta,
  type PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js'
import { Buffer } from 'buffer'

import { AEGIS, ARGUS, ASSOCIATED_TOKEN, DECIMALS, TOKEN_2022, VESTA_CORE } from './constants'
import { ata, pdas } from './pda'

const utf8 = new TextEncoder()

// Anchor global instruction discriminator — sha256("global:<name>")[..8].
function disc(name: string): Buffer {
  return Buffer.from(sha256(utf8.encode(`global:${name}`)).subarray(0, 8))
}
function u64(n: bigint): Buffer {
  const b = new Uint8Array(8)
  new DataView(b.buffer).setBigUint64(0, n, true)
  return Buffer.from(b)
}
function u32(n: number): Buffer {
  const b = new Uint8Array(4)
  new DataView(b.buffer).setUint32(0, n, true)
  return Buffer.from(b)
}
function u16(n: number): Buffer {
  const b = new Uint8Array(2)
  new DataView(b.buffer).setUint16(0, n, true)
  return Buffer.from(b)
}
function i16(n: number): Buffer {
  const b = new Uint8Array(2)
  new DataView(b.buffer).setInt16(0, n, true)
  return Buffer.from(b)
}
function i64(n: bigint): Buffer {
  const b = new Uint8Array(8)
  new DataView(b.buffer).setBigInt64(0, n, true)
  return Buffer.from(b)
}
function bool(v: boolean): Buffer {
  return Buffer.from([v ? 1 : 0])
}
function optU64(v: bigint | null | undefined): Buffer {
  return v === null || v === undefined
    ? Buffer.from([0])
    : Buffer.concat([Buffer.from([1]), u64(v)])
}
function borshString(v: string): Buffer {
  const body = utf8.encode(v)
  return Buffer.concat([u32(body.length), Buffer.from(body)])
}
const m = (pubkey: PublicKey, isSigner: boolean, isWritable: boolean): AccountMeta => ({
  pubkey,
  isSigner,
  isWritable,
})

/** Full policy for `initialize_transfer_guard` (argus). */
export interface InitialPolicy {
  flags: number
  dailyGiftCap: bigint
  perTxCap: bigint
  maxWalletBalance: bigint
  transfersPerDayCap: number
  cooldownSecs: number
  attestationIssuer: PublicKey
  attestationSchema: number
  attestationMask: bigint
}

/** Args for `create_campaign` (vesta_core). */
export interface CampaignArgs {
  kind: number
  multiplierBps: number
  flatBonus: bigint
  questTarget: number
  questReward: bigint
  minSpendBase: bigint
  minTier: number
  pointsBudget: bigint
  perCustomerCap: bigint
  startsAt: bigint
  endsAt: bigint
  name: string
}

/**
 * The argus transfer-hook extras in ExtraAccountMetaList order, followed by the
 * argus program and the meta list. Appended to a hooked `transfer_checked`
 * (gifts) or passed as `remaining_accounts` (clawback).
 */
export function argusExtras(
  mint: PublicKey,
  sourceOwner: PublicKey,
  destOwner: PublicKey,
): AccountMeta[] {
  return [
    m(pdas.guardConfig(mint), false, false),
    m(pdas.walletState(mint, sourceOwner), false, true),
    m(destOwner, false, false),
    m(pdas.listEntry(mint, destOwner), false, false),
    // spec 09: the hook reads the cached eligibility capability — never aegis.
    m(pdas.capability(mint, destOwner), false, false),
    m(ARGUS, false, false),
    m(pdas.extraAccountMetaList(mint), false, false),
  ]
}

// ── customer / holder ───────────────────────────────────────────────────────

/** One-time velocity-state creation for a gift sender (customer signs). */
export function openWalletStateIx(owner: PublicKey, mint: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    programId: ARGUS,
    keys: [
      m(owner, true, true),
      m(mint, false, false),
      m(pdas.walletState(mint, owner), false, true),
      m(SystemProgram.programId, false, false),
    ],
    data: disc('open_wallet_state'),
  })
}

/** Hooked transfer_checked with the argus v2 extras appended. */
export function giftIxns(params: {
  from: PublicKey
  to: PublicKey
  mint: PublicKey
  merchantAuthority: PublicKey
  rawAmount: bigint
  ensureWalletState: boolean
  ensureDestAta: boolean
}): TransactionInstruction[] {
  const ixns: TransactionInstruction[] = []
  const fromAta = ata(params.mint, params.from)
  const toAta = ata(params.mint, params.to)
  if (params.ensureWalletState) ixns.push(openWalletStateIx(params.from, params.mint))
  if (params.ensureDestAta) {
    ixns.push(
      createAssociatedTokenAccountIdempotentInstruction(
        params.from,
        toAta,
        params.to,
        params.mint,
        TOKEN_2022,
      ),
    )
  }
  const transfer = createTransferCheckedInstruction(
    fromAta,
    params.mint,
    toAta,
    params.from,
    params.rawAmount,
    DECIMALS,
    [],
    TOKEN_2022,
  )
  transfer.keys.push(...argusExtras(params.mint, params.from, params.to))
  ixns.push(transfer)
  return ixns
}

/** Burn points for an offer (customer signs). */
export function redeemOfferIx(params: {
  customer: PublicKey
  merchant: PublicKey
  mint: PublicKey
  offerId: bigint
  redemptionIndex: number
  maxRawAmount: bigint
  /** Pass true for segment-gated offers: supplies the real eligibility PDAs. */
  withEligibility?: boolean
}): TransactionInstruction {
  const offer = pdas.offer(params.merchant, params.offerId)
  // Anchor optional accounts: None is encoded as the program id itself.
  const segments = params.withEligibility ? pdas.merchantSegments(params.merchant) : VESTA_CORE
  const eligibility = params.withEligibility
    ? pdas.customerEligibility(params.merchant, params.customer)
    : VESTA_CORE
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.customer, true, true),
      m(params.merchant, false, true),
      m(offer, false, true),
      m(pdas.customerProfile(params.merchant, params.customer), false, true),
      m(pdas.receipt(offer, params.customer, params.redemptionIndex), false, true),
      m(params.mint, false, true),
      m(ata(params.mint, params.customer), false, true),
      m(pdas.config(), false, false),
      m(segments, false, false),
      m(eligibility, false, false),
      m(TOKEN_2022, false, false),
      m(ASSOCIATED_TOKEN, false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([disc('redeem_offer'), u64(params.maxRawAmount)]),
  })
}

/** UI-denominated cross-merchant swap (customer signs). */
export function swapPointsIx(params: {
  customer: PublicKey
  alliance: PublicKey
  merchantA: PublicKey
  merchantB: PublicKey
  mintA: PublicKey
  mintB: PublicKey
  uiAmount: bigint
  maxRawIn: bigint
  minRawOut: bigint
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.customer, true, true),
      m(params.alliance, false, true),
      m(pdas.member(params.alliance, params.merchantA), false, true),
      m(pdas.member(params.alliance, params.merchantB), false, true),
      m(params.merchantA, false, false),
      m(params.merchantB, false, false),
      m(params.mintA, false, true),
      m(params.mintB, false, true),
      m(ata(params.mintA, params.customer), false, true),
      m(ata(params.mintB, params.customer), false, true),
      m(pdas.config(), false, false),
      m(TOKEN_2022, false, false),
      m(ASSOCIATED_TOKEN, false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([
      disc('swap_points'),
      u64(params.uiAmount),
      u64(params.maxRawIn),
      u64(params.minRawOut),
    ]),
  })
}

/** Permissionless: grant an earned soulbound badge to a customer. */
export function grantAchievementIx(params: {
  payer: PublicKey
  merchant: PublicKey
  achievementId: bigint
  customer: PublicKey
}): TransactionInstruction {
  const achievement = pdas.achievement(params.merchant, params.achievementId)
  const badgeMint = pdas.badge(achievement, params.customer)
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.payer, true, true),
      m(params.merchant, false, true),
      m(achievement, false, true),
      m(params.customer, false, false),
      m(pdas.customerProfile(params.merchant, params.customer), false, false),
      m(badgeMint, false, true),
      m(ata(badgeMint, params.customer), false, true),
      m(pdas.kleosReceipt(achievement, params.customer), false, true),
      m(pdas.config(), false, false),
      m(TOKEN_2022, false, false),
      m(ASSOCIATED_TOKEN, false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: disc('grant_achievement'),
  })
}

// ── merchant lifecycle & operations ─────────────────────────────────────────

/** Register a merchant (creates the Token-2022 mint). Multi-record via `id`. */
export function registerMerchantIx(params: {
  authority: PublicKey
  id?: bigint
  name: string
  symbol: string
  uri: string
  decayRateBps: number
  baseEarnRate: bigint
}): TransactionInstruction {
  const id = params.id ?? 0n
  const merchant = pdas.merchant(params.authority, id)
  const mint = pdas.mint(merchant)
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, true),
      m(merchant, false, true),
      m(mint, false, true),
      m(ata(mint, params.authority), false, true),
      m(pdas.config(), false, false),
      m(TOKEN_2022, false, false),
      m(ASSOCIATED_TOKEN, false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([
      disc('register_merchant'),
      u64(id),
      borshString(params.name),
      borshString(params.symbol),
      borshString(params.uri),
      i16(params.decayRateBps),
      u64(params.baseEarnRate),
      Buffer.from([DECIMALS]),
    ]),
  })
}

/** Delete a merchant (only when point supply is zero). */
export function closeMerchantIx(authority: PublicKey, merchant: PublicKey, mint: PublicKey) {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(authority, true, true),
      m(merchant, false, true),
      m(mint, false, true),
      m(TOKEN_2022, false, false),
    ],
    data: disc('close_merchant'),
  })
}

/** Update the merchant base earn rate. */
export function updateMerchantIx(
  authority: PublicKey,
  merchant: PublicKey,
  baseEarnRate: bigint | null,
): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [m(authority, true, false), m(merchant, false, true), m(pdas.config(), false, false)],
    data: Buffer.concat([disc('update_merchant'), optU64(baseEarnRate)]),
  })
}

const ownerOnly = (name: string, authority: PublicKey, merchant: PublicKey, data: Buffer[] = []) =>
  new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [m(authority, true, false), m(merchant, false, true)],
    data: Buffer.concat([disc(name), ...data]),
  })

/** Add/remove a hot operator key (owner signs). */
export function setMerchantOperatorIx(
  authority: PublicKey,
  merchant: PublicKey,
  operator: PublicKey,
  add: boolean,
): TransactionInstruction {
  return ownerOnly('set_merchant_operator', authority, merchant, [operator.toBuffer(), bool(add)])
}

/** Merchant-level pause (owner signs). */
export function setMerchantPausedIx(authority: PublicKey, merchant: PublicKey, paused: boolean) {
  return ownerOnly('set_merchant_paused', authority, merchant, [bool(paused)])
}

/** Update category + off-chain profile URI (owner signs). */
export function updateMerchantProfileIx(
  authority: PublicKey,
  merchant: PublicKey,
  category: number,
  metadataUri: string,
): TransactionInstruction {
  return ownerOnly('update_merchant_profile', authority, merchant, [
    Buffer.from([category]),
    borshString(metadataUri),
  ])
}

/** Set the daily clawback cap in raw units (0 = unlimited; owner signs). */
export function setClawbackCapIx(authority: PublicKey, merchant: PublicKey, cap: bigint) {
  return ownerOnly('set_clawback_cap', authority, merchant, [u64(cap)])
}

/** Set the merchant's daily issuance cap in raw units (owner signs). Same
 *  MerchantOwnerOnly context as set_clawback_cap. */
export function setDailyIssueCapIx(authority: PublicKey, merchant: PublicKey, cap: bigint) {
  return ownerOnly('set_daily_issue_cap', authority, merchant, [u64(cap)])
}

/** Admin verifies (or unverifies) a merchant (config admin signs). */
export function verifyMerchantIx(
  admin: PublicKey,
  merchant: PublicKey,
  verified: boolean,
): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [m(admin, true, false), m(merchant, false, true), m(pdas.config(), false, false)],
    data: Buffer.concat([disc('verify_merchant'), bool(verified)]),
  })
}

/** Attach/update a custom token metadata attribute (owner signs). */
export function setTokenAttributeIx(params: {
  authority: PublicKey
  merchant: PublicKey
  mint: PublicKey
  key: string
  value: string
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, true),
      m(params.merchant, false, true),
      m(params.mint, false, true),
      m(TOKEN_2022, false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([
      disc('set_token_attribute'),
      borshString(params.key),
      borshString(params.value),
    ]),
  })
}

/** Update a core token metadata field (0=name,1=symbol,2=uri; owner signs). */
export function updateTokenMetadataIx(params: {
  authority: PublicKey
  merchant: PublicKey
  mint: PublicKey
  fieldKind: number
  value: string
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, true),
      m(params.merchant, false, true),
      m(params.mint, false, true),
      m(TOKEN_2022, false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([
      disc('update_token_metadata'),
      Buffer.from([params.fieldKind]),
      borshString(params.value),
    ]),
  })
}

/** Update the interest-bearing (decay) rate (owner signs). */
export function updateDecayRateIx(params: {
  authority: PublicKey
  merchant: PublicKey
  mint: PublicKey
  newRateBps: number
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, true),
      m(params.merchant, false, true),
      m(params.mint, false, true),
      m(TOKEN_2022, false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([disc('update_decay_rate'), i16(params.newRateBps)]),
  })
}

/** Earn points (streak only; merchant authority or operator signs). */
export function earnPointsIx(params: {
  signer: PublicKey
  merchant: PublicKey
  mint: PublicKey
  customer: PublicKey
  amountBase: bigint
  visitDay: number
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.signer, true, true),
      m(params.merchant, false, true),
      m(params.customer, false, false),
      m(pdas.customerProfile(params.merchant, params.customer), false, true),
      m(params.mint, false, true),
      m(ata(params.mint, params.customer), false, true),
      m(pdas.config(), false, false),
      m(VESTA_CORE, false, false), // merchant_segments: None
      m(VESTA_CORE, false, false), // customer_eligibility: None
      m(TOKEN_2022, false, false),
      m(ASSOCIATED_TOKEN, false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([disc('earn_points'), u64(params.amountBase), u32(params.visitDay)]),
  })
}

/** Earn with a governed campaign applied. */
export function earnPointsCampaignIx(params: {
  signer: PublicKey
  merchant: PublicKey
  mint: PublicKey
  customer: PublicKey
  campaign: PublicKey
  amountBase: bigint
  visitDay: number
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.signer, true, true),
      m(params.merchant, false, true),
      m(params.customer, false, false),
      m(pdas.customerProfile(params.merchant, params.customer), false, true),
      m(params.campaign, false, true),
      m(pdas.campaignProgress(params.campaign, params.customer), false, true),
      m(params.mint, false, true),
      m(ata(params.mint, params.customer), false, true),
      m(pdas.config(), false, false),
      m(TOKEN_2022, false, false),
      m(ASSOCIATED_TOKEN, false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([
      disc('earn_points_campaign'),
      u64(params.amountBase),
      u32(params.visitDay),
    ]),
  })
}

/** Clawback via PermanentDelegate — hooked transfer to the merchant treasury. */
export function clawbackIx(params: {
  authority: PublicKey
  merchant: PublicKey
  mint: PublicKey
  treasuryOwner: PublicKey
  customer: PublicKey
  amountRaw: bigint
  reasonCode: number
  issuer?: PublicKey
}): TransactionInstruction {
  const treasury = ata(params.mint, params.treasuryOwner)
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, true),
      m(params.merchant, false, true),
      m(params.customer, false, false),
      m(pdas.customerProfile(params.merchant, params.customer), false, true),
      m(ata(params.mint, params.customer), false, true),
      m(treasury, false, true),
      m(params.mint, false, true),
      m(pdas.config(), false, false),
      m(TOKEN_2022, false, false),
      m(SystemProgram.programId, false, false),
      // remaining_accounts: the argus hook extras (dest owner = treasury owner).
      ...argusExtras(params.mint, params.customer, params.treasuryOwner),
    ],
    data: Buffer.concat([disc('clawback'), u64(params.amountRaw), u16(params.reasonCode)]),
  })
}

// ── offers ──────────────────────────────────────────────────────────────────

export function createOfferIx(params: {
  authority: PublicKey
  merchant: PublicKey
  id: bigint
  pricePoints: bigint
  supply: number
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, true),
      m(params.merchant, false, false),
      m(pdas.offer(params.merchant, params.id), false, true),
      m(pdas.config(), false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([
      disc('create_offer'),
      u64(params.id),
      u64(params.pricePoints),
      u32(params.supply),
    ]),
  })
}

export function closeOfferIx(authority: PublicKey, merchant: PublicKey, offerId: bigint) {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(authority, true, true),
      m(merchant, false, false),
      m(pdas.offer(merchant, offerId), false, true),
    ],
    data: disc('close_offer'),
  })
}

// ── campaigns ─────────────────────────────────────────────────────────────

export function createCampaignIx(params: {
  authority: PublicKey
  merchant: PublicKey
  id: bigint
  args: CampaignArgs
}): TransactionInstruction {
  const a = params.args
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, true),
      m(params.merchant, false, false),
      m(pdas.campaign(params.merchant, params.id), false, true),
      m(pdas.config(), false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([
      disc('create_campaign'),
      u64(params.id),
      Buffer.from([a.kind]),
      u16(a.multiplierBps),
      u64(a.flatBonus),
      u16(a.questTarget),
      u64(a.questReward),
      u64(a.minSpendBase),
      Buffer.from([a.minTier]),
      u64(a.pointsBudget),
      u64(a.perCustomerCap),
      i64(a.startsAt),
      i64(a.endsAt),
      borshString(a.name),
    ]),
  })
}

export function updateCampaignIx(params: {
  authority: PublicKey
  merchant: PublicKey
  campaign: PublicKey
  endsAt?: bigint | null
  pointsBudget?: bigint | null
  perCustomerCap?: bigint | null
  paused?: boolean | null
}): TransactionInstruction {
  const optI64 = (v: bigint | null | undefined) =>
    v === null || v === undefined ? Buffer.from([0]) : Buffer.concat([Buffer.from([1]), i64(v)])
  const optBool = (v: boolean | null | undefined) =>
    v === null || v === undefined ? Buffer.from([0]) : Buffer.concat([Buffer.from([1]), bool(v)])
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, false),
      m(params.merchant, false, false),
      m(params.campaign, false, true),
    ],
    data: Buffer.concat([
      disc('update_campaign'),
      optI64(params.endsAt),
      optU64(params.pointsBudget),
      optU64(params.perCustomerCap),
      optBool(params.paused),
    ]),
  })
}

export function closeCampaignIx(authority: PublicKey, merchant: PublicKey, campaignId: bigint) {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(authority, true, true),
      m(merchant, false, false),
      m(pdas.campaign(merchant, campaignId), false, true),
    ],
    data: disc('close_campaign'),
  })
}

// ── achievements ────────────────────────────────────────────────────────────

export function createAchievementIx(params: {
  authority: PublicKey
  merchant: PublicKey
  id: bigint
  name: string
  uri: string
  thresholdLifetime: bigint
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, true),
      m(params.merchant, false, false),
      m(pdas.achievement(params.merchant, params.id), false, true),
      m(pdas.config(), false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([
      disc('create_achievement'),
      u64(params.id),
      borshString(params.name),
      borshString(params.uri),
      u64(params.thresholdLifetime),
    ]),
  })
}

export function closeAchievementIx(
  authority: PublicKey,
  merchant: PublicKey,
  achievementId: bigint,
) {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(authority, true, true),
      m(merchant, false, false),
      m(pdas.achievement(merchant, achievementId), false, true),
    ],
    data: disc('close_achievement'),
  })
}

// ── guard (argus) ────────────────────────────────────────────────────────────

export function initializeTransferGuardIx(params: {
  authority: PublicKey
  merchant: PublicKey
  mint: PublicKey
  policy: InitialPolicy
}): TransactionInstruction {
  const p = params.policy
  return new TransactionInstruction({
    programId: ARGUS,
    keys: [
      m(params.authority, true, true),
      m(params.merchant, false, false),
      m(params.mint, false, false),
      m(pdas.guardConfig(params.mint), false, true),
      m(pdas.extraAccountMetaList(params.mint), false, true),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([
      disc('initialize_transfer_guard'),
      u16(p.flags),
      u64(p.dailyGiftCap),
      u64(p.perTxCap),
      u64(p.maxWalletBalance),
      u16(p.transfersPerDayCap),
      u32(p.cooldownSecs),
      p.attestationIssuer.toBuffer(),
      u16(p.attestationSchema),
      u64(p.attestationMask),
    ]),
  })
}

/** argus: retune the guard policy (guard authority signs). */
export function configurePolicyIx(params: {
  authority: PublicKey
  mint: PublicKey
  flags?: number | null
  dailyGiftCap?: bigint | null
  perTxCap?: bigint | null
  maxWalletBalance?: bigint | null
  transfersPerDayCap?: number | null
  cooldownSecs?: number | null
  attestationSchema?: number | null
  attestationMask?: bigint | null
}): TransactionInstruction {
  const optU16 = (v: number | null | undefined) =>
    v === null || v === undefined ? Buffer.from([0]) : Buffer.concat([Buffer.from([1]), u16(v)])
  const optU32 = (v: number | null | undefined) =>
    v === null || v === undefined ? Buffer.from([0]) : Buffer.concat([Buffer.from([1]), u32(v)])
  return new TransactionInstruction({
    programId: ARGUS,
    keys: [m(params.authority, true, false), m(pdas.guardConfig(params.mint), false, true)],
    data: Buffer.concat([
      disc('configure_policy'),
      optU16(params.flags),
      optU64(params.dailyGiftCap),
      optU64(params.perTxCap),
      optU64(params.maxWalletBalance),
      optU16(params.transfersPerDayCap),
      optU32(params.cooldownSecs),
      optU16(params.attestationSchema),
      optU64(params.attestationMask),
    ]),
  })
}

/** argus: pause peer transfers of a mint (guard authority signs). */
export function setGuardPausedIx(authority: PublicKey, mint: PublicKey, paused: boolean) {
  return new TransactionInstruction({
    programId: ARGUS,
    keys: [m(authority, true, false), m(pdas.guardConfig(mint), false, true)],
    data: Buffer.concat([disc('set_guard_paused'), bool(paused)]),
  })
}

/** vesta_core: burn the hook authority after the guard is live (merchant signs). */
export function finalizeTransferGuardIx(
  authority: PublicKey,
  merchant: PublicKey,
  mint: PublicKey,
): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(authority, true, false),
      m(merchant, false, false),
      m(mint, false, true),
      m(pdas.extraAccountMetaList(mint), false, false),
      m(pdas.config(), false, false),
      m(TOKEN_2022, false, false),
    ],
    data: disc('finalize_transfer_guard'),
  })
}

// ── alliances (koinon) ───────────────────────────────────────────────────────

export function createAllianceIx(params: {
  creator: PublicKey
  id: bigint
  name: string
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.creator, true, true),
      m(pdas.alliance(params.creator, params.id), false, true),
      m(pdas.config(), false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([disc('create_alliance'), u64(params.id), borshString(params.name)]),
  })
}

export function joinAllianceIx(params: {
  authority: PublicKey
  merchant: PublicKey
  alliance: PublicKey
  allianceAuthority: PublicKey
  rateBps: number
  swapInBudgetRaw: bigint
}): TransactionInstruction {
  const selfJoin = params.authority.equals(params.allianceAuthority)
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, true),
      m(params.allianceAuthority, !selfJoin, false),
      m(params.merchant, false, true),
      m(params.alliance, false, true),
      m(pdas.member(params.alliance, params.merchant), false, true),
      m(pdas.config(), false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([disc('join_alliance'), u32(params.rateBps), u64(params.swapInBudgetRaw)]),
  })
}

export function leaveAllianceIx(authority: PublicKey, merchant: PublicKey, alliance: PublicKey) {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(authority, true, true),
      m(merchant, false, true),
      m(alliance, false, true),
      m(pdas.member(alliance, merchant), false, true),
    ],
    data: disc('leave_alliance'),
  })
}

export function setSwapRateIx(params: {
  authority: PublicKey
  merchant: PublicKey
  allianceAuthority: PublicKey
  alliance: PublicKey
  newRate: number
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, false),
      m(params.allianceAuthority, true, false),
      m(params.merchant, false, false),
      m(params.alliance, false, false),
      m(pdas.member(params.alliance, params.merchant), false, true),
    ],
    data: Buffer.concat([disc('set_swap_rate'), u32(params.newRate)]),
  })
}

export function setSwapBudgetIx(params: {
  authority: PublicKey
  merchant: PublicKey
  alliance: PublicKey
  newBudget: bigint
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, false),
      m(params.merchant, false, false),
      m(pdas.member(params.alliance, params.merchant), false, true),
    ],
    data: Buffer.concat([disc('set_swap_budget'), u64(params.newBudget)]),
  })
}

const allianceAuthorityOnly = (
  name: string,
  authority: PublicKey,
  alliance: PublicKey,
  data: Buffer[] = [],
) =>
  new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [m(authority, true, false), m(alliance, false, true)],
    data: Buffer.concat([disc(name), ...data]),
  })

export function setAlliancePausedIx(authority: PublicKey, alliance: PublicKey, paused: boolean) {
  return allianceAuthorityOnly('set_alliance_paused', authority, alliance, [bool(paused)])
}

export function setAllianceParamsIx(params: {
  authority: PublicKey
  alliance: PublicKey
  feeBps: number
  minRateBps: number
  maxRateBps: number
}): TransactionInstruction {
  return allianceAuthorityOnly('set_alliance_params', params.authority, params.alliance, [
    u16(params.feeBps),
    u32(params.minRateBps),
    u32(params.maxRateBps),
  ])
}

export function updateAllianceProfileIx(params: {
  authority: PublicKey
  alliance: PublicKey
  category: number
  metadataUri: string
}): TransactionInstruction {
  return allianceAuthorityOnly('update_alliance_profile', params.authority, params.alliance, [
    Buffer.from([params.category]),
    borshString(params.metadataUri),
  ])
}

export function setMemberActiveIx(params: {
  authority: PublicKey
  alliance: PublicKey
  merchant: PublicKey
  active: boolean
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, false),
      m(params.alliance, false, false),
      m(pdas.member(params.alliance, params.merchant), false, true),
    ],
    data: Buffer.concat([disc('set_member_active'), bool(params.active)]),
  })
}

// ── protocol admin ───────────────────────────────────────────────────────────

export function setPausedIx(admin: PublicKey, paused: boolean): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [m(admin, true, false), m(pdas.config(), false, true)],
    data: Buffer.concat([disc('set_paused'), bool(paused)]),
  })
}

export function setAdminIx(admin: PublicKey, newAdmin: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [m(admin, true, false), m(pdas.config(), false, true)],
    data: Buffer.concat([disc('set_admin'), newAdmin.toBuffer()]),
  })
}

export function acceptAdminIx(pendingAdmin: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [m(pendingAdmin, true, false), m(pdas.config(), false, true)],
    data: disc('accept_admin'),
  })
}

// ── aegis (attestation issuer) ───────────────────────────────────────────────

export function initIssuerIx(params: {
  authority: PublicKey
  id?: bigint
  name: string
}): TransactionInstruction {
  const id = params.id ?? 0n
  return new TransactionInstruction({
    programId: AEGIS,
    keys: [
      m(params.authority, true, true),
      m(pdas.issuer(params.authority, id), false, true),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([disc('init_issuer'), u64(id), borshString(params.name)]),
  })
}

export function issueAttestationIx(params: {
  signer: PublicKey
  issuer: PublicKey
  subject: PublicKey
  schemaId: bigint
  /** sha256 commitment over the off-chain claims (no PII on-chain). */
  commitment: Uint8Array
  attrRoot?: Uint8Array
  validFrom: bigint
  expiresAt: bigint
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: AEGIS,
    keys: [
      m(params.signer, true, true),
      m(params.issuer, false, true),
      m(pdas.attestation(params.issuer, params.subject, params.schemaId), false, true),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([
      disc('issue_attestation'),
      params.subject.toBuffer(),
      u64(params.schemaId),
      Buffer.from(params.commitment),
      Buffer.from(params.attrRoot ?? new Uint8Array(32)),
      i64(params.validFrom),
      i64(params.expiresAt),
    ]),
  })
}

export function revokeAttestationIx(params: {
  signer: PublicKey
  issuer: PublicKey
  subject: PublicKey
  schemaId: bigint
  reasonCode: number
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: AEGIS,
    keys: [
      m(params.signer, true, false),
      m(params.issuer, false, false),
      m(pdas.attestation(params.issuer, params.subject, params.schemaId), false, true),
    ],
    data: Buffer.concat([disc('revoke_attestation'), u16(params.reasonCode)]),
  })
}

/** Refresh one verified-segment verdict for a customer (permissionless — the
 * customer can self-activate their boost; CPIs aegis verify off the hot path). */
export function refreshCustomerEligibilityIx(params: {
  payer: PublicKey
  merchant: PublicKey
  customer: PublicKey
  issuer: PublicKey
  schemaId: bigint
  segmentIndex: number
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.payer, true, true),
      m(params.merchant, false, false),
      m(params.customer, false, false),
      m(pdas.merchantSegments(params.merchant), false, false),
      m(pdas.customerEligibility(params.merchant, params.customer), false, true),
      m(pdas.attestation(params.issuer, params.customer, params.schemaId), false, false),
      m(AEGIS, false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([disc('refresh_customer_eligibility'), Buffer.from([params.segmentIndex])]),
  })
}
