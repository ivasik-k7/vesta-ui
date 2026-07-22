import { createFileRoute, redirect } from '@tanstack/react-router'

import { hasValidStoredSession } from '@/lib/auth/session-store'

// The dedicated auth screen is retired — sign-in is the inline AuthFlow modal
// on the landing page (one flow, everywhere). This route survives only so old
// links keep working: signed-in visitors go to the app, everyone else lands on
// the homepage with the modal auto-opened.
export const Route = createFileRoute('/auth')({
  beforeLoad: () => {
    if (hasValidStoredSession()) throw redirect({ to: '/app' })
    throw redirect({ to: '/', search: { signin: true } })
  },
})
