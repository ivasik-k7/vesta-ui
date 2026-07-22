import { createFileRoute, redirect } from '@tanstack/react-router'

import { Bento } from '@/components/landing/bento'
import { ChallengeWidget } from '@/components/landing/challenge-widget'
import { Ecosystem } from '@/components/landing/ecosystem'
import { Enterprise } from '@/components/landing/enterprise'
import { Faq } from '@/components/landing/faq'
import { Flow } from '@/components/landing/flow'
import { Follow } from '@/components/landing/follow'
import { Hero } from '@/components/landing/hero'
import { BrandQuote } from '@/components/landing/quote'
import { Stats } from '@/components/landing/stats'
import { Steps } from '@/components/landing/steps'
import { Verification } from '@/components/landing/verification'
import { Why } from '@/components/landing/why'
import { hasValidStoredSession } from '@/lib/auth/session-store'

export const Route = createFileRoute('/')({
  // Returning members skip the marketing page and land in the dashboard.
  beforeLoad: () => {
    if (hasValidStoredSession()) throw redirect({ to: '/app' })
  },
  component: LandingPage,
})

// Section order: promise → proof → reasons → architecture → capability flow →
// numbers → enterprise controls → features → social proof → onboarding →
// objections → capture. A floating Superteam-challenge badge overlays it all.
function LandingPage() {
  return (
    <main>
      <Hero />
      <BrandQuote />
      <Why />
      <Ecosystem />
      <Flow />
      <Stats />
      <Enterprise />
      <Bento />
      <Verification />
      <Steps />
      <Faq />
      <Follow />
      <ChallengeWidget />
    </main>
  )
}
