import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

// §1.10 — five questions, collapsed by default, honest answers from the spec.
const FAQ = [
  {
    q: 'Why do my points lose value?',
    a: 'Every point mint carries a negative interest rate, enforced by Token-2022 itself — value cools continuously unless you keep visiting. Streak multipliers (up to ×1.6) are designed to out-earn the decay for anyone who shows up. Use it or lose it, transparently.',
  },
  {
    q: 'Can I send points to a friend?',
    a: 'Yes — gifting is a plain token transfer, watched by the argus guard. Each wallet has a daily gift allowance; within it, transfers pass. Dumping into an exchange pool is not a loyalty flow and never clears.',
  },
  {
    q: 'Can a merchant take my points back?',
    a: 'For refunds and fraud handling, yes — issuers hold a permanent delegate over their own mint. Every clawback is a hook-audited, reason-coded, public transaction. We disclose this plainly rather than hiding it in terms of service.',
  },
  {
    q: 'Is this on mainnet?',
    a: 'Not yet — VESTA runs on Solana devnet as a challenge build. Both programs, the IDL, and every transaction linked on this page are publicly verifiable on the devnet explorer.',
  },
  {
    q: 'How do I integrate my dApp or backend?',
    a: 'The IDL is published on-chain, the Python SDK targets merchant backends, and badge-gating needs about twenty lines: derive the kleos receipt address and check it exists. The integration contract in the technical spec covers every flow.',
  },
] as const

export function Faq() {
  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-3xl px-4 py-24 md:py-32">
        <SectionHeader kicker="We've got answers" title="Fair" emphasis="questions" />

        <Reveal delay={0.1} className="mt-10">
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  )
}
