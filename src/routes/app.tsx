import { createFileRoute, Outlet } from '@tanstack/react-router'

import { AppShell } from '@/components/app/shell'

// Layout route: everything under /app renders inside the sidebar shell.
export const Route = createFileRoute('/app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
