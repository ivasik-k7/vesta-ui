import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { Buffer } from 'buffer'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { SolanaProvider } from '@/components/wallet/provider'
import { VestaAuthProvider } from '@/lib/auth/context'
import '@/lib/i18n'
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

const queryClient = new QueryClient()

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
            <RouterProvider router={router} />
          </QueryClientProvider>
        </VestaAuthProvider>
      </SolanaProvider>
    </SettingsProvider>
  </StrictMode>,
)
