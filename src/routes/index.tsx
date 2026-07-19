import { createFileRoute } from '@tanstack/react-router'

import { FinalCta } from '@/components/landing/cta'
import { Flow } from '@/components/landing/flow'
import { Hero } from '@/components/landing/hero'
import { Mechanics } from '@/components/landing/mechanics'
import { Proof } from '@/components/landing/proof'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <main>
      <Hero />
      <Mechanics />
      <Flow />
      <Proof />
      <FinalCta />
    </main>
  )
}
