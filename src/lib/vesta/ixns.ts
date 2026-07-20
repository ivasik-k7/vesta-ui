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
