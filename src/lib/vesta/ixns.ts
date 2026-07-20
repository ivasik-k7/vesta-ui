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

import { ARGUS, ASSOCIATED_TOKEN, DECIMALS, TOKEN_2022, VESTA_CORE } from './constants'
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
function i16(n: number): Buffer {
  const b = new Uint8Array(2)
  new DataView(b.buffer).setInt16(0, n, true)
  return Buffer.from(b)
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

/** Burn points for an offer (customer signs). */
export function redeemOfferIx(params: {
  customer: PublicKey
  merchant: PublicKey
  mint: PublicKey
  offerId: bigint
  redemptionIndex: number
  maxRawAmount: bigint
}): TransactionInstruction {
  const offer = pdas.offer(params.merchant, params.offerId)
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.customer, true, true),
      m(params.merchant, false, false),
      m(offer, false, true),
      m(pdas.customerProfile(params.merchant, params.customer), false, true),
      m(pdas.receipt(offer, params.customer, params.redemptionIndex), false, true),
      m(params.mint, false, true),
      m(ata(params.mint, params.customer), false, true),
      m(pdas.config(), false, false),
      m(TOKEN_2022, false, false),
      m(ASSOCIATED_TOKEN, false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([disc('redeem_offer'), u64(params.maxRawAmount)]),
  })
}

/** One-time gift-ledger creation for the sender (customer signs). */
export function openGiftLedgerIx(customer: PublicKey, mint: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    programId: ARGUS,
    keys: [
      m(customer, true, true),
      m(mint, false, false),
      m(pdas.giftLedger(mint, customer), false, true),
      m(SystemProgram.programId, false, false),
    ],
    data: disc('open_gift_ledger'),
  })
}

/** Hooked transfer_checked with the argus extras appended in meta-list order. */
export function giftIxns(params: {
  from: PublicKey
  to: PublicKey
  mint: PublicKey
  merchant: PublicKey
  rawAmount: bigint
  ensureLedger: boolean
  ensureDestAta: boolean
}): TransactionInstruction[] {
  const ixns: TransactionInstruction[] = []
  const fromAta = ata(params.mint, params.from)
  const toAta = ata(params.mint, params.to)
  if (params.ensureLedger) ixns.push(openGiftLedgerIx(params.from, params.mint))
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
  transfer.keys.push(
    m(pdas.giftLedger(params.mint, params.from), false, true),
    m(params.to, false, false),
    m(ata(params.mint, params.merchant), false, false), // treasury owner = merchant authority
    m(ARGUS, false, false),
    m(pdas.extraAccountMetaList(params.mint), false, false),
  )
  ixns.push(transfer)
  return ixns
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
      m(params.alliance, false, false),
      m(pdas.member(params.alliance, params.merchantA), false, false),
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

/** Register the connected wallet as a merchant (creates the Token-2022 mint). */
export function registerMerchantIx(params: {
  authority: PublicKey
  name: string
  symbol: string
  uri: string
  decayRateBps: number
  baseEarnRate: bigint
}): TransactionInstruction {
  const merchant = pdas.merchant(params.authority)
  const mint = pdas.mint(merchant)
  const treasury = ata(mint, params.authority)
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, true),
      m(merchant, false, true),
      m(mint, false, true),
      m(treasury, false, true),
      m(pdas.config(), false, false),
      m(TOKEN_2022, false, false),
      m(ASSOCIATED_TOKEN, false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([
      disc('register_merchant'),
      borshString(params.name),
      borshString(params.symbol),
      borshString(params.uri),
      i16(params.decayRateBps),
      u64(params.baseEarnRate),
      Buffer.from([DECIMALS]),
    ]),
  })
}

/** Create a redemption offer under the connected merchant. */
export function createOfferIx(params: {
  authority: PublicKey
  id: bigint
  pricePoints: bigint
  supply: number
}): TransactionInstruction {
  const merchant = pdas.merchant(params.authority)
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, true),
      m(merchant, false, false),
      m(pdas.offer(merchant, params.id), false, true),
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

function i64(n: bigint): Buffer {
  const b = new Uint8Array(8)
  new DataView(b.buffer).setBigInt64(0, n, true)
  return Buffer.from(b)
}
function u16(n: number): Buffer {
  const b = new Uint8Array(2)
  new DataView(b.buffer).setUint16(0, n, true)
  return Buffer.from(b)
}

/** Close an offer (merchant signs; rent returns to the merchant authority). */
export function closeOfferIx(authority: PublicKey, offerId: bigint): TransactionInstruction {
  const merchant = pdas.merchant(authority)
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

/** Create a time-boxed earn-multiplier campaign (merchant signs). */
export function createCampaignIx(params: {
  authority: PublicKey
  id: bigint
  multiplierBps: number
  startsAt: bigint
  endsAt: bigint
}): TransactionInstruction {
  const merchant = pdas.merchant(params.authority)
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, true),
      m(merchant, false, false),
      m(pdas.campaign(merchant, params.id), false, true),
      m(pdas.config(), false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([
      disc('create_campaign'),
      u64(params.id),
      u16(params.multiplierBps),
      i64(params.startsAt),
      i64(params.endsAt),
    ]),
  })
}

/** Create a koinon alliance (creator signs; becomes alliance authority). */
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

/** Self-join an alliance you created (merchant == alliance authority). */
export function joinOwnAllianceIx(params: {
  authority: PublicKey
  alliance: PublicKey
  rateBps: number
  swapInBudgetRaw: bigint
}): TransactionInstruction {
  const merchant = pdas.merchant(params.authority)
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, true),
      m(params.authority, true, false), // alliance_authority = same signer (self-join)
      m(merchant, false, true),
      m(params.alliance, false, true),
      m(pdas.member(params.alliance, merchant), false, true),
      m(pdas.config(), false, false),
      m(SystemProgram.programId, false, false),
    ],
    data: Buffer.concat([disc('join_alliance'), u32(params.rateBps), u64(params.swapInBudgetRaw)]),
  })
}

/** Admin: pause or unpause the protocol (config admin signs). */
export function setPausedIx(admin: PublicKey, paused: boolean): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [m(admin, true, false), m(pdas.config(), false, true)],
    data: Buffer.concat([disc('set_paused'), Buffer.from([paused ? 1 : 0])]),
  })
}

/** argus: initialize the transfer guard (EAML) for a merchant's mint. */
export function initializeTransferGuardIx(
  authority: PublicKey,
  mint: PublicKey,
): TransactionInstruction {
  const merchant = pdas.merchant(authority)
  return new TransactionInstruction({
    programId: ARGUS,
    keys: [
      m(authority, true, true),
      m(merchant, false, false),
      m(mint, false, false),
      m(pdas.extraAccountMetaList(mint), false, true),
      m(SystemProgram.programId, false, false),
    ],
    data: disc('initialize_transfer_guard'),
  })
}

/** vesta_core: burn the hook authority after the guard is live (merchant signs). */
export function finalizeTransferGuardIx(
  authority: PublicKey,
  mint: PublicKey,
): TransactionInstruction {
  const merchant = pdas.merchant(authority)
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

/** Merchant: update mutable fields (currently base earn rate). */
export function updateMerchantIx(
  authority: PublicKey,
  baseEarnRate: bigint | null,
): TransactionInstruction {
  const merchant = pdas.merchant(authority)
  const option =
    baseEarnRate === null ? Buffer.from([0]) : Buffer.concat([Buffer.from([1]), u64(baseEarnRate)])
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [m(authority, true, false), m(merchant, false, true), m(pdas.config(), false, false)],
    data: Buffer.concat([disc('update_merchant'), option]),
  })
}

/** Define a kleos achievement (merchant signs). */
export function createAchievementIx(params: {
  authority: PublicKey
  id: bigint
  name: string
  uri: string
  thresholdLifetime: bigint
}): TransactionInstruction {
  const merchant = pdas.merchant(params.authority)
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, true),
      m(merchant, false, false),
      m(pdas.achievement(merchant, params.id), false, true),
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

/** Grant a soulbound kleos badge to a qualifying customer (merchant signs). */
export function grantAchievementIx(params: {
  authority: PublicKey
  achievementId: bigint
  customer: PublicKey
}): TransactionInstruction {
  const merchant = pdas.merchant(params.authority)
  const achievement = pdas.achievement(merchant, params.achievementId)
  const badgeMint = pdas.badge(achievement, params.customer)
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, true),
      m(merchant, false, false),
      m(achievement, false, true),
      m(params.customer, false, false),
      m(pdas.customerProfile(merchant, params.customer), false, false),
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

/** Admin: propose a new protocol admin (current admin signs). */
export function setAdminIx(admin: PublicKey, newAdmin: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [m(admin, true, false), m(pdas.config(), false, true)],
    data: Buffer.concat([disc('set_admin'), newAdmin.toBuffer()]),
  })
}

/** Admin: accept a pending admin transfer (pending admin signs). */
export function acceptAdminIx(pendingAdmin: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [m(pendingAdmin, true, false), m(pdas.config(), false, true)],
    data: disc('accept_admin'),
  })
}

/** Merchant: leave an alliance (member closes; rent back to the merchant). */
export function leaveAllianceIx(authority: PublicKey, alliance: PublicKey): TransactionInstruction {
  const merchant = pdas.merchant(authority)
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

/** Set an alliance member's swap rate (member + alliance authority co-sign). */
export function setSwapRateIx(params: {
  authority: PublicKey
  allianceAuthority: PublicKey
  alliance: PublicKey
  newRate: number
}): TransactionInstruction {
  const merchant = pdas.merchant(params.authority)
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, false),
      m(params.allianceAuthority, true, false),
      m(merchant, false, false),
      m(params.alliance, false, false),
      m(pdas.member(params.alliance, merchant), false, true),
    ],
    data: Buffer.concat([disc('set_swap_rate'), u32(params.newRate)]),
  })
}

/** Set an alliance member's daily inbound swap budget (member signs). */
export function setSwapBudgetIx(params: {
  authority: PublicKey
  alliance: PublicKey
  newBudget: bigint
}): TransactionInstruction {
  const merchant = pdas.merchant(params.authority)
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, false),
      m(merchant, false, false),
      m(pdas.member(params.alliance, merchant), false, true),
    ],
    data: Buffer.concat([disc('set_swap_budget'), u64(params.newBudget)]),
  })
}

/** Clawback: hooked transfer_checked from a customer to the merchant treasury. */
export function clawbackIx(params: {
  authority: PublicKey
  mint: PublicKey
  customer: PublicKey
  amountRaw: bigint
  reasonCode: number
}): TransactionInstruction {
  const merchant = pdas.merchant(params.authority)
  const treasury = ata(params.mint, params.authority)
  const customerAta = ata(params.mint, params.customer)
  return new TransactionInstruction({
    programId: VESTA_CORE,
    keys: [
      m(params.authority, true, false),
      m(merchant, false, false),
      m(params.customer, false, false),
      m(customerAta, false, true),
      m(treasury, false, true),
      m(params.mint, false, true),
      m(pdas.extraAccountMetaList(params.mint), false, false),
      m(pdas.giftLedger(params.mint, params.customer), false, true),
      m(params.authority, false, false), // destination_owner = merchant authority (treasury owner)
      m(ARGUS, false, false),
      m(pdas.config(), false, false),
      m(TOKEN_2022, false, false),
    ],
    data: Buffer.concat([disc('clawback'), u64(params.amountRaw), u16(params.reasonCode)]),
  })
}

/** Close a campaign (merchant signs; rent back to the merchant authority). */
export function closeCampaignIx(authority: PublicKey, campaignId: bigint): TransactionInstruction {
  const merchant = pdas.merchant(authority)
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
