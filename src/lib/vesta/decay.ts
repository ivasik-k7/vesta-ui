import {
  amountToUiAmountForInterestBearingMintWithoutSimulation,
  getInterestBearingMintConfigState,
  unpackMint,
} from '@solana/spl-token'
import type { AccountInfo, PublicKey } from '@solana/web3.js'
import type { Buffer } from 'buffer'

import { DECIMALS, TOKEN_2022 } from './constants'

export interface DecayingMint {
  mint: PublicKey
  decimals: number
  /** InterestBearingConfig rate in basis points (negative = decay). */
  rateBps: number
  initializationTimestamp: number
  lastUpdateTimestamp: number
  preUpdateAverageRate: number
}

/** Parse the InterestBearingConfig extension straight off a mint account. */
export function parseDecayingMint(mint: PublicKey, info: AccountInfo<Buffer>): DecayingMint | null {
  const unpacked = unpackMint(mint, info, TOKEN_2022)
  const config = getInterestBearingMintConfigState(unpacked)
  if (!config) return null
  return {
    mint,
    decimals: unpacked.decimals,
    rateBps: config.currentRate,
    initializationTimestamp: Number(config.initializationTimestamp),
    lastUpdateTimestamp: Number(config.lastUpdateTimestamp),
    preUpdateAverageRate: config.preUpdateAverageRate,
  }
}

/**
 * The live UI value of a raw balance at a given wall-clock time — the same
 * continuously-compounded math wallets apply. Recomputing this every second
 * against `Date.now()` is the real "flame cooling", not a mock.
 */
export function liveUiAmount(raw: bigint, mint: DecayingMint, atUnixSeconds: number): number {
  const ui = amountToUiAmountForInterestBearingMintWithoutSimulation(
    raw,
    mint.decimals,
    Math.floor(atUnixSeconds),
    mint.lastUpdateTimestamp,
    mint.initializationTimestamp,
    mint.preUpdateAverageRate,
    mint.rateBps,
  )
  return Number(ui)
}

/** Fraction of face value remaining (1.0 = fresh), for gauges/animation. */
export function decayHealth(mint: DecayingMint, atUnixSeconds: number): number {
  const faceValue = 10_000n // 100.00 pts reference
  const ui = liveUiAmount(faceValue, mint, atUnixSeconds)
  return Math.min(ui / (Number(faceValue) / 10 ** DECIMALS), 1)
}
