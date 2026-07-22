import { ArrowUpRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'
import { cn } from '@/lib/utils'

/** Shared terminal-panel chrome — the same visual language as the tx-trace and
 * system explorer, so the four stories read as one product. */
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 border-border/60 border-b px-4 py-2.5 font-mono text-muted-foreground text-xs">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-flame/60" />
        </span>
        <span className="ml-1">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── 01 · a live balance that cools and is rescued by a visit ─────────────────

function PulsePanel() {
  const reduce = useReducedMotion()
  const { t } = useTranslation()
  const [balance, setBalance] = useState(1_284.5)
  const [streak, setStreak] = useState(12)
  const [visited, setVisited] = useState(false)

  useEffect(() => {
    if (reduce) return
    let ticks = 0
    const id = setInterval(() => {
      ticks += 1
      if (ticks % 26 === 0) {
        // a visit lands: streak up, multiplier outruns the burn
        setVisited(true)
        setStreak((s) => (s >= 30 ? 12 : s + 1))
        setBalance((b) => b + 38.2)
        setTimeout(() => setVisited(false), 1600)
      } else {
        setBalance((b) => Math.max(0, b - 0.35))
      }
    }, 180)
    return () => clearInterval(id)
  }, [reduce])

  const multiplier = (1 + Math.min(streak, 30) * 0.02).toFixed(2)

  return (
    <Panel title="balance.watch · decay −20%/yr">
      <div className="flex items-baseline justify-between gap-4">
        <p
          className={cn(
            'font-heading font-semibold text-4xl tabular-nums tracking-tight transition-colors duration-500 md:text-5xl',
            visited ? 'text-flame' : 'text-foreground/90',
          )}
        >
          {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="font-mono text-muted-foreground text-xs">pts</p>
      </div>

      <div className="mt-4 flex items-center justify-between font-mono text-xs">
        <span className="text-muted-foreground">
          {t('landing.why.pulse.streak')}{' '}
          <span className="text-foreground/85 tabular-nums">{streak}d</span> ·{' '}
          {t('landing.why.pulse.multiplier')}{' '}
          <span className="text-flame tabular-nums">×{multiplier}</span>
        </span>
        <AnimatePresence>
          {visited ? (
            <motion.span
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-flame-hover"
            >
              {t('landing.why.pulse.visit')}
            </motion.span>
          ) : (
            <motion.span
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-muted-foreground/60"
            >
              {t('landing.why.pulse.cooling')}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* the sawtooth: decay bled, visits reclaimed */}
      <svg viewBox="0 0 340 56" className="mt-4 w-full" role="img" aria-label="Decay curve">
        <motion.path
          d="M4 14 C 24 22, 40 30, 62 36 L 68 18 C 96 26, 122 34, 148 40 L 154 20 C 184 28, 214 36, 240 40 L 246 22 C 276 28, 310 32, 336 34"
          fill="none"
          stroke="#f25c1f"
          strokeWidth="2"
          strokeLinecap="round"
          initial={reduce ? undefined : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
        />
      </svg>
    </Panel>
  )
}

// ── 02 · an atomic cross-brand swap, both legs settling together ─────────────

function SwapPanel() {
  const reduce = useReducedMotion()
  const { t } = useTranslation()
  const [swapped, setSwapped] = useState(false)

  useEffect(() => {
    if (reduce) {
      setSwapped(true)
      return
    }
    const id = setInterval(() => setSwapped((s) => !s), 2800)
    return () => clearInterval(id)
  }, [reduce])

  const cafe = swapped ? 1_120 : 1_240
  const book = swapped ? 406 : 310

  return (
    <Panel title="koinon.swap · one atomic transaction">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {[
          { name: 'CAFE', value: cafe, delta: '−120' },
          null,
          { name: 'BOOK', value: book, delta: '+96' },
        ].map((side, index) =>
          side ? (
            <div key={side.name} className={index === 2 ? 'text-right' : ''}>
              <p className="font-mono text-muted-foreground text-xs">{side.name}</p>
              <p className="mt-1 font-heading font-semibold text-3xl text-foreground/90 tabular-nums">
                {side.value.toLocaleString('en-US')}
              </p>
              <p
                className={cn(
                  'mt-1 font-mono text-xs tabular-nums transition-opacity duration-500',
                  swapped ? 'opacity-100' : 'opacity-0',
                  side.delta.startsWith('−') ? 'text-muted-foreground' : 'text-flame-hover',
                )}
              >
                {side.delta}
              </p>
            </div>
          ) : (
            <div key="beam" className="relative h-px w-14 bg-border" aria-hidden>
              {reduce ? null : (
                <motion.span
                  className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-flame"
                  animate={{ left: ['0%', '90%'], opacity: [0, 1, 1, 0] }}
                  transition={{
                    duration: 1.1,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 1.7,
                    ease: 'easeInOut',
                  }}
                />
              )}
            </div>
          ),
        )}
      </div>

      <div className="mt-5 border-border/60 border-t pt-3 font-mono text-xs">
        <p
          className={cn(
            'transition-colors duration-500',
            swapped ? 'text-flame-hover' : 'text-muted-foreground/60',
          )}
        >
          {swapped ? t('landing.why.swap.settled') : t('landing.why.swap.settling')}
        </p>
        <p className="mt-1 text-muted-foreground">{t('landing.why.swap.note')}</p>
      </div>
    </Panel>
  )
}

// ── 03 · what the merchant learns vs. what stays sealed ─────────────────────

const VERIFY_CHECKS = ['region ∈ EU', 'KYC tier ≥ 2', 'age band 18+'] as const
const SEALED = [
  ['name', '▮▮▮▮▮▮▮▮'],
  ['birthdate', '▮▮▮▮▮▮'],
  ['address', '▮▮▮▮▮▮▮▮▮▮'],
  ['document', '▮▮▮▮▮▮▮'],
] as const

function VerifyPanel() {
  const reduce = useReducedMotion()
  const { t } = useTranslation()
  const [phase, setPhase] = useState(reduce ? VERIFY_CHECKS.length + 1 : 0)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setPhase((p) => (p > VERIFY_CHECKS.length + 2 ? 0 : p + 1)), 850)
    return () => clearInterval(id)
  }, [reduce])

  return (
    <Panel title="aegis.verify · zero PII on-chain">
      <div className="grid gap-5 font-mono text-xs sm:grid-cols-2">
        <div>
          <p className="text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]">
            {t('landing.why.verify.learns')}
          </p>
          <div className="mt-2.5 space-y-1.5">
            {VERIFY_CHECKS.map((check, index) => {
              const landed = phase > index
              return (
                <motion.p
                  key={check}
                  animate={{ opacity: landed ? 1 : 0.3 }}
                  transition={{ duration: 0.3 }}
                  className="text-foreground/85"
                >
                  {check} {landed ? <span className="text-flame-hover">✓</span> : null}
                </motion.p>
              )
            })}
            <motion.p
              animate={{ opacity: phase > VERIFY_CHECKS.length ? 1 : 0.3 }}
              transition={{ duration: 0.3 }}
              className="pt-1 text-flame-hover"
            >
              {t('landing.why.verify.verdict')}
            </motion.p>
          </div>
        </div>

        <div className="sm:border-border/60 sm:border-l sm:pl-5">
          <p className="text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]">
            {t('landing.why.verify.stores')}
          </p>
          <div className="mt-2.5 space-y-1.5">
            <p className="text-foreground/85">
              commitment <span className="text-muted-foreground">0x9f2e…c41a</span>
            </p>
            {SEALED.map(([field, redacted]) => (
              <p key={field} className="text-muted-foreground/60">
                {t(`landing.why.verify.fields.${field}`)}{' '}
                <span className="select-none text-muted-foreground/30">{redacted}</span>
              </p>
            ))}
            <p className="pt-1 text-muted-foreground">{t('landing.why.verify.erasable')}</p>
          </div>
        </div>
      </div>
    </Panel>
  )
}

// ── 04 · the policy engine deciding, live ────────────────────────────────────

const DECISIONS = [
  { text: 'gift(friend, 25)', ok: true, note: 'within limits' },
  { text: 'dex_pool(dump_all)', ok: false, note: 'not a loyalty flow' },
  { text: 'redeem(offer #4)', ok: true, note: 'segment ✓ eu-verified' },
  { text: 'transfer(sanctioned)', ok: false, note: 'screening freeze' },
  { text: 'gift(family, 50)', ok: true, note: 'cooldown clear' },
] as const

function PolicyPanel() {
  const reduce = useReducedMotion()
  const { t } = useTranslation()
  const [head, setHead] = useState(2)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setHead((h) => h + 1), 2100)
    return () => clearInterval(id)
  }, [reduce])

  // the last three decisions, newest at the bottom
  const rows = [2, 1, 0].flatMap((back) => {
    const index = (((head - back) % DECISIONS.length) + DECISIONS.length) % DECISIONS.length
    const decision = DECISIONS[index]
    return decision ? [{ ...decision, key: head - back }] : []
  })

  return (
    <Panel title="argus.execute · policy v7 · epoch 12">
      <div className="space-y-2 font-mono text-xs">
        <AnimatePresence initial={false} mode="popLayout">
          {rows.map((row) => (
            <motion.div
              key={row.key}
              layout
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-baseline justify-between gap-3"
            >
              <span className="min-w-0 flex-1 truncate text-foreground/80">
                transfer → {row.text}
              </span>
              <span
                className={cn('shrink-0', row.ok ? 'text-flame-hover' : 'text-muted-foreground')}
              >
                {row.ok ? '✓ allow' : '✕ reject'} · {row.note}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-4 border-border/60 border-t pt-3 font-mono text-muted-foreground text-xs">
        <p>{t('landing.why.policy.footer')}</p>
      </div>
    </Panel>
  )
}

// ── the section ──────────────────────────────────────────────────────────────

const REASONS: { key: string; link?: string; visual: ReactNode }[] = [
  { key: 'r1', visual: <PulsePanel /> },
  { key: 'r2', visual: <SwapPanel /> },
  {
    key: 'r3',
    link: 'https://github.com/ivasik-k7/vesta-core/tree/main/docs/specs',
    visual: <VerifyPanel />,
  },
  {
    key: 'r4',
    link: 'https://github.com/ivasik-k7/vesta-core/blob/main/docs/specs/09-argus-policy-vm.md',
    visual: <PolicyPanel />,
  },
]

export function Why() {
  const { t } = useTranslation()
  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24 md:py-32">
        <SectionHeader
          kicker={t('landing.why.kicker')}
          title={t('landing.why.title')}
          emphasis={t('landing.why.emphasis')}
          sub={t('landing.why.sub')}
        />

        <div className="mt-16 flex flex-col gap-20 md:gap-24">
          {REASONS.map((reason, index) => (
            <Reveal key={reason.key} delay={0.05}>
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
                    {t(`landing.why.${reason.key}t`)}
                  </h3>
                  <p className="relative mt-3 max-w-md text-muted-foreground leading-relaxed">
                    {t(`landing.why.${reason.key}b`)}
                  </p>
                  {reason.link ? (
                    <a
                      href={reason.link}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative mt-4 inline-flex items-center gap-1 text-flame text-sm transition-colors hover:text-flame-hover"
                    >
                      {t(`landing.why.${reason.key}l`)}
                      <ArrowUpRight
                        className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden
                      />
                    </a>
                  ) : null}
                </div>
                <div>{reason.visual}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
