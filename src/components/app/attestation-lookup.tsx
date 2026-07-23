import { PublicKey } from '@solana/web3.js'
import { BadgeCheck, CircleAlert, CircleCheck, CircleX, ShieldQuestion } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmptySlate } from '@/components/app/section'
import { DataRow, FieldRow, Group, Input } from '@/components/app/settings-kit'
import { Select } from '@/components/ui/select'
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
            <Select
              value={issuerStr}
              onChange={setIssuerStr}
              placeholder="Select an issuer…"
              aria-label="Issuer"
              options={issuers.data.map((iss: Issuer) => ({
                value: iss.address.toBase58(),
                label: iss.name || 'Issuer',
                hint: `${iss.address.toBase58().slice(0, 8)}…`,
              }))}
            />
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

  const status =
    att.status !== 0
      ? { tone: 'bad' as const, icon: CircleX, label: att.status === 2 ? 'Erased' : 'Revoked' }
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
        value={SCHEMA_LABEL[Number(att.schemaId)] ?? `Schema ${att.schemaId}`}
        mono={false}
      />
      <DataRow
        label="Commitment"
        value={`0x${Array.from(att.commitment.slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('')}… (PII off-chain)`}
      />
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
