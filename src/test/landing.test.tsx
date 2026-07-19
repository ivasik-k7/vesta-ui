import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { routeTree } from '@/routeTree.gen'

function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  render(<RouterProvider router={router} />)
}

test('landing renders the VESTA hero', async () => {
  renderAt('/')
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/loyalty that burns/i)
  expect(screen.getAllByText('vesta_core').length).toBeGreaterThan(0)
})

test('customer app preview renders wallet and badges', async () => {
  renderAt('/app')
  expect(await screen.findByText(/your loyalty/i)).toBeInTheDocument()
  expect(screen.getByText('Kavarna')).toBeInTheDocument()
  expect(screen.getByText('First Flame')).toBeInTheDocument()
})

test('merchant preview renders onboarding economics', async () => {
  renderAt('/merchant')
  expect(await screen.findByText(/runs itself/i)).toBeInTheDocument()
  expect(screen.getByText(/0.012 SOL/)).toBeInTheDocument()
  expect(screen.getByText(/what you can never do/i)).toBeInTheDocument()
})
