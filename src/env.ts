import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_RPC_URL: z.url().default('https://api.devnet.solana.com'),
    VITE_VESTA_CORE_PROGRAM_ID: z.string().default('gaMq6BpH1aqC8ZCYtAxwZBjTa9AnfdWvYwURG6L4LDz'),
    VITE_ARGUS_PROGRAM_ID: z.string().default('9zJEWrk47z1ACT3ySMwzmUrMsQzFC8afBSFcsCzsz3rx'),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
})
