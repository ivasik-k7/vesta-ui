import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeftRight, Store, Users } from 'lucide-react'

import { EmptySlate, Section, SectionMeta } from '@/components/app/section'
import { PageHeader } from '@/components/app/shell'
import { Skeleton } from '@/components/ui/skeleton'
import type { Merchant } from '@/lib/vesta/decode'
import { useMerchants } from '@/lib/vesta/queries'

export const Route = createFileRoute('/app/alliances')({
  component: AlliancesPage,
})

function AlliancesPage() {
  const merchants = useMerchants()

  const groups = groupByAlliance(merchants.data ?? [])
  const solo = (merchants.data ?? []).filter((m) => !m.joinedAlliance)

  return (
    <div>
      <PageHeader
        title="Alliances"
        sub="Koinon alliances group merchants so customers can swap points across brands. Built live from on-chain merchant memberships."
      />

      {merchants.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="space-y-10">
          <Section
            icon={Users}
            title="Active alliances"
            desc="Members swap points freely at governed rates — priced in UI value on both legs."
            right={groups.length > 0 ? <SectionMeta>{groups.length}</SectionMeta> : undefined}
          >
            {groups.length > 0 ? (
              <div className="space-y-3">
                {groups.map(([alliance, members]) => (
                  <AllianceCard key={alliance} alliance={alliance} members={members} />
                ))}
              </div>
            ) : (
              <EmptySlate icon={Users}>
                No alliances yet — found one from the merchant console.
              </EmptySlate>
            )}
          </Section>

          {solo.length > 0 ? (
            <Section
              icon={Store}
              title="Independent merchants"
              desc="Not in any alliance — their points can't be swapped cross-brand yet."
              right={<SectionMeta>{solo.length}</SectionMeta>}
            >
              <div className="flex flex-wrap gap-2">
                {solo.map((m) => (
                  <span
                    key={m.address.toBase58()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-muted-foreground text-sm"
                  >
                    <Store className="size-3.5" aria-hidden />
                    {m.name}
                  </span>
                ))}
              </div>
            </Section>
          ) : null}

          {groups.length === 0 && solo.length === 0 ? (
            <EmptySlate icon={Store}>No merchants registered yet.</EmptySlate>
          ) : null}
        </div>
      )}
    </div>
  )
}

/** Standardized alliance card — same anatomy as the rest of the app. */
function AllianceCard({ alliance, members }: { alliance: string; members: Merchant[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/50 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.75)] ring-1 ring-foreground/[0.02] ring-inset backdrop-blur-sm transition-colors duration-300 hover:border-line-strong">
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5">
        <span
          aria-hidden
          className="h-3.5 w-1 shrink-0 rounded-full bg-gradient-to-b from-flame to-flame-deep"
        />
        <p className="min-w-0 truncate font-mono text-sm">
          {alliance.slice(0, 6)}…{alliance.slice(-6)}
        </p>
        <span className="ml-auto flex shrink-0 items-center gap-1 font-mono text-[11px] text-muted-foreground/70">
          <ArrowLeftRight className="size-3" aria-hidden />
          {members.length} merchant{members.length > 1 ? 's' : ''} swap freely
        </span>
      </div>
      <div
        aria-hidden
        className="mx-4 h-px bg-gradient-to-r from-border via-border/50 to-transparent"
      />
      <div className="flex flex-wrap gap-1.5 px-4 py-3">
        {members.map((m) => (
          <span
            key={m.address.toBase58()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/50 px-2.5 py-1 text-xs"
          >
            <Store className="size-3 text-flame" aria-hidden />
            {m.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function groupByAlliance(merchants: Merchant[]): [string, Merchant[]][] {
  const map = new Map<string, Merchant[]>()
  for (const m of merchants) {
    if (!m.joinedAlliance) continue
    const key = m.joinedAlliance.toBase58()
    const list = map.get(key) ?? []
    list.push(m)
    map.set(key, list)
  }
  return [...map.entries()]
}
