import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'

import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  // The dedicated auth page owns the full viewport — no marketing chrome.
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const bare = pathname.startsWith('/auth')

  if (bare) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
