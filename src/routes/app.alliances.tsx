import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeftRight, Store, Users } from 'lucide-react'

import { PageHeader } from '@/components/app/shell'
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
        <p className="text-muted-foreground text-sm">Scanning merchants…</p>
      ) : (
        <div className="space-y-6">
          {groups.map(([alliance, members]) => (
            <div key={alliance} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-flame" aria-hidden />
                <p className="font-mono text-sm">
                  {alliance.slice(0, 4)}…{alliance.slice(-4)}
                </p>
                <span className="ml-auto flex items-center gap-1 text-muted-foreground text-xs">
                  <ArrowLeftRight className="size-3.5" />
                  {members.length} merchants swap freely
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {members.map((m) => (
                  <span
                    key={m.address.toBase58()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                  >
                    <Store className="size-3.5 text-flame" aria-hidden />
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {solo.length > 0 ? (
            <div>
              <p className="mb-3 font-medium text-[13px] text-muted-foreground">
                Independent merchants
              </p>
              <div className="flex flex-wrap gap-2">
                {solo.map((m) => (
                  <span
                    key={m.address.toBase58()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground"
                  >
                    <Store className="size-3.5" aria-hidden />
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {groups.length === 0 && solo.length === 0 ? (
            <p className="text-muted-foreground text-sm">No merchants registered yet.</p>
          ) : null}
        </div>
      )}
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
