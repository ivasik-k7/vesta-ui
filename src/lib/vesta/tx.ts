import type { WalletContextState } from '@solana/wallet-adapter-react'
import {
  ComputeBudgetProgram,
  type Connection,
  type TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'

/**
 * Sign and send a v0 transaction through the connected wallet. A generous
 * compute budget covers the swap/redeem UiAmountToAmount float-math CPIs.
 */
export async function sendIxns(
  connection: Connection,
  wallet: WalletContextState,
  ixns: TransactionInstruction[],
  computeUnits = 400_000,
): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected')
  }
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
  const message = new TransactionMessage({
    payerKey: wallet.publicKey,
    recentBlockhash: blockhash,
    instructions: [ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits }), ...ixns],
  }).compileToV0Message()
  const tx = new VersionedTransaction(message)
  const signed = await wallet.signTransaction(tx)
  const signature = await connection.sendTransaction(signed, { skipPreflight: false })
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')
  return signature
}

export const explorerTx = (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`
