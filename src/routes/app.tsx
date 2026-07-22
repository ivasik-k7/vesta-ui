import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { AuthGate } from '@/components/app/auth-gate'
import { AppShell } from '@/components/app/shell'
import { hasValidStoredSession } from '@/lib/auth/session-store'

// Protected route tree: without a valid stored session the app never mounts —
// the router sends visitors to the landing page with the inline AuthFlow modal
// auto-opened (one sign-in surface, no dedicated auth screen).
export const Route = createFileRoute('/app')({
  beforeLoad: () => {
    if (!hasValidStoredSession()) {
      throw redirect({ to: '/', search: { signin: true } })
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
