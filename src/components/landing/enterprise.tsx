import { BadgeCheck, Coins, FileCheck2, ShieldHalf, UsersRound } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type ReactNode, useState } from 'react'

import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'
import { cn } from '@/lib/utils'

type Control = {
  id: string
  tab: string
  icon: ReactNode
  title: string
  body: string
  points: string[]
}

const CONTROLS: Control[] = [
  {
    id: 'identity',
    tab: 'Accredited identity',
    icon: <BadgeCheck className="size-4" aria-hidden />,
    title: 'Authority to issue is earned, not asserted',
    body: 'A merchant’s right to mint chains to an aegis accreditation root. A permissionless crank re-checks it and, if the accreditation is revoked, freezes issuance automatically — no human key in the loop.',
    points: [
      'On-chain trust anchor with a configurable grace window',
      'Auto-degrade freezes earn, never redemption or clawback',
      'Recovers on its own the moment accreditation is restored',
    ],
  },
  {
    id: 'reserve',
    tab: 'Reserve-backed',
    icon: <Coins className="size-4" aria-hidden />,
    title: 'Liability you can prove is backed',
    body: 'Escrow a stablecoin against outstanding point liability, measured on raw supply. Withdrawals can never drop below required coverage, and anyone can publish a proof-of-reserves snapshot on-chain.',
    points: [
      'Coverage invariant enforced where value leaves',
      'Governance-set unit value — no oracle dependency',
      'Permissionless, examiner-facing reserve attestation',
    ],
  },
  {
    id: 'duties',
    tab: 'Separation of duties',
    icon: <UsersRound className="size-4" aria-hidden />,
    title: 'No single key can drain the program',
    body: 'Replace flat operators with scoped roles — cashier, campaign manager, owner — each gating only its own actions. A daily issuance circuit breaker bounds the blast radius of a compromised hot key.',
    points: [
      'Least-privilege roles, opt-in and additive',
      'Per-merchant daily mint cap, symmetric to clawback',
      'Owner-only, capped, reason-coded clawback',
    ],
  },
  {
    id: 'governed',
    tab: 'Governed & auditable',
    icon: <FileCheck2 className="size-4" aria-hidden />,
    title: 'Answers an examiner’s three questions',
    body: 'Who can change the control, what did it do, and by what authority does this entity run it — each answered on-chain. Policy changes are versioned with maker/checker approval and a timelock; every decision folds into a tamper-evident statement.',
    points: [
      'Propose → approve (≠ author) → timelock → activate → rollback',
      'Content-addressed, immutable policy versions',
      'Provably-complete decision statements (Merkle root + count)',
    ],
  },
  {
    id: 'segments',
    tab: 'Verified segmentation',
    icon: <ShieldHalf className="size-4" aria-hidden />,
    title: 'Target verified attributes, privately',
    body: 'Reward customers for what a credential proves — EU-only, KYC-tier, 18+, accredited — with a boost, a winback, or an exclusive offer. The merchant learns that a predicate holds; the underlying data is never on-chain.',
    points: [
      'Verify-once, read-cheap: no per-transaction identity cost',
      'Sanctions freeze invalidates cached eligibility instantly',
      'GDPR-erasable — commitments on-chain, PII off-chain',
    ],
  },
]

export function Enterprise() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState('identity')
  const control = CONTROLS.find((c) => c.id === active) ?? CONTROLS[0]
  if (!control) return null

  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
        <SectionHeader
          kicker="Built for regulated issuers"
          title="Enterprise controls,"
          emphasis="on-chain by default"
          sub="Loyalty at brand scale is a controls problem before it is a points problem. VESTA answers it with primitives a bank or a regulated issuer would actually accept."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-[16rem_1fr] md:gap-8">
          {/* tabs */}
          <Reveal>
            <div
              role="tablist"
              aria-label="Enterprise controls"
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0"
            >
              {CONTROLS.map((c) => {
                const on = c.id === active
                return (
                  <button
                    key={c.id}
                    role="tab"
                    aria-selected={on}
                    type="button"
                    onClick={() => setActive(c.id)}
                    className={cn(
                      'relative flex shrink-0 items-center gap-2.5 rounded-xl border px-4 py-3 text-left font-medium text-sm transition-colors md:shrink',
                      on
                        ? 'border-flame/40 bg-card text-foreground'
                        : 'border-transparent text-muted-foreground hover:bg-card/60 hover:text-foreground',
                    )}
                  >
                    <span className={on ? 'text-flame' : 'text-muted-foreground'}>{c.icon}</span>
                    <span className="whitespace-nowrap">{c.tab}</span>
                    {on && !reduce ? (
                      <motion.span
                        layoutId="ent-active"
                        className="absolute inset-0 rounded-xl ring-1 ring-flame/40"
                        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                      />
                    ) : null}
                  </button>
                )
              })}
            </div>
          </Reveal>

          {/* panel */}
          <div className="min-h-[16rem] rounded-2xl border border-border bg-card p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={control.id}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.26 }}
              >
                <h3 className="max-w-xl font-heading font-semibold text-2xl tracking-tight">
                  {control.title}
                </h3>
                <p className="mt-3 max-w-xl text-muted-foreground leading-relaxed">
                  {control.body}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {control.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm">
                      <BadgeCheck className="mt-0.5 size-4 shrink-0 text-flame" aria-hidden />
                      <span className="text-foreground/85">{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
