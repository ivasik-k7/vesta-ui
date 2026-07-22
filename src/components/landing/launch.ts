import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

import { useAuthFlow } from '@/components/app/auth-flow'
import { hasValidStoredSession } from '@/lib/auth/session-store'

/**
 * The single "Launch app" behavior: a valid session goes straight to the app;
 * otherwise the root AuthFlow modal drives connect → sign-in → /app inline.
 * No separate auth screen — one flow, everywhere.
 */
export function useEnterApp(): () => void {
  const navigate = useNavigate()
  const { login } = useAuthFlow()
  return useCallback(() => {
    if (hasValidStoredSession()) void navigate({ to: '/app' })
    else login()
  }, [navigate, login])
}
