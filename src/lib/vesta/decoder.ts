import { sha256 } from '@noble/hashes/sha2.js'
import type { ParsedInstruction, PartiallyDecodedInstruction } from '@solana/web3.js'

import { AEGIS, ARGUS, VESTA_CORE } from './constants'

// A real on-chain decoder: the Anchor discriminator is sha256("global:<name>")[..8].
// We index every instruction of all three programs by hex so a raw instruction's
// first 8 data bytes resolve to a human label + category — no IDL client needed.

export type Program = 'vesta_core' | 'argus' | 'aegis' | 'other'
export type Category =
  | 'admin'
  | 'merchant'
  | 'points'
  | 'offer'
  | 'campaign'
  | 'achievement'
  | 'alliance'
  | 'guard'
  | 'attestation'
  | 'token'
  | 'clawback'
  | 'transfer'
  | 'system'
  | 'other'

interface IxDef {
  name: string
  program: Program
  label: string
  category: Category
}

const IXNS: IxDef[] = [
  // ── vesta_core: protocol admin ──
  { name: 'init_config', program: 'vesta_core', label: 'Initialize config', category: 'admin' },
  { name: 'migrate_config', program: 'vesta_core', label: 'Migrate config', category: 'admin' },
  { name: 'set_admin', program: 'vesta_core', label: 'Propose admin', category: 'admin' },
  { name: 'accept_admin', program: 'vesta_core', label: 'Accept admin', category: 'admin' },
  { name: 'set_paused', program: 'vesta_core', label: 'Set protocol paused', category: 'admin' },
  // ── vesta_core: merchant lifecycle ──
  {
    name: 'register_merchant',
    program: 'vesta_core',
    label: 'Register merchant',
    category: 'merchant',
  },
  { name: 'close_merchant', program: 'vesta_core', label: 'Close merchant', category: 'merchant' },
  {
    name: 'update_merchant',
    program: 'vesta_core',
    label: 'Update merchant',
    category: 'merchant',
  },
  {
    name: 'update_merchant_profile',
    program: 'vesta_core',
    label: 'Update brand profile',
    category: 'merchant',
  },
  {
    name: 'set_merchant_operator',
    program: 'vesta_core',
    label: 'Set operator',
    category: 'merchant',
  },
  {
    name: 'set_merchant_paused',
    program: 'vesta_core',
    label: 'Pause merchant',
    category: 'merchant',
  },
  {
    name: 'set_clawback_cap',
    program: 'vesta_core',
    label: 'Set clawback cap',
    category: 'merchant',
  },
  {
    name: 'verify_merchant',
    program: 'vesta_core',
    label: 'Verify merchant',
    category: 'merchant',
  },
  {
    name: 'finalize_transfer_guard',
    program: 'vesta_core',
    label: 'Finalize guard',
    category: 'guard',
  },
  // ── vesta_core: token metadata ──
  {
    name: 'set_token_attribute',
    program: 'vesta_core',
    label: 'Set token attribute',
    category: 'token',
  },
  {
    name: 'update_token_metadata',
    program: 'vesta_core',
    label: 'Update token metadata',
    category: 'token',
  },
  {
    name: 'update_decay_rate',
    program: 'vesta_core',
    label: 'Update decay rate',
    category: 'token',
  },
  // ── vesta_core: points ──
  { name: 'earn_points', program: 'vesta_core', label: 'Issue points', category: 'points' },
  {
    name: 'earn_points_campaign',
    program: 'vesta_core',
    label: 'Issue points (campaign)',
    category: 'points',
  },
  // ── vesta_core: offers ──
  { name: 'create_offer', program: 'vesta_core', label: 'Create offer', category: 'offer' },
  { name: 'close_offer', program: 'vesta_core', label: 'Close offer', category: 'offer' },
  { name: 'redeem_offer', program: 'vesta_core', label: 'Redeem offer', category: 'offer' },
  { name: 'close_receipt', program: 'vesta_core', label: 'Close receipt', category: 'offer' },
  // ── vesta_core: campaigns ──
  {
    name: 'create_campaign',
    program: 'vesta_core',
    label: 'Create campaign',
    category: 'campaign',
  },
  {
    name: 'update_campaign',
    program: 'vesta_core',
    label: 'Update campaign',
    category: 'campaign',
  },
  { name: 'close_campaign', program: 'vesta_core', label: 'Close campaign', category: 'campaign' },
  // ── vesta_core: achievements ──
  {
    name: 'create_achievement',
    program: 'vesta_core',
    label: 'Create achievement',
    category: 'achievement',
  },
  {
    name: 'grant_achievement',
    program: 'vesta_core',
    label: 'Grant badge',
    category: 'achievement',
  },
  {
    name: 'close_achievement',
    program: 'vesta_core',
    label: 'Close achievement',
    category: 'achievement',
  },
  // ── vesta_core: alliances ──
  {
    name: 'create_alliance',
    program: 'vesta_core',
    label: 'Create alliance',
    category: 'alliance',
  },
  {
    name: 'transfer_alliance_authority',
    program: 'vesta_core',
    label: 'Propose alliance authority',
    category: 'alliance',
  },
  {
    name: 'accept_alliance_authority',
    program: 'vesta_core',
    label: 'Accept alliance authority',
    category: 'alliance',
  },
  { name: 'join_alliance', program: 'vesta_core', label: 'Join alliance', category: 'alliance' },
  { name: 'leave_alliance', program: 'vesta_core', label: 'Leave alliance', category: 'alliance' },
  { name: 'set_swap_rate', program: 'vesta_core', label: 'Set swap rate', category: 'alliance' },
  {
    name: 'set_swap_budget',
    program: 'vesta_core',
    label: 'Set swap budget',
    category: 'alliance',
  },
  {
    name: 'set_alliance_paused',
    program: 'vesta_core',
    label: 'Pause alliance',
    category: 'alliance',
  },
  {
    name: 'set_alliance_params',
    program: 'vesta_core',
    label: 'Set alliance params',
    category: 'alliance',
  },
  {
    name: 'update_alliance_profile',
    program: 'vesta_core',
    label: 'Update alliance profile',
    category: 'alliance',
  },
  {
    name: 'set_member_active',
    program: 'vesta_core',
    label: 'Set member active',
    category: 'alliance',
  },
  { name: 'swap_points', program: 'vesta_core', label: 'Swap points', category: 'alliance' },
  // ── vesta_core: clawback ──
  { name: 'clawback', program: 'vesta_core', label: 'Clawback', category: 'clawback' },
  // ── argus: transfer-hook policy engine ──
  {
    name: 'initialize_transfer_guard',
    program: 'argus',
    label: 'Initialize transfer guard',
    category: 'guard',
  },
  { name: 'configure_policy', program: 'argus', label: 'Configure policy', category: 'guard' },
  { name: 'set_guard_paused', program: 'argus', label: 'Pause guard', category: 'guard' },
  { name: 'open_wallet_state', program: 'argus', label: 'Open wallet state', category: 'transfer' },
  { name: 'add_list_entry', program: 'argus', label: 'Add list entry', category: 'guard' },
  { name: 'remove_list_entry', program: 'argus', label: 'Remove list entry', category: 'guard' },
  {
    name: 'transfer_guard_authority',
    program: 'argus',
    label: 'Propose guard authority',
    category: 'guard',
  },
  {
    name: 'accept_guard_authority',
    program: 'argus',
    label: 'Accept guard authority',
    category: 'guard',
  },
  { name: 'execute', program: 'argus', label: 'Transfer hook: execute', category: 'transfer' },
  // ── aegis: attestation issuer ──
  { name: 'init_issuer', program: 'aegis', label: 'Register issuer', category: 'attestation' },
  {
    name: 'set_issuer_operator',
    program: 'aegis',
    label: 'Set issuer operator',
    category: 'attestation',
  },
  { name: 'set_issuer_paused', program: 'aegis', label: 'Pause issuer', category: 'attestation' },
  {
    name: 'issue_attestation',
    program: 'aegis',
    label: 'Issue attestation',
    category: 'attestation',
  },
  {
    name: 'revoke_attestation',
    program: 'aegis',
    label: 'Revoke attestation',
    category: 'attestation',
  },
  {
    name: 'transfer_issuer_authority',
    program: 'aegis',
    label: 'Propose issuer authority',
    category: 'attestation',
  },
  {
    name: 'accept_issuer_authority',
    program: 'aegis',
    label: 'Accept issuer authority',
    category: 'attestation',
  },
]

const utf8 = new TextEncoder()

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function discHex(name: string): string {
  return hex(sha256(utf8.encode(`global:${name}`)).subarray(0, 8))
}

const DISC_INDEX: Map<string, IxDef> = (() => {
  const index = new Map<string, IxDef>()
  for (const def of IXNS) index.set(discHex(def.name), def)
  return index
})()

/** Every distinct action label, for building filter option lists. */
export const ALL_ACTIONS = IXNS.map((d) => d.label).sort()

/** Display metadata per category — label + a Tailwind tone (text/bg pair). */
export const CATEGORY_META: Record<Category, { label: string; dot: string; chip: string }> = {
  admin: { label: 'Admin', dot: 'bg-purple-400', chip: 'bg-purple-500/10 text-purple-300' },
  merchant: { label: 'Merchant', dot: 'bg-flame', chip: 'bg-flame/10 text-flame' },
  points: { label: 'Points', dot: 'bg-emerald-400', chip: 'bg-emerald-500/10 text-emerald-300' },
  offer: { label: 'Offers', dot: 'bg-sky-400', chip: 'bg-sky-500/10 text-sky-300' },
  campaign: { label: 'Campaigns', dot: 'bg-amber-400', chip: 'bg-amber-500/10 text-amber-300' },
  achievement: { label: 'Badges', dot: 'bg-yellow-400', chip: 'bg-yellow-500/10 text-yellow-300' },
  alliance: { label: 'Alliance', dot: 'bg-indigo-400', chip: 'bg-indigo-500/10 text-indigo-300' },
  guard: { label: 'Guard', dot: 'bg-rose-400', chip: 'bg-rose-500/10 text-rose-300' },
  attestation: { label: 'Attestation', dot: 'bg-cyan-400', chip: 'bg-cyan-500/10 text-cyan-300' },
  token: { label: 'Token', dot: 'bg-teal-400', chip: 'bg-teal-500/10 text-teal-300' },
  clawback: { label: 'Clawback', dot: 'bg-red-400', chip: 'bg-red-500/10 text-red-300' },
  transfer: { label: 'Transfer', dot: 'bg-orange-400', chip: 'bg-orange-500/10 text-orange-300' },
  system: { label: 'System', dot: 'bg-neutral-400', chip: 'bg-secondary text-muted-foreground' },
  other: { label: 'Other', dot: 'bg-neutral-500', chip: 'bg-secondary text-muted-foreground' },
}

export interface DecodedIx {
  program: Program
  label: string
  category: Category
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

const CORE = VESTA_CORE.toBase58()
const ARGUS_ID = ARGUS.toBase58()
const AEGIS_ID = AEGIS.toBase58()

/** Map a program instruction to its VESTA label + category via discriminator. */
export function decodeInstruction(programId: string, dataBase58: string): DecodedIx {
  const owned: Program | null =
    programId === CORE
      ? 'vesta_core'
      : programId === ARGUS_ID
        ? 'argus'
        : programId === AEGIS_ID
          ? 'aegis'
          : null

  if (!owned) {
    return { program: 'other', label: shortProgram(programId), category: knownCategory(programId) }
  }

  const data = base58ToBytes(dataBase58)
  const disc = hex(data.subarray(0, 8))
  const hit = DISC_INDEX.get(disc)
  if (hit) return { program: hit.program, label: hit.label, category: hit.category }
  return { program: owned, label: 'Unknown instruction', category: 'other' }
}

const SYSTEM_IDS: Record<string, string> = {
  ComputeBudget111111111111111111111111111111: 'Compute budget',
  '11111111111111111111111111111111': 'System program',
  TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb: 'Token-2022',
  ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL: 'Associated token',
  TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: 'SPL Token',
}

function knownCategory(id: string): Category {
  if (id === 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb') return 'transfer'
  if (id === 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL') return 'token'
  return 'system'
}

function shortProgram(id: string): string {
  return SYSTEM_IDS[id] ?? `${id.slice(0, 4)}…${id.slice(-4)}`
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
    return { program: 'other', label: shortProgram(programId), category: knownCategory(programId) }
  })
}

/** The "headline" instruction of a tx — first VESTA-owned ix, else first. */
export function primaryAction(decoded: DecodedIx[]): DecodedIx | null {
  if (decoded.length === 0) return null
  return decoded.find((d) => d.program !== 'other') ?? decoded[0] ?? null
}
