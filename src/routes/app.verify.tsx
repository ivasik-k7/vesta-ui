import { createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight, BadgeCheck, ShieldQuestion } from 'lucide-react'

import { AttestationLookup } from '@/components/app/attestation-lookup'
import { fmtCount } from '@/components/app/metric'
import { MyCredentials } from '@/components/app/my-credentials'
import { EmptySlate, Section, SectionMeta } from '@/components/app/section'
import { PageHeader } from '@/components/app/shell'
import { Skeleton } from '@/components/ui/skeleton'
import { useIssuers } from '@/lib/vesta/queries'

export const Route = createFileRoute('/app/verify')({
  component: VerifyPage,
})

const explorer = (k: string) => `https://explorer.solana.com/address/${k}?cluster=devnet`
const short = (k: string) => `${k.slice(0, 6)}…${k.slice(-6)}`

function VerifyPage() {
  return (
    <div>
      <PageHeader
        title="Verify"
        sub="Your private credentials and the access they unlock, the issuers who can vouch for you, and the same public attestation reader an argus transfer guard runs at settlement."
      />
      <div className="section-scope space-y-10">
        <MyCredentials />
        <IssuerDirectory />
        <Section
          icon={ShieldQuestion}
          title="Attestation reader"
          desc="Pick an issuer, paste any wallet, and read its on-chain attestation exactly as an argus guard would at settlement — commitment only, never the underlying data."
        >
          <AttestationLookup />
        </Section>
      </div>
    </div>
  )
}

/** Who can verify you — the aegis issuers registered on the deployment. A
 *  credential from one of these is what lights up your verified boosts. */
function IssuerDirectory() {
  const issuers = useIssuers()
  const list = issuers.data ?? []

  return (
    <Section
      icon={BadgeCheck}
      title="Trusted issuers"
      desc="aegis issuers on this deployment — a credential from one of them unlocks the verified boosts and gated offers across the network."
      right={list.length > 0 ? <SectionMeta>{list.length}</SectionMeta> : undefined}
    >
      {issuers.isLoading ? (
        <Skeleton className="h-28" />
      ) : list.length === 0 ? (
        <EmptySlate icon={BadgeCheck}>No issuers registered on this deployment yet.</EmptySlate>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((iss) => (
            <a
              key={iss.address.toBase58()}
              href={explorer(iss.address.toBase58())}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card/50 p-4 shadow-panel ring-1 ring-foreground/[0.02] ring-inset transition-colors hover:border-flame/40"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-flame/10 text-flame">
                <BadgeCheck className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-sm">{iss.name || 'Issuer'}</span>
                <span className="block font-mono text-[11px] text-muted-foreground">
                  {short(iss.address.toBase58())} · {fmtCount(iss.issued)} issued
                </span>
              </span>
              <ArrowUpRight
                className="size-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-flame"
                aria-hidden
              />
            </a>
          ))}
        </div>
      )}
    </Section>
  )
}
