import { sha256 } from '@noble/hashes/sha2.js'
import type { ParsedInstruction, PartiallyDecodedInstruction } from '@solana/web3.js'

import { ARGUS, VESTA_CORE } from './constants'

// Every instruction name in both programs. The Anchor discriminator is
// sha256("global:<name>")[..8]; we index by hex so a raw instruction's first
// 8 data bytes resolve to a human label — a real on-chain decoder, no IDL
// client needed.
const VESTA_CORE_IX = [
  'init_config',
  'migrate_config',
  'set_admin',
  'accept_admin',
  'set_paused',
  'register_merchant',
  'update_merchant',
  'finalize_transfer_guard',
  'earn_points',
  'create_offer',
  'close_offer',
  'redeem_offer',
  'close_receipt',
  'create_campaign',
  'close_campaign',
  'create_achievement',
  'grant_achievement',
  'create_alliance',
  'transfer_alliance_authority',
  'accept_alliance_authority',
  'join_alliance',
  'leave_alliance',
  'set_swap_rate',
  'set_swap_budget',
  'swap_points',
  'clawback',
] as const

const ARGUS_IX = ['initialize_transfer_guard', 'open_gift_ledger', 'execute'] as const

const LABELS: Record<string, string> = {
  init_config: 'Initialize config',
  migrate_config: 'Migrate config',
  set_admin: 'Propose new admin',
  accept_admin: 'Accept admin',
  set_paused: 'Set paused',
  register_merchant: 'Register merchant',
  update_merchant: 'Update merchant',
  finalize_transfer_guard: 'Finalize transfer guard',
  earn_points: 'Earn points',
  create_offer: 'Create offer',
  close_offer: 'Close offer',
  redeem_offer: 'Redeem offer',
  close_receipt: 'Close receipt',
  create_campaign: 'Create campaign',
  close_campaign: 'Close campaign',
  create_achievement: 'Create achievement',
  grant_achievement: 'Grant achievement',
  create_alliance: 'Create alliance',
  transfer_alliance_authority: 'Propose alliance authority',
  accept_alliance_authority: 'Accept alliance authority',
  join_alliance: 'Join alliance',
  leave_alliance: 'Leave alliance',
  set_swap_rate: 'Set swap rate',
  set_swap_budget: 'Set swap budget',
  swap_points: 'Swap points',
  clawback: 'Clawback',
  initialize_transfer_guard: 'Initialize transfer guard',
  open_gift_ledger: 'Open gift ledger',
  execute: 'Transfer hook: execute',
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

const utf8 = new TextEncoder()

function discHex(name: string): string {
  return hex(sha256(utf8.encode(`global:${name}`)).subarray(0, 8))
}

function buildIndex(): Map<string, { name: string; program: 'vesta_core' | 'argus' }> {
  const index = new Map<string, { name: string; program: 'vesta_core' | 'argus' }>()
  for (const name of VESTA_CORE_IX) {
    index.set(discHex(name), { name, program: 'vesta_core' })
  }
  for (const name of ARGUS_IX) {
    index.set(discHex(name), { name, program: 'argus' })
  }
  return index
}

const DISC_INDEX = buildIndex()

export interface DecodedIx {
  program: 'vesta_core' | 'argus' | 'other'
  label: string
}

function base58ToBytes(s: string): Uint8Array {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let num = 0n
  for (const ch of s) {
    const idx = ALPHABET.indexOf(ch)
    if (idx < 0) return new Uint8Array()
    num = num * 58n + BigInt(idx)
  }
  const bytes: number[] = []
  while (num > 0n) {
    bytes.unshift(Number(num % 256n))
    num /= 256n
  }
  for (const ch of s) {
    if (ch === '1') bytes.unshift(0)
    else break
  }
  return Uint8Array.from(bytes)
}

/** Map a program instruction to its VESTA label via the discriminator. */
export function decodeInstruction(programId: string, dataBase58: string): DecodedIx {
  const isCore = programId === VESTA_CORE.toBase58()
  const isArgus = programId === ARGUS.toBase58()
  if (!isCore && !isArgus) return { program: 'other', label: shortProgram(programId) }

  const data = base58ToBytes(dataBase58)
  const disc = hex(data.subarray(0, 8))
  const hit = DISC_INDEX.get(disc)
  if (hit) return { program: hit.program, label: LABELS[hit.name] ?? hit.name }
  return { program: isCore ? 'vesta_core' : 'argus', label: 'Unknown instruction' }
}

function shortProgram(id: string): string {
  const known: Record<string, string> = {
    ComputeBudget111111111111111111111111111111: 'Compute budget',
    '11111111111111111111111111111111': 'System program',
    TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb: 'Token-2022',
    ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL: 'Associated token',
  }
  return known[id] ?? `${id.slice(0, 4)}…${id.slice(-4)}`
}

/** Decode all top-level instructions of a fetched transaction message. */
export function decodeTransactionInstructions(
  instructions: (ParsedInstruction | PartiallyDecodedInstruction)[],
): DecodedIx[] {
  return instructions.map((ix) => {
    const programId = ix.programId.toBase58()
    if ('data' in ix && typeof ix.data === 'string') {
      return decodeInstruction(programId, ix.data)
    }
    return { program: 'other', label: shortProgram(programId) }
  })
}
