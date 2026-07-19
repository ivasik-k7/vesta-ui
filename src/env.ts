import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_RPC_URL: z.url().default('https://api.devnet.solana.com'),
    VITE_VESTA_CORE_PROGRAM_ID: z.string().default('Am2X4B1SCnJKXL8Yir2j6yGpHAKrmwcf2E5aKnA9BZV'),
    VITE_ARGUS_PROGRAM_ID: z.string().default('CrzLCMSQ1pWTuLXBomoLn6eAB1c1gLsw5x9sBeuyBNKt'),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
})
