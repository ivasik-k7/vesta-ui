import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'

import { AuthFlowProvider } from '@/components/app/auth-flow'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { NotFound } from '@/components/layout/not-found'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  // The auth page and the app dashboard own the full viewport — no marketing chrome.
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const bare = pathname.startsWith('/auth') || pathname.startsWith('/app')

  if (bare) {
    return (
      <AuthFlowProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Outlet />
        </div>
      </AuthFlowProvider>
    )
  }

  return (
    <AuthFlowProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Header />
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
      </div>
    </AuthFlowProvider>
  )
}
