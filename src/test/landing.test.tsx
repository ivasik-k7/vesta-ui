import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { routeTree } from '@/routeTree.gen'

// Wallet-adapter hooks need a provider; stub them so route rendering is
// exercised without a real wallet/RPC in jsdom.
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: null, connecting: false, disconnect: vi.fn() }),
  useConnection: () => ({ connection: {} }),
}))
vi.mock('@solana/wallet-adapter-react-ui', () => ({
  useWalletModal: () => ({ setVisible: vi.fn() }),
}))

function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

test('landing renders the VESTA hero', async () => {
  renderAt('/')
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/loyalty that burns/i)
  expect(screen.getAllByText('vesta_core').length).toBeGreaterThan(0)
})

test('customer app prompts to connect a wallet', async () => {
  renderAt('/app')
  expect(await screen.findByText(/your loyalty/i)).toBeInTheDocument()
  expect(screen.getByText(/connect a phantom/i)).toBeInTheDocument()
})

test('merchant directory renders its live-scan header', async () => {
  renderAt('/merchant')
  expect(await screen.findByText(/every merchant/i)).toBeInTheDocument()
  expect(screen.getByText(/read from the chain/i)).toBeInTheDocument()
})
