import { createFileRoute } from '@tanstack/react-router'

import { NetworkExplorer } from '@/components/app/network-explorer'
import { PageHeader } from '@/components/app/shell'

export const Route = createFileRoute('/app/network')({
  component: NetworkPage,
})

function NetworkPage() {
  return (
    <div>
      <PageHeader
        title="Network"
        sub="The whole protocol in real numbers — aggregated live from every Merchant and Alliance PDA on the deployment. No backend, no cache."
      />
      <NetworkExplorer />
    </div>
  )
}
