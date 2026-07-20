import { createFileRoute } from '@tanstack/react-router'

import { AttestationLookup } from '@/components/app/attestation-lookup'
import { PageHeader } from '@/components/app/shell'

export const Route = createFileRoute('/app/verify')({
  component: VerifyPage,
})

function VerifyPage() {
  return (
    <div>
      <PageHeader
        title="Verify"
        sub="aegis attestation lookup — pick an issuer, paste a wallet, and read its on-chain attestation exactly as an argus transfer guard would at settlement."
      />
      <AttestationLookup />
    </div>
  )
}
