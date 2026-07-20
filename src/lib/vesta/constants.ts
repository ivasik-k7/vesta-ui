import { PublicKey } from '@solana/web3.js'

import { env } from '@/env'

export const VESTA_CORE = new PublicKey(env.VITE_VESTA_CORE_PROGRAM_ID)
export const ARGUS = new PublicKey(env.VITE_ARGUS_PROGRAM_ID)
export const RPC_URL = env.VITE_RPC_URL

export const TOKEN_2022 = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')
export const ASSOCIATED_TOKEN = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')

export const DECIMALS = 2
/** Daily gift velocity cap, raw units (= 500.00 pts at issue). */
export const DAILY_GIFT_CAP_RAW = 50_000

// Anchor account discriminators — sha256("account:<Name>")[..8].
// Precomputed so the browser bundle needs no hashing at read time.
export const DISCRIMINATOR = {
  Merchant: [71, 235, 30, 40, 231, 21, 32, 64],
  Offer: [215, 88, 60, 71, 170, 162, 73, 229],
  Alliance: [80, 135, 160, 6, 114, 44, 211, 15],
  Campaign: [50, 40, 49, 11, 157, 220, 229, 192],
} as const
