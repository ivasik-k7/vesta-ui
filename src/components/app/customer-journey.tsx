import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Flame,
  Gift,
  Lock,
  ShieldCheck,
  Sparkles,
  Ticket,
  Zap,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { type ReactNode, useEffect, useState } from 'react'

import { Section } from '@/components/app/section'
import { Skeleton } from '@/components/ui/skeleton'
import { AEGIS_SCHEMA, DECIMALS, TIER_NAMES, TIER_THRESHOLDS } from '@/lib/vesta/constants'
import { liveUiAmount } from '@/lib/vesta/decay'
import type { CustomerProfile } from '@/lib/vesta/decode'
import { refreshCustomerEligibilityIx } from '@/lib/vesta/ixns'
import { type JourneyStop, useJourney } from '@/lib/vesta/queries'
import { sendIxns } from '@/lib/vesta/tx'

const STREAK_CAP = 30
const STREAK_BPS = 200 // +2%/day
const now = () => Date.now() / 1000

// ── the level: XP = lifetime points earned, mapped onto the tier ladder ──────

function tierProgress(profile: CustomerProfile | null) {
  const xp = profile ? profile.lifetimeEarned : 0n
  let tier = 0
  TIER_THRESHOLDS.forEach((threshold, i) => {
    if (xp >= threshold) tier = i
  })
  const floor = TIER_THRESHOLDS[tier] ?? 0n
  const next = TIER_THRESHOLDS[tier + 1] ?? null
  const pct = next ? Number((xp - floor) * 100n) / Number(next - floor) : 100
  return { xp, tier, name: TIER_NAMES[tier] ?? `Tier ${tier}`, next, pct: Math.min(100, pct) }
}

// ── one merchant relationship, gamified ──────────────────────────────────────

function JourneyCard({ stop }: { stop: JourneyStop }) {
  const reduce = useReducedMotion()
  const { connection } = useConnection()
  const wallet = useWallet()
  const qc = useQueryClient()
  const [tick, setTick] = useState(now())
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setTick(now()), 1000)
    return () => clearInterval(id)
  }, [reduce])

  const { merchant, mint, raw, profile, eligibility, segments } = stop
  const ui = liveUiAmount(raw, mint, tick)
  const streak = profile?.streakDays ?? 0
  const streakBoost = Math.min(streak, STREAK_CAP) * STREAK_BPS
  const t = tierProgress(profile)

  // Verified boosts: which segments the customer satisfies + their bps.
  const activeSegs = (segments?.segments ?? []).map((seg, i) => ({
    ...seg,
    index: i,
    satisfied:
      !!eligibility &&
      eligibility.policyEpoch === segments?.policyEpoch &&
      Number(eligibility.expiresAt) > tick &&
      (eligibility.verdicts & (1 << i)) !== 0,
  }))
  const liveSegs = activeSegs.filter((s) => s.active && s.boostBps > 0)
  const verifiedBoost = liveSegs.filter((s) => s.satisfied).reduce((a, s) => a + s.boostBps, 0)
  const claimable = liveSegs.filter((s) => !s.satisfied)
  const totalBoost = Math.min(10_000 + streakBoost + verifiedBoost, 24_000)

  async function activate(seg: (typeof liveSegs)[number]) {
    if (!wallet.publicKey) return
    setBusy(true)
    setErr(null)
    try {
      await sendIxns(connection, wallet, [
        refreshCustomerEligibilityIx({
          payer: wallet.publicKey,
          merchant: merchant.address,
          customer: wallet.publicKey,
          issuer: seg.issuer,
          schemaId: seg.schemaId,
          segmentIndex: seg.index,
        }),
      ])
      await qc.invalidateQueries({ queryKey: ['journey'] })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Refresh failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* header: brand + tier */}
      <div className="flex items-center justify-between gap-3 border-border/60 border-b px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-flame/10 font-heading font-semibold text-flame text-sm">
            {merchant.name.slice(0, 1)}
          </span>
          <div>
            <p className="font-heading font-semibold text-sm leading-none">{merchant.name}</p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {t.name} · tier {t.tier}
            </p>
          </div>
        </div>
        <p className="text-right">
          <span className="font-heading font-semibold text-2xl text-flame tabular-nums">
            {ui.toLocaleString('en-US', { maximumFractionDigits: DECIMALS })}
          </span>
          <span className="ml-1 font-mono text-[11px] text-muted-foreground">pts</span>
        </p>
      </div>

      <div className="space-y-5 p-5">
        {/* tier ladder */}
        <div>
          <div className="flex items-baseline justify-between font-mono text-[11px] text-muted-foreground">
            <span>level · {Number(t.xp).toLocaleString('en-US')} XP</span>
            <span>
              {t.next
                ? `${Number(t.next - t.xp).toLocaleString('en-US')} to ${TIER_NAMES[t.tier + 1]}`
                : 'max tier'}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-flame to-flame-hover"
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${t.pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* multiplier breakdown — the gamified core */}
        <div className="rounded-xl border border-border bg-background/50 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-muted-foreground text-xs">
              <Zap className="size-3.5 text-flame" aria-hidden /> earn multiplier
            </span>
            <span className="font-heading font-semibold text-flame text-lg tabular-nums">
              ×{(totalBoost / 10_000).toFixed(2)}
            </span>
          </div>
          <div className="mt-3 space-y-1.5 font-mono text-[11px]">
            <Meter label="base" bps={10_000} tone="muted" />
            <Meter
              label={`streak · ${streak}d`}
              bps={streakBoost}
              tone="flame"
              icon={<Flame className="size-3" aria-hidden />}
            />
            {verifiedBoost > 0 ? (
              <Meter
                label="verified boost"
                bps={verifiedBoost}
                tone="emerald"
                icon={<BadgeCheck className="size-3" aria-hidden />}
              />
            ) : null}
            {totalBoost >= 24_000 ? (
              <p className="pt-1 text-flame-hover">▲ multiplier cap reached (×2.40)</p>
            ) : null}
          </div>
          <p className="mt-3 border-border/60 border-t pt-2.5 text-[11px] text-muted-foreground/70 leading-relaxed">
            Your streak grows +2%/day automatically each day {merchant.name} issues you points —
            there's nothing to click. Miss a day and it resets.
          </p>
        </div>

        {/* verified boosts to claim (spec 12 self-activation) */}
        {claimable.length > 0 ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4">
            <p className="flex items-center gap-1.5 font-medium text-emerald-400 text-sm">
              <Sparkles className="size-4" aria-hidden /> Unlock a verified boost
            </p>
            <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
              Prove a credential to this merchant — privately, via aegis — and earn more on every
              visit. Your data never touches the chain.
            </p>
            <div className="mt-3 space-y-2">
              {claimable.map((seg) => (
                <button
                  key={seg.index}
                  type="button"
                  disabled={busy}
                  onClick={() => activate(seg)}
                  className="group flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:border-emerald-500/50 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Lock
                      className="size-3.5 text-muted-foreground group-hover:text-emerald-400"
                      aria-hidden
                    />
                    {schemaName(seg.schemaId)}
                    <span className="font-mono text-[11px] text-emerald-400">
                      +{(seg.boostBps / 100).toFixed(0)}%
                    </span>
                  </span>
                  <ArrowRight
                    className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400"
                    aria-hidden
                  />
                </button>
              ))}
            </div>
            {err ? <p className="mt-2 text-red-400/90 text-xs">{err}</p> : null}
          </div>
        ) : liveSegs.length > 0 ? (
          <p className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-2.5 text-emerald-400 text-xs">
            <Check className="size-3.5" aria-hidden /> All verified boosts active — you're maxed
            here.
          </p>
        ) : null}

        {/* actions */}
        <div className="flex flex-wrap gap-2">
          <Link
            to="/app/discover"
            className="inline-flex items-center gap-1.5 rounded-lg bg-flame px-3 py-1.5 font-medium text-primary-foreground text-xs transition-colors hover:bg-flame-hover"
          >
            <Ticket className="size-3.5" aria-hidden /> Redeem
          </Link>
          <Link
            to="/app/wallet"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:text-foreground"
          >
            <Gift className="size-3.5" aria-hidden /> Gift
          </Link>
        </div>
      </div>
    </div>
  )
}

function Meter({
  label,
  bps,
  tone,
  icon,
}: {
  label: string
  bps: number
  tone: 'muted' | 'flame' | 'emerald'
  icon?: ReactNode
}) {
  const toneCls =
    tone === 'flame'
      ? 'text-flame'
      : tone === 'emerald'
        ? 'text-emerald-400'
        : 'text-muted-foreground'
  return (
    <div className="flex items-center justify-between">
      <span className={`flex items-center gap-1.5 ${toneCls}`}>
        {icon}
        {label}
      </span>
      <span className={`tabular-nums ${toneCls}`}>+{(bps / 100).toFixed(0)}%</span>
    </div>
  )
}

function schemaName(schemaId: bigint): string {
  const n = Number(schemaId)
  if (n === AEGIS_SCHEMA.REGION) return 'Verified region'
  if (n === AEGIS_SCHEMA.KYC_TIER) return 'KYC tier'
  if (n === AEGIS_SCHEMA.AGE_BAND) return 'Age band'
  return `Schema ${n}`
}

export function CustomerJourney() {
  const journey = useJourney()

  return (
    <Section
      icon={Flame}
      title="Your flame"
      desc="Every brand you tend, gamified — your tier, your streak multiplier, and the verified boosts you can unlock. Read live from Solana; the values cool by the second."
    >
      {journey.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : journey.data && journey.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {journey.data.map((stop) => (
            <JourneyCard key={stop.merchant.address.toBase58()} stop={stop} />
          ))}
        </div>
      ) : (
        <EmptyJourney />
      )}
    </Section>
  )
}

function EmptyJourney() {
  return (
    <div className="rounded-2xl border border-border border-dashed bg-card/50 p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-flame/10">
        <ShieldCheck className="size-6 text-flame" aria-hidden />
      </span>
      <p className="mt-4 font-heading font-semibold text-lg">Your journey starts cold</p>
      <p className="mx-auto mt-1.5 max-w-sm text-muted-foreground text-sm leading-relaxed">
        You don't hold points with any merchant yet. Discover a brand, earn your first points, and
        watch the flame catch.
      </p>
      <Link
        to="/app/discover"
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-flame px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-flame-hover"
      >
        Discover merchants
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  )
}
