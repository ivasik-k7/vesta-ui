import { PublicKey } from '@solana/web3.js'

import { env } from '@/env'

export const VESTA_CORE = new PublicKey(env.VITE_VESTA_CORE_PROGRAM_ID)
export const ARGUS = new PublicKey(env.VITE_ARGUS_PROGRAM_ID)
export const AEGIS = new PublicKey(env.VITE_AEGIS_PROGRAM_ID)
export const RPC_URL = env.VITE_RPC_URL

export const TOKEN_2022 = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')
export const ASSOCIATED_TOKEN = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')

export const DECIMALS = 2
/** Default daily gift velocity cap seeded at guard init, raw units (= 500.00 pts). */
export const DEFAULT_DAILY_GIFT_CAP_RAW = 50_000

// Anchor account discriminators — sha256("account:<Name>")[..8].
// Precomputed so the browser bundle needs no hashing at read time.
export const DISCRIMINATOR = {
  Merchant: [71, 235, 30, 40, 231, 21, 32, 64],
  Offer: [215, 88, 60, 71, 170, 162, 73, 229],
  Alliance: [80, 135, 160, 6, 114, 44, 211, 15],
  Campaign: [50, 40, 49, 11, 157, 220, 229, 192],
  Attestation: [152, 125, 183, 86, 36, 146, 121, 73],
  Achievement: [30, 253, 162, 142, 30, 160, 66, 62],
} as const

/** Campaign kinds (`Campaign.kind`). */
export const CAMPAIGN_KIND = { MULTIPLIER: 0, FLAT_BONUS: 1, QUEST: 2 } as const
export const CAMPAIGN_KIND_LABEL = ['Multiplier', 'Flat bonus', 'Quest'] as const

/** argus GuardConfig policy flag bits. */
export const GUARD_FLAG = {
  BLOCK_PROGRAM_OWNED: 1 << 0,
  ALLOWLIST_ONLY: 1 << 1,
  DENYLIST: 1 << 2,
  REQUIRE_ATTESTATION: 1 << 3,
  GIFTING_DISABLED: 1 << 4,
} as const

/** aegis attestation schema ids (advisory). */
export const AEGIS_SCHEMA = { REGION: 1, KYC_TIER: 2, AGE_BAND: 3 } as const

export const MAX_OPERATORS = 4
