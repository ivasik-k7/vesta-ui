import { PublicKey } from '@solana/web3.js'
import { BadgeCheck, CircleAlert, CircleCheck, CircleX, ShieldQuestion } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmptySlate } from '@/components/app/section'
import { DataRow, FieldRow, Group, Input } from '@/components/app/settings-kit'
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
    <div className="max-w-3xl space-y-4">
      <Group
        title="Lookup"
        icon={ShieldQuestion}
        desc="Reads the attestation PDA exactly as an argus guard would at settlement."
      >
        <FieldRow label="Issuer">
          {issuers.data && issuers.data.length > 0 ? (
            <select
              value={issuerStr}
              onChange={(e) => setIssuerStr(e.target.value)}
              className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm shadow-inner outline-none transition-colors focus:border-flame/60"
            >
              <option value="">Select an issuer…</option>
              {issuers.data.map((iss: Issuer) => (
                <option key={iss.address.toBase58()} value={iss.address.toBase58()}>
                  {iss.name || 'Issuer'} — {iss.address.toBase58().slice(0, 6)}…
                </option>
              ))}
            </select>
          ) : (
            <Input
              mono
              value={issuerStr}
              onChange={(e) => setIssuerStr(e.target.value)}
              placeholder="Issuer account address"
            />
          )}
        </FieldRow>
        <FieldRow label="Subject wallet">
          <Input
            mono
            value={subjectStr}
            onChange={(e) => setSubjectStr(e.target.value)}
            placeholder="Wallet address to verify"
            className={subjectStr === '' || subject ? '' : 'border-red-500/60'}
          />
        </FieldRow>
      </Group>

      {!ready ? (
        <EmptySlate icon={ShieldQuestion}>
          Select an issuer and enter a wallet to look up its on-chain attestation.
        </EmptySlate>
      ) : query.isLoading ? (
        <Skeleton className="h-40" />
      ) : query.data ? (
        <Result att={query.data} />
      ) : (
        <EmptySlate icon={CircleX}>
          This issuer has not attested to this wallet. A guard requiring it would fail closed.
        </EmptySlate>
      )}
    </div>
  )
}

function Result({ att }: { att: Attestation }) {
  const now = Date.now() / 1000
  const expired = Number(att.expiresAt) > 0 && Number(att.expiresAt) < now
  const notYet = Number(att.validFrom) > now

  const status = att.revoked
    ? { tone: 'bad' as const, icon: CircleX, label: 'Revoked' }
    : expired
      ? { tone: 'warn' as const, icon: CircleAlert, label: 'Expired' }
      : notYet
        ? { tone: 'warn' as const, icon: CircleAlert, label: 'Not yet valid' }
        : { tone: 'good' as const, icon: CircleCheck, label: 'Valid' }

  const toneCls =
    status.tone === 'good'
      ? 'border-emerald-500/40 text-emerald-400'
      : status.tone === 'warn'
        ? 'border-amber-500/40 text-amber-400'
        : 'border-red-500/40 text-red-400'

  return (
    <Group
      title="Attestation"
      icon={BadgeCheck}
      right={
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${toneCls}`}
        >
          <status.icon className="size-3" aria-hidden />
          {status.label}
        </span>
      }
    >
      <DataRow
        label="Schema"
        value={SCHEMA_LABEL[att.schema] ?? `Schema ${att.schema}`}
        mono={false}
      />
      <DataRow label="Attested value" value={att.value.toString()} />
      <DataRow label="Issued" value={fmtDate(att.issuedAt)} mono={false} />
      <DataRow label="Valid from" value={fmtDate(att.validFrom)} mono={false} />
      <DataRow
        label="Expires"
        value={Number(att.expiresAt) > 0 ? fmtDate(att.expiresAt) : 'Never'}
        mono={false}
      />
      <DataRow label="Issuer" value={short(att.issuer.toBase58())} />
      <DataRow label="Subject" value={short(att.subject.toBase58())} />
      <DataRow label="Account" value={short(att.address.toBase58())} />
    </Group>
  )
}

const short = (k: string) => `${k.slice(0, 6)}…${k.slice(-6)}`
const fmtDate = (secs: bigint) =>
  Number(secs) > 0 ? new Date(Number(secs) * 1000).toLocaleString() : '—'
