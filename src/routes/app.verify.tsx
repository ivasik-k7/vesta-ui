import { createFileRoute } from '@tanstack/react-router'
import { ShieldQuestion } from 'lucide-react'

import { AttestationLookup } from '@/components/app/attestation-lookup'
import { MyCredentials } from '@/components/app/my-credentials'
import { Section } from '@/components/app/section'
import { PageHeader } from '@/components/app/shell'

export const Route = createFileRoute('/app/verify')({
  component: VerifyPage,
})

function VerifyPage() {
  return (
    <div>
      <PageHeader
        title="Verify"
        sub="Your private credentials and the access they unlock — plus the same public attestation reader an argus transfer guard runs at settlement."
      />
      <div className="space-y-10">
        <MyCredentials />
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
