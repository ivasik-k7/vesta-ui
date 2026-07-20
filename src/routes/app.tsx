import { createFileRoute, Outlet } from '@tanstack/react-router'

import { AuthGate } from '@/components/app/auth-gate'
import { AppShell } from '@/components/app/shell'

// Layout route: everything under /app renders inside the sidebar shell and is
// gated behind an authenticated (signed-in) session.
export const Route = createFileRoute('/app')({
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
