import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import type { PublicKey } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Award, Flame, Lock, Trophy } from 'lucide-react'
import { useState } from 'react'

import { EmptySlate, Section } from '@/components/app/section'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { Skeleton } from '@/components/ui/skeleton'
import { TIER_NAMES, TIER_THRESHOLDS } from '@/lib/vesta/constants'
import type { CustomerProfile } from '@/lib/vesta/decode'
import { grantAchievementIx } from '@/lib/vesta/ixns'
import { type JourneyStop, useJourney, useMyAchievements } from '@/lib/vesta/queries'
import { sendIxns } from '@/lib/vesta/tx'

export const Route = createFileRoute('/app/achievements')({
  component: AchievementsPage,
})

function tier(profile: CustomerProfile | null) {
  const xp = profile ? profile.lifetimeEarned : 0n
  let t = 0
  TIER_THRESHOLDS.forEach((threshold, i) => {
    if (xp >= threshold) t = i
  })
  const floor = TIER_THRESHOLDS[t] ?? 0n
  const next = TIER_THRESHOLDS[t + 1] ?? null
  const pct = next ? Number((xp - floor) * 100n) / Number(next - floor) : 100
  return { xp, t, name: TIER_NAMES[t] ?? `Tier ${t}`, next, pct: Math.min(100, pct) }
}

function AchievementsPage() {
  const { publicKey } = useWallet()
  const journey = useJourney()

  return (
    <div>
      <PageHeader
        title="Achievements"
        sub="Your standing across every brand you tend — the tier you've climbed, and the soulbound badges you've earned or can still claim. XP is your lifetime points earned."
      />

      {!publicKey ? (
        <ConnectPrompt message="Connect a devnet wallet to see your tiers and badges." />
      ) : journey.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-40" />
        </div>
      ) : journey.data && journey.data.length > 0 ? (
        <div className="section-scope space-y-10">
          <Section
            icon={Trophy}
            title="Your tiers"
            desc="Every brand ranks you Ember → Kindling → Blaze → Inferno by lifetime points earned."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {journey.data.map((stop) => (
                <TierRow key={stop.merchant.address.toBase58()} stop={stop} />
              ))}
            </div>
          </Section>

          {journey.data.map((stop) => (
            <BrandBadges key={stop.merchant.address.toBase58()} stop={stop} />
          ))}
        </div>
      ) : (
        <EmptySlate icon={Trophy}>
          You don't hold points with any brand yet. Start earning from{' '}
          <Link to="/app/discover" className="text-flame hover:text-flame-hover">
            Discover
          </Link>{' '}
          and your first tier will light up here.
        </EmptySlate>
      )}
    </div>
  )
}

function TierRow({ stop }: { stop: JourneyStop }) {
  const t = tier(stop.profile)
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-panel">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-flame/10 font-heading font-semibold text-flame text-sm">
            {stop.merchant.name.slice(0, 1)}
          </span>
          <span>
            <span className="block font-heading font-semibold text-sm leading-none">
              {stop.merchant.name}
            </span>
            <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
              {t.name} · tier {t.t}
            </span>
          </span>
        </span>
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {Number(t.xp).toLocaleString('en-US')} XP
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-gradient-to-r from-flame to-flame-hover"
          style={{ width: `${t.pct}%` }}
        />
      </div>
      <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
        {t.next
          ? `${Number(t.next - t.xp).toLocaleString('en-US')} to ${TIER_NAMES[t.t + 1]}`
          : 'max tier reached'}
      </p>
    </div>
  )
}

function BrandBadges({ stop }: { stop: JourneyStop }) {
  const achievements = useMyAchievements(stop.merchant.address)
  const list = achievements.data ?? []
  if (achievements.isLoading) return <Skeleton className="h-32" />
  if (list.length === 0) return null

  const xp = stop.profile ? stop.profile.lifetimeEarned : 0n

  return (
    <Section
      icon={Award}
      title={`${stop.merchant.name} badges`}
      desc="Soulbound kleos — earned by crossing a lifetime-points threshold."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => (
          <BadgeCard
            key={a.address.toBase58()}
            merchant={stop.merchant.address}
            id={a.id}
            name={a.name}
            threshold={a.thresholdLifetime}
            earned={xp >= a.thresholdLifetime}
          />
        ))}
      </div>
    </Section>
  )
}

function BadgeCard({
  merchant,
  id,
  name,
  threshold,
  earned,
}: {
  merchant: PublicKey
  id: bigint
  name: string
  threshold: bigint
  earned: boolean
}) {
  const { connection } = useConnection()
  const wallet = useWallet()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function claim() {
    if (!wallet.publicKey) return
    setBusy(true)
    setErr(null)
    try {
      await sendIxns(connection, wallet, [
        grantAchievementIx({
          payer: wallet.publicKey,
          merchant,
          achievementId: id,
          customer: wallet.publicKey,
        }),
      ])
      setDone(true)
      await qc.invalidateQueries({ queryKey: ['journey'] })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Claim failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={`rounded-2xl border p-4 ${earned ? 'border-flame/30 bg-flame/[0.04]' : 'border-border bg-card'}`}
    >
      <span
        className={`grid size-9 place-items-center rounded-xl ${earned ? 'bg-flame/15 text-flame' : 'bg-muted text-muted-foreground'}`}
      >
        {earned ? (
          <Award className="size-5" aria-hidden />
        ) : (
          <Lock className="size-4" aria-hidden />
        )}
      </span>
      <p className="mt-3 font-heading font-semibold text-sm">{name}</p>
      <p className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
        <Flame className="size-3 text-flame/70" aria-hidden />
        {Number(threshold).toLocaleString('en-US')} XP
      </p>
      {earned ? (
        done ? (
          <p className="mt-3 text-emerald-400 text-xs">Claimed — check your wallet.</p>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={claim}
            className="mt-3 w-full rounded-lg bg-flame py-1.5 font-medium text-primary-foreground text-xs transition-colors hover:bg-flame-hover disabled:opacity-50"
          >
            {busy ? 'Claiming…' : 'Claim badge'}
          </button>
        )
      ) : (
        <p className="mt-3 text-muted-foreground text-xs">Keep earning to unlock.</p>
      )}
      {err ? <p className="mt-2 text-red-400/90 text-xs">{err}</p> : null}
    </div>
  )
}
