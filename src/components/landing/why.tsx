import { ArrowUpRight, Check, Eye, Lock, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type ReactNode, useEffect, useState } from 'react'

import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'
import { cn } from '@/lib/utils'

function DecayCurve() {
  const reduce = useReducedMotion()
  return (
    <svg viewBox="0 0 340 130" className="w-full" role="img" aria-label="Decay curve">
      <defs>
        <linearGradient id="curve" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f25c1f" />
          <stop offset="1" stopColor="#7a2604" />
        </linearGradient>
      </defs>
      <motion.path
        d="M8 26 C 60 34, 90 58, 128 76 S 240 108, 332 116"
        fill="none"
        stroke="rgb(167 158 150 / 0.35)"
        strokeWidth="1.5"
        strokeDasharray="5 5"
        initial={reduce ? undefined : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      <motion.path
        d="M8 26 C 40 40, 58 62, 84 70 L 92 42 C 118 52, 142 66, 168 74 L 176 38 C 210 48, 244 58, 268 62 L 276 30 C 300 38, 320 42, 332 44"
        fill="none"
        stroke="url(#curve)"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={reduce ? undefined : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: 'easeOut', delay: 0.15 }}
      />
      {/* check-in moments: the spikes where a visit outruns the decay */}
      {[
        { x: 92, y: 42 },
        { x: 176, y: 38 },
        { x: 276, y: 30 },
      ].map((point, index) => (
        <g key={point.x}>
          <motion.circle
            cx={point.x}
            cy={point.y}
            r="3"
            fill="#f25c1f"
            initial={reduce ? undefined : { opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 + index * 0.35, duration: 0.3 }}
          />
          {reduce ? null : (
            <motion.circle
              cx={point.x}
              cy={point.y}
              r="3"
              fill="none"
              stroke="#f25c1f"
              strokeWidth="1"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: [0, 0.7, 0], scale: [1, 2.6, 3.2] }}
              viewport={{ once: false }}
              transition={{
                delay: 1 + index * 0.35,
                duration: 1.8,
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: 1.4,
              }}
            />
          )}
        </g>
      ))}
      <text x="8" y="14" className="fill-muted-foreground font-mono text-[9px]">
        value
      </text>
      <text x="304" y="128" className="fill-muted-foreground font-mono text-[9px]">
        time
      </text>
    </svg>
  )
}

function SwapOrbit() {
  const reduce = useReducedMotion()
  const loop = reduce
    ? undefined
    : { repeat: Number.POSITIVE_INFINITY, duration: 3.2, ease: 'easeInOut' as const }
  return (
    <div className="relative flex h-32 items-center justify-center" aria-hidden>
      <div className="absolute h-px w-4/5 bg-gradient-to-r from-transparent via-border to-transparent" />
      <motion.div
        animate={reduce ? undefined : { x: [-64, 64, -64] }}
        transition={loop}
        className="absolute grid size-14 place-items-center rounded-full border border-flame/40 bg-flame/10 font-mono text-[10px] text-flame"
      >
        CAFE
      </motion.div>
      <motion.div
        animate={reduce ? undefined : { x: [64, -64, 64] }}
        transition={loop}
        className="absolute grid size-14 place-items-center rounded-full border border-line-strong bg-secondary font-mono text-[10px] text-muted-foreground"
      >
        BOOK
      </motion.div>
    </div>
  )
}

const VERIFY_CHECKS = ['region ∈ EU', 'KYC tier ≥ 2', 'age band 18+'] as const

function AegisVerify() {
  const reduce = useReducedMotion()
  // Loop the proof: checks land one by one, the verdict last, then restart.
  const [phase, setPhase] = useState(reduce ? VERIFY_CHECKS.length + 1 : 0)
  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setPhase((p) => (p > VERIFY_CHECKS.length + 2 ? 0 : p + 1)), 900)
    return () => clearInterval(id)
  }, [reduce])

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 font-mono text-xs">
      <div
        aria-hidden
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent motion-safe:animate-shine"
      />
      <p className="flex items-center gap-2 text-muted-foreground">
        <Eye className="size-3.5 text-flame" aria-hidden /> aegis · verify(subject, policy)
      </p>
      <div className="mt-4 space-y-1.5">
        {VERIFY_CHECKS.map((check, index) => {
          const landed = phase > index
          return (
            <motion.p
              key={check}
              animate={{ opacity: landed ? 1 : 0.25 }}
              transition={{ duration: 0.3 }}
              className="text-foreground/80"
            >
              {check}{' '}
              <AnimatePresence>
                {landed ? (
                  <motion.span
                    initial={reduce ? false : { opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="inline-block text-flame-hover"
                  >
                    ✓
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </motion.p>
          )
        })}
      </div>
      <div className="mt-4 border-border/60 border-t pt-3">
        <motion.p
          animate={{ opacity: phase > VERIFY_CHECKS.length ? 1 : 0.25 }}
          transition={{ duration: 0.3 }}
          className="text-flame-hover"
        >
          <Check className="mr-1.5 inline size-3.5" aria-hidden />
          verdict: eligible
        </motion.p>
        <p className="mt-1 flex items-center gap-2 text-muted-foreground">
          <Lock className="size-3.5" aria-hidden /> PII seen on-chain: never
        </p>
      </div>
    </div>
  )
}

const ARGUS_LOG = [
  {
    text: 'transfer → gift(friend, 25)',
    ok: true,
    verdict: 'approved · policy v7 · within limits',
  },
  { text: 'transfer → dex_pool(dump_all)', ok: false, verdict: 'rejected · not a loyalty flow' },
  { text: 'transfer → sanctioned_wallet', ok: false, verdict: 'rejected · screening freeze' },
] as const

function ArgusFeed() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIndex((v) => (v + 1) % ARGUS_LOG.length), 2600)
    return () => clearInterval(id)
  }, [])
  const entry = ARGUS_LOG[index] ?? ARGUS_LOG[0]

  return (
    <div className="rounded-xl border border-border bg-card p-5 font-mono text-xs">
      <p className="mb-3 flex items-center gap-2 text-muted-foreground">
        <Eye className="size-3.5 text-flame" aria-hidden /> argus · every transfer, &lt;3k CU, no
        CPI
      </p>
      <AnimatePresence mode="wait">
        <motion.div
          key={entry.text}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="space-y-1.5"
        >
          <p className="text-foreground/80">{entry.text}</p>
          <p className={entry.ok ? 'text-flame-hover' : 'text-muted-foreground'}>
            {entry.ok ? (
              <Check className="mr-1.5 inline size-3.5" aria-hidden />
            ) : (
              <X className="mr-1.5 inline size-3.5" aria-hidden />
            )}
            {entry.verdict}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

const REASONS: {
  title: string
  body: string
  link?: { label: string; href: string }
  visual: ReactNode
}[] = [
  {
    title: 'Points with a pulse',
    body: 'Every mint carries a negative interest rate — untended balances cool on-chain, no cron jobs. Streaks mint multipliers that outrun the burn.',
    visual: <DecayCurve />,
  },
  {
    title: 'Value that crosses brands',
    body: 'Merchants form alliances; customers swap café points for bookstore points atomically, at alliance-governed rates with self-chosen risk budgets.',
    visual: <SwapOrbit />,
  },
  {
    title: 'Verified, never surveilled',
    body: 'aegis proves the rule that matters — verified region, KYC tier, age band, accredited status — from on-chain commitments alone. Merchants learn that a predicate holds; the customer’s data is never on-chain, and is GDPR-erasable.',
    link: {
      label: 'How aegis verifies privately',
      href: 'https://github.com/ivasik-k7/vesta-core/tree/main/docs/specs',
    },
    visual: <AegisVerify />,
  },
  {
    title: 'Policy that governs itself',
    body: 'argus checks every transfer against an editable, versioned policy — velocity, lists, eligibility, jurisdiction, sanctions — decided off the hot path and cached, so the guard runs in under 3k compute units with no cross-program call. A revoked issuer auto-degrades; a compliance change is data, never a redeploy.',
    link: {
      label: 'How the policy engine works',
      href: 'https://github.com/ivasik-k7/vesta-core/blob/main/docs/specs/09-argus-policy-vm.md',
    },
    visual: <ArgusFeed />,
  },
]

export function Why() {
  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
        <SectionHeader
          kicker="Why VESTA?"
          title="Four reasons loyalty"
          emphasis="finally moves"
          sub="A living economy, a governed transfer layer, and a privacy-preserving identity layer — three programs that make points behave like value people actually keep."
        />

        <div className="mt-16 flex flex-col gap-20 md:gap-24">
          {REASONS.map((reason, index) => (
            <Reveal key={reason.title} delay={0.05}>
              <div
                className={cn(
                  'grid items-center gap-8 md:grid-cols-2 md:gap-16',
                  index % 2 === 1 && 'md:[&>*:first-child]:order-2',
                )}
              >
                <div className="relative">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-10 -left-2 select-none bg-gradient-to-b from-flame/25 to-transparent bg-clip-text font-bold font-heading text-7xl text-transparent md:-top-12 md:text-8xl"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="relative font-heading font-semibold text-2xl tracking-tight">
                    {reason.title}
                  </h3>
                  <p className="relative mt-3 max-w-md text-muted-foreground leading-relaxed">
                    {reason.body}
                  </p>
                  {reason.link ? (
                    <a
                      href={reason.link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative mt-4 inline-flex items-center gap-1 text-flame text-sm transition-colors hover:text-flame-hover"
                    >
                      {reason.link.label}
                      <ArrowUpRight
                        className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden
                      />
                    </a>
                  ) : null}
                </div>
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                  className="rounded-2xl transition-shadow duration-300 hover:shadow-[0_0_48px_-14px_rgb(242_92_31/0.35)]"
                >
                  {reason.visual}
                </motion.div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
