import { Check, Eye, Lock, Medal, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { Reveal } from '@/components/landing/reveal'
import { cn } from '@/lib/utils'

function GlowCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [spot, setSpot] = useState({ x: -600, y: -600 })

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: decorative mouse-follow glow, not an interactive control
    <div
      ref={ref}
      onMouseMove={(event) => {
        const rect = ref.current?.getBoundingClientRect()
        if (rect) {
          setSpot({ x: event.clientX - rect.left, y: event.clientY - rect.top })
        }
      }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-white/[0.04] to-transparent p-7',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(260px circle at ${String(spot.x)}px ${String(spot.y)}px, rgb(153 69 255 / 0.13), transparent 65%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

function CardKicker({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.22em]">
      {children}
    </p>
  )
}

function DecayCurve() {
  const reduce = useReducedMotion()
  return (
    <svg viewBox="0 0 340 130" className="mt-6 w-full" role="img" aria-label="Decay curve">
      <defs>
        <linearGradient id="curve" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#14f195" />
          <stop offset="1" stopColor="#9945ff" />
        </linearGradient>
      </defs>
      {/* untended points cool down */}
      <motion.path
        d="M8 26 C 60 34, 90 58, 128 76 S 240 108, 332 116"
        fill="none"
        stroke="rgb(148 163 184 / 0.35)"
        strokeWidth="1.5"
        strokeDasharray="5 5"
        initial={reduce ? undefined : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
      />
      {/* tended flame: check-ins kick the value back up */}
      <motion.path
        d="M8 26 C 40 40, 58 62, 84 70 L 92 42 C 118 52, 142 66, 168 74 L 176 38 C 210 48, 244 58, 268 62 L 276 30 C 300 38, 320 42, 332 44"
        fill="none"
        stroke="url(#curve)"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={reduce ? undefined : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 2.2, ease: 'easeOut', delay: 0.2 }}
      />
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
    <div className="relative mt-8 flex h-24 items-center justify-center" aria-hidden>
      <div className="absolute h-px w-4/5 bg-gradient-to-r from-transparent via-border to-transparent" />
      <motion.div
        animate={reduce ? undefined : { x: [-64, 64, -64] }}
        transition={loop}
        className="absolute grid size-12 place-items-center rounded-full border border-solana-green/40 bg-solana-green/10 font-mono text-[10px] text-solana-green"
      >
        CAFE
      </motion.div>
      <motion.div
        animate={reduce ? undefined : { x: [64, -64, 64] }}
        transition={loop}
        className="absolute grid size-12 place-items-center rounded-full border border-solana-purple/40 bg-solana-purple/10 font-mono text-[10px] text-solana-purple"
      >
        BOOK
      </motion.div>
    </div>
  )
}

const ARGUS_LOG = [
  { text: 'transfer → gift(friend, 25)', ok: true, verdict: 'approved · within daily limit' },
  { text: 'transfer → dex_pool(dump_all)', ok: false, verdict: 'rejected · not a loyalty flow' },
] as const

function ArgusFeed() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % ARGUS_LOG.length)
    }, 2600)
    return () => clearInterval(id)
  }, [])

  const entry = ARGUS_LOG[index] ?? ARGUS_LOG[0]

  return (
    <div className="mt-6 rounded-lg border border-border/50 bg-black/30 p-4 font-mono text-xs">
      <AnimatePresence mode="wait">
        <motion.div
          key={entry.text}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="space-y-1.5"
        >
          <p className="text-muted-foreground">
            <span className="text-solana-green">argus</span> ⟶ {entry.text}
          </p>
          <p className={entry.ok ? 'text-solana-green' : 'text-red-400'}>
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

export function Mechanics() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24">
      <Reveal>
        <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.25em]">
          the mechanics
        </p>
        <h2 className="mt-3 max-w-2xl text-balance font-heading font-semibold text-3xl tracking-tight md:text-4xl">
          Four primitives, one economy of devotion
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2" delay={0.05}>
          <GlowCard className="h-full">
            <CardKicker>living points · interest-bearing decay</CardKicker>
            <h3 className="mt-3 font-heading font-semibold text-xl">
              Value cools. Streaks compound.
            </h3>
            <p className="mt-2 max-w-lg text-muted-foreground text-sm leading-relaxed">
              Every point mint carries a negative interest rate — untended balances fade on-chain,
              no cron jobs, no cleanup scripts. Showing up mints multipliers that outrun the burn.
            </p>
            <DecayCurve />
          </GlowCard>
        </Reveal>

        <Reveal delay={0.12}>
          <GlowCard className="h-full">
            <CardKicker>koinon · alliance swaps</CardKicker>
            <h3 className="mt-3 font-heading font-semibold text-xl">Points cross brands</h3>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
              Merchants form on-chain alliances; customers swap one brand's points for another's
              atomically, at rates the alliance governs.
            </p>
            <SwapOrbit />
          </GlowCard>
        </Reveal>

        <Reveal delay={0.05}>
          <GlowCard className="h-full">
            <CardKicker>kleos · soulbound proof</CardKicker>
            <h3 className="mt-3 flex items-center gap-2 font-heading font-semibold text-xl">
              <Medal className="size-5 text-solana-green" aria-hidden />
              Earned, never bought
            </h3>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
              Achievements are non-transferable Token-2022 mints. No secondary market, no shortcuts
              — and any external dApp can token-gate on them without asking us.
            </p>
            <div className="relative mt-6 overflow-hidden rounded-lg border border-border/50 p-4">
              <div
                aria-hidden
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent motion-safe:animate-shine"
              />
              <p className="flex items-center gap-2 font-mono text-muted-foreground text-xs">
                <Lock className="size-3.5" aria-hidden />
                NonTransferable · supply frozen at 1
              </p>
            </div>
          </GlowCard>
        </Reveal>

        <Reveal className="lg:col-span-2" delay={0.12}>
          <GlowCard className="h-full">
            <CardKicker>argus · transfer hook</CardKicker>
            <h3 className="mt-3 flex items-center gap-2 font-heading font-semibold text-xl">
              <Eye className="size-5 text-solana-purple" aria-hidden />
              The rules travel with the token
            </h3>
            <p className="mt-2 max-w-lg text-muted-foreground text-sm leading-relaxed">
              A hundred-eyed guard validates every transfer at the token program level: gifting
              within limits passes, mercenary dumping never clears — wherever the token ends up.
            </p>
            <ArgusFeed />
          </GlowCard>
        </Reveal>
      </div>
    </section>
  )
}
