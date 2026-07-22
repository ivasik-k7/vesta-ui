import { useWallet } from '@solana/wallet-adapter-react'
import { BadgeCheck, CircleAlert, Fingerprint, KeyRound, Lock, ShieldCheck } from 'lucide-react'

import { Section } from '@/components/app/section'
import { Skeleton } from '@/components/ui/skeleton'
import { type HeldCredential, useMyCredentials } from '@/lib/vesta/queries'

const SCHEMA: Record<number, { name: string; unlocks: string }> = {
  1: { name: 'Verified region', unlocks: 'region-gated offers & boosts' },
  2: { name: 'KYC tier', unlocks: 'accredited & compliance-gated rewards' },
  3: { name: 'Age band', unlocks: 'age-restricted offers' },
}

const schema = (id: bigint) =>
  SCHEMA[Number(id)] ?? { name: `Schema ${id}`, unlocks: 'segment-gated offers' }

const short = (k: string) => `${k.slice(0, 6)}…${k.slice(-6)}`
const fmtDate = (secs: bigint) =>
  Number(secs) > 0 ? new Date(Number(secs) * 1000).toLocaleDateString() : 'never'

export function MyCredentials() {
  const { publicKey } = useWallet()
  const credentials = useMyCredentials()

  if (!publicKey) return null

  const held = credentials.data ?? []
  const valid = held.filter((c) => c.valid)

  return (
    <Section
      icon={Fingerprint}
      title="Your credentials"
      desc="Private proofs issued to your wallet by aegis. Only a cryptographic commitment lives on-chain — your data never does. These are what unlock verified boosts and gated offers across the network."
      right={
        valid.length > 0 ? (
          <span className="font-mono text-[11px] text-muted-foreground">{valid.length} live</span>
        ) : undefined
      }
    >
      {credentials.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : held.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {held.map((c) => (
            <CredentialCard key={`${c.issuer.address.toBase58()}-${c.schemaId}`} credential={c} />
          ))}
        </div>
      ) : (
        <EmptyCredentials />
      )}

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border bg-background/40 px-4 py-3">
        <Lock className="mt-0.5 size-3.5 shrink-0 text-flame" aria-hidden />
        <p className="text-muted-foreground text-xs leading-relaxed">
          Zero personal data touches the chain. An issuer signs a sha256{' '}
          <span className="text-foreground">commitment</span> of your claim; a merchant's guard
          checks the commitment holds — never the underlying value.
        </p>
      </div>
    </Section>
  )
}

function CredentialCard({ credential }: { credential: HeldCredential }) {
  const { schemaId, attestation, issuer, valid } = credential
  const s = schema(schemaId)
  const now = Date.now() / 1000
  const expired = Number(attestation.expiresAt) > 0 && Number(attestation.expiresAt) < now
  const state =
    attestation.status !== 0
      ? {
          cls: 'text-red-400',
          icon: CircleAlert,
          label: attestation.status === 2 ? 'erased' : 'revoked',
        }
      : expired
        ? { cls: 'text-amber-400', icon: CircleAlert, label: 'expired' }
        : { cls: 'text-emerald-400', icon: BadgeCheck, label: 'live' }

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-card ${
        valid ? 'border-emerald-500/30' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="flex items-center gap-2.5">
          <span
            className={`grid size-8 place-items-center rounded-lg ${
              valid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'
            }`}
          >
            <KeyRound className="size-4" aria-hidden />
          </span>
          <span>
            <span className="block font-heading font-semibold text-sm leading-none">{s.name}</span>
            <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
              by {issuer.name || short(issuer.address.toBase58())}
            </span>
          </span>
        </span>
        <span className={`flex items-center gap-1.5 font-mono text-[11px] ${state.cls}`}>
          <state.icon className="size-3.5" aria-hidden />
          {state.label}
        </span>
      </div>
      <div className="border-border/50 border-t px-4 py-2.5">
        <p className="text-muted-foreground text-xs">
          Unlocks {s.unlocks}
          {Number(attestation.expiresAt) > 0 ? (
            <span className="text-muted-foreground/70">
              {' '}
              · through {fmtDate(attestation.expiresAt)}
            </span>
          ) : null}
        </p>
      </div>
    </div>
  )
}

function EmptyCredentials() {
  return (
    <div className="rounded-2xl border border-border border-dashed bg-card/50 p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-flame/10">
        <ShieldCheck className="size-6 text-flame" aria-hidden />
      </span>
      <p className="mt-4 font-heading font-semibold text-lg">No credentials yet</p>
      <p className="mx-auto mt-1.5 max-w-md text-muted-foreground text-sm leading-relaxed">
        When an aegis issuer attests a credential to your wallet — a verified region, a KYC tier —
        it appears here, and the verified boosts it unlocks light up across your journey. Nothing
        private is ever stored on-chain.
      </p>
    </div>
  )
}
