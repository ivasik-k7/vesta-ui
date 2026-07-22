import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { useAuthFlow } from '@/components/app/auth-flow'
import { Bento } from '@/components/landing/bento'
import { ChallengeWidget } from '@/components/landing/challenge-widget'
import { CookieConsent } from '@/components/landing/cookie-consent'
// import { Ecosystem } from '@/components/landing/ecosystem'
// import { Enterprise } from '@/components/landing/enterprise'
import { Faq } from '@/components/landing/faq'
import { Flow } from '@/components/landing/flow'
import { Follow } from '@/components/landing/follow'
import { Hero } from '@/components/landing/hero'
import { BrandQuote } from '@/components/landing/quote'
import { Stats } from '@/components/landing/stats'
import { Steps } from '@/components/landing/steps'
import { Why } from '@/components/landing/why'
import { hasValidStoredSession } from '@/lib/auth/session-store'

export const Route = createFileRoute('/')({
  // `?signin=1` (set by protected-route redirects) auto-opens the AuthFlow modal.
  validateSearch: (search: Record<string, unknown>): { signin?: boolean } =>
    search.signin ? { signin: true } : {},
  // Returning members skip the marketing page and land in the dashboard.
  beforeLoad: () => {
    if (hasValidStoredSession()) throw redirect({ to: '/app' })
  },
  component: LandingPage,
})

// Section order: promise → proof → reasons → architecture → capability flow →
// numbers → enterprise controls → features → onboarding → objections → capture.
// A floating Superteam-challenge badge overlays it all.
function LandingPage() {
  const { signin } = Route.useSearch()
  const { login } = useAuthFlow()
  const opened = useRef(false)

  // A protected route bounced us here — continue straight into the one sign-in
  // flow instead of showing a separate screen.
  useEffect(() => {
    if (signin && !opened.current) {
      opened.current = true
      login()
    }
  }, [signin, login])

  return (
    <main>
      <Hero />
      <BrandQuote />
      <Why />
      {/* <Ecosystem /> */}
      <Flow />
      <Stats />
      {/* <Enterprise /> */}
      <Bento />
      <Steps />
      <Faq />
      <Follow />
      <ChallengeWidget />
      <CookieConsent />
    </main>
  )
}
