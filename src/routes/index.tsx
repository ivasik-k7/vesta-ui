import { createFileRoute } from '@tanstack/react-router'

import { Bento } from '@/components/landing/bento'
import { Ecosystem } from '@/components/landing/ecosystem'
import { Faq } from '@/components/landing/faq'
import { Follow } from '@/components/landing/follow'
import { Hero } from '@/components/landing/hero'
import { BrandQuote } from '@/components/landing/quote'
import { Stats } from '@/components/landing/stats'
import { Steps } from '@/components/landing/steps'
import { Verification } from '@/components/landing/verification'
import { Why } from '@/components/landing/why'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

// Section order per docs/REFERENCES.md §1: promise → proof → reasons → reach
// → numbers → features → social proof → onboarding → objections → capture.
function LandingPage() {
  return (
    <main>
      <Hero />
      <BrandQuote />
      <Why />
      <Ecosystem />
      <Stats />
      <Bento />
      <Verification />
      <Steps />
      <Faq />
      <Follow />
    </main>
  )
}
