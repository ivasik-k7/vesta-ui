import type { PublicKey } from '@solana/web3.js'
import { Flame, Repeat, Trophy } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { DECIMALS } from '@/lib/vesta/constants'
import { useCustomerProfile } from '@/lib/vesta/queries'

const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum']

/** Decode the on-chain CustomerProfile for one merchant into a stat strip. */
export function ProfileStats({ merchant, name }: { merchant: PublicKey; name: string }) {
  const profile = useCustomerProfile(merchant)

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="font-medium text-[13px] text-muted-foreground">Your standing at {name}</p>
      {profile.isLoading ? (
        <Skeleton className="mt-3 h-16" />
      ) : profile.data ? (
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Stat
            icon={Trophy}
            label="Tier"
            value={TIERS[profile.data.tier] ?? `#${profile.data.tier}`}
          />
          <Stat icon={Flame} label="Streak" value={`${profile.data.streakDays}d`} />
          <Stat
            icon={Repeat}
            label="Redeemed"
            value={profile.data.lifetimeRedemptions.toString()}
          />
          <div className="col-span-3 border-border/60 border-t pt-3 font-mono text-muted-foreground text-xs">
            lifetime earned{' '}
            <span className="text-foreground">
              {(Number(profile.data.lifetimeEarned) / 10 ** DECIMALS).toFixed(2)} pts
            </span>{' '}
            (raw-at-issue — decay never demotes)
          </div>
        </div>
      ) : (
        <p className="mt-3 text-muted-foreground text-sm">
          No profile yet — earn at {name} to start a streak.
        </p>
      )}
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-muted-foreground text-xs">
        <Icon className="size-3 text-flame" aria-hidden />
        {label}
      </p>
      <p className="mt-0.5 font-heading font-semibold text-lg">{value}</p>
    </div>
  )
}
