import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { AuthGate } from '@/components/app/auth-gate'
import { AppShell } from '@/components/app/shell'
import { hasValidStoredSession } from '@/lib/auth/session-store'

// Protected route tree: without a valid stored session the app never mounts —
// the router redirects to the dedicated /auth page before any /app UI loads.
export const Route = createFileRoute('/app')({
  beforeLoad: () => {
    if (!hasValidStoredSession()) {
      throw redirect({ to: '/auth' })
    }
  },
  component: AppLayout,
})

function AppLayout() {
  return (
    <AppShell>
      <AuthGate>
        <Outlet />
      </AuthGate>
    </AppShell>
  )
}
