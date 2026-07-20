import { PublicKey } from '@solana/web3.js'
import { BadgeCheck, CircleAlert, CircleCheck, CircleX, ShieldQuestion } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import type { Attestation, Issuer } from '@/lib/vesta/decode'
import { useAttestation, useIssuers } from '@/lib/vesta/queries'

const SCHEMA_LABEL: Record<number, string> = { 1: 'Region', 2: 'KYC tier', 3: 'Age band' }
const parsePk = (v: string): PublicKey | null => {
  try {
    return new PublicKey(v.trim())
  } catch {
    return null
  }
}

/** Public attestation reader: pick an issuer, paste a wallet, read its
 *  attestation exactly as an argus transfer guard would at settlement. */
export function AttestationLookup() {
  const issuers = useIssuers()
  const [issuerStr, setIssuerStr] = useState('')
  const [subjectStr, setSubjectStr] = useState('')

  const issuer = useMemo(() => parsePk(issuerStr), [issuerStr])
  const subject = useMemo(() => parsePk(subjectStr), [subjectStr])
  const query = useAttestation(issuer, subject)
  const ready = !!issuer && !!subject

  return (
    <div className="max-w-3xl">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="block">
          <span className="mb-1 block text-muted-foreground text-xs">Issuer</span>
          {issuers.data && issuers.data.length > 0 ? (
            <select
              value={issuerStr}
              onChange={(e) => setIssuerStr(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-flame/60"
            >
              <option value="">Select an issuer…</option>
              {issuers.data.map((iss: Issuer) => (
                <option key={iss.address.toBase58()} value={iss.address.toBase58()}>
                  {iss.name || 'Issuer'} — {iss.address.toBase58().slice(0, 6)}…
                </option>
              ))}
            </select>
          ) : (
            <input
              value={issuerStr}
              onChange={(e) => setIssuerStr(e.target.value)}
              placeholder="Issuer account address"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-flame/60"
            />
          )}
        </div>

        <label className="mt-4 block">
          <span className="text-muted-foreground text-xs">Subject wallet</span>
          <input
            value={subjectStr}
            onChange={(e) => setSubjectStr(e.target.value)}
            placeholder="Wallet address to verify"
            className={`mt-1 w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-flame/60 ${
              subjectStr === '' || subject ? 'border-border' : 'border-red-500/60'
            }`}
          />
        </label>
      </div>

      <div className="mt-6">
        {!ready ? (
          <EmptyState />
        ) : query.isLoading ? (
          <Skeleton className="h-40" />
        ) : query.data ? (
          <Result att={query.data} />
        ) : (
          <NotFound />
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border border-dashed bg-card/40 p-12 text-center">
      <ShieldQuestion className="size-8 text-muted-foreground/50" aria-hidden />
      <p className="max-w-sm text-muted-foreground text-sm">
        Select an issuer and enter a wallet to look up its on-chain attestation.
      </p>
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-6">
      <CircleX className="size-6 shrink-0 text-muted-foreground/60" aria-hidden />
      <div>
        <p className="font-medium">No attestation</p>
        <p className="text-muted-foreground text-sm">
          This issuer has not attested to this wallet. A guard requiring it would fail closed.
        </p>
      </div>
    </div>
  )
}

function Result({ att }: { att: Attestation }) {
  const now = Date.now() / 1000
  const expired = Number(att.expiresAt) > 0 && Number(att.expiresAt) < now
  const notYet = Number(att.validFrom) > now
  const valid = !att.revoked && !expired && !notYet

  const status = att.revoked
    ? { tone: 'bad', icon: CircleX, label: 'Revoked' }
    : expired
      ? { tone: 'warn', icon: CircleAlert, label: 'Expired' }
      : notYet
        ? { tone: 'warn', icon: CircleAlert, label: 'Not yet valid' }
        : { tone: 'good', icon: CircleCheck, label: 'Valid' }

  const toneCls =
    status.tone === 'good'
      ? 'border-emerald-500/40 text-emerald-400'
      : status.tone === 'warn'
        ? 'border-amber-500/40 text-amber-400'
        : 'border-red-500/40 text-red-400'

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <BadgeCheck
          className={valid ? 'size-6 text-flame' : 'size-6 text-muted-foreground/50'}
          aria-hidden
        />
        <div>
          <p className="font-heading font-semibold text-lg">
            {SCHEMA_LABEL[att.schema] ?? `Schema ${att.schema}`}
          </p>
          <p className="text-muted-foreground text-sm">Attested value: {att.value.toString()}</p>
        </div>
        <span
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${toneCls}`}
        >
          <status.icon className="size-3.5" aria-hidden />
          {status.label}
        </span>
      </div>

      <dl className="mt-5 grid gap-4 border-border/60 border-t pt-5 sm:grid-cols-2">
        <Row label="Issued" value={fmtDate(att.issuedAt)} />
        <Row label="Valid from" value={fmtDate(att.validFrom)} />
        <Row label="Expires" value={Number(att.expiresAt) > 0 ? fmtDate(att.expiresAt) : 'Never'} />
        <Row label="Issuer" value={short(att.issuer.toBase58())} mono />
        <Row label="Subject" value={short(att.subject.toBase58())} mono />
        <Row label="Account" value={short(att.address.toBase58())} mono />
      </dl>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className={`mt-0.5 text-sm ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}

const short = (k: string) => `${k.slice(0, 6)}…${k.slice(-6)}`
const fmtDate = (secs: bigint) =>
  Number(secs) > 0 ? new Date(Number(secs) * 1000).toLocaleString() : '—'
