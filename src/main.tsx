import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { Buffer } from 'buffer'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Toaster } from '@/components/app/toaster'
import { SolanaProvider } from '@/components/wallet/provider'
import { VestaAuthProvider } from '@/lib/auth/context'
import '@/lib/i18n'
import { NotifyProvider } from '@/lib/notify/context'
import { SettingsProvider } from '@/lib/settings/context'
import { routeTree } from './routeTree.gen'
import './index.css'

// web3.js and spl-token expect a global Buffer in the browser.
;(globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer ??= Buffer

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Production-grade defaults: retry transient RPC failures with capped
// exponential backoff (429s under load), but never spin on a hard 4xx; don't
// refetch on every window focus (devnet RPC budgets are finite).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        const msg = error instanceof Error ? error.message : String(error)
        if (/\b(400|401|403|404)\b/.test(msg)) return false
        return failureCount < 3
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      refetchOnWindowFocus: false,
    },
  },
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <SettingsProvider>
      <SolanaProvider>
        <VestaAuthProvider>
          <QueryClientProvider client={queryClient}>
            <NotifyProvider>
              <RouterProvider router={router} />
              <Toaster />
            </NotifyProvider>
          </QueryClientProvider>
        </VestaAuthProvider>
      </SolanaProvider>
    </SettingsProvider>
  </StrictMode>,
)
