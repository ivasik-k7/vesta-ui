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
    a: 'Every point mint carries a negative interest rate, enforced by Token-2022 itself — value cools continuously unless you keep visiting. Streak multipliers are designed to out-earn the decay for anyone who shows up, and verified-segment or campaign boosts stack on top (jointly capped). Use it or lose it, transparently.',
  },
  {
    q: 'How can a merchant reward “verified EU” or “18+” without my data?',
    a: 'aegis stores only cryptographic commitments on-chain — never your personal data, which stays with you and is GDPR-erasable. A merchant asks aegis a yes/no question (“does this rule hold?”) and gets back a verdict. They learn that you qualify; they never learn who you are or what your attributes are.',
  },
  {
    q: 'Can I send points to a friend?',
    a: 'Yes — gifting is a plain token transfer, checked by the argus policy engine. Each wallet has a daily allowance and other merchant-set rules; within them, transfers pass. Dumping into an exchange pool is not a loyalty flow and never clears — the guard is fail-closed and runs in under 3k compute units with no extra network calls.',
  },
  {
    q: 'Can a merchant take my points back?',
    a: 'For refunds and fraud handling, yes — issuers hold a permanent delegate over their own mint, and clawback is owner-only, daily-capped, reason-coded, and publicly audited. If the merchant loses its accreditation or is sanctioned, the protocol freezes new issuance while your existing balance stays redeemable — a compliance failure never strands your assets.',
  },
  {
    q: 'What makes it “enterprise-ready” for a real brand?',
    a: 'A merchant is an accredited, solvent, governed issuer: identity chains to an on-chain trust root and auto-degrades if revoked; issued liability can be stablecoin-reserve-backed with public proof-of-reserves; operators are role-separated (cashier ≠ campaign manager ≠ owner) with a daily issuance cap; and every economic decision folds into a tamper-evident, provably-complete statement an examiner can verify.',
  },
  {
    q: 'Is this on mainnet?',
    a: 'Not yet — VESTA runs on Solana devnet. The three programs and their IDLs are publicly verifiable on the devnet explorer, and the full codebase is on GitHub. Mainnet is gated on an independent third-party audit and multisig custody.',
  },
  {
    q: 'How do I integrate my dApp or backend?',
    a: 'Every mechanic is a public instruction with the IDL on-chain. The Python SDK targets merchant backends; the TypeScript client drives the app. Any program can consume an aegis verdict, and badge-gating is a few lines — derive the kleos receipt address and check it exists. The enterprise specs cover every flow.',
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
