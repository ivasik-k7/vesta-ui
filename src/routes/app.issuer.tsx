import { useWallet } from '@solana/wallet-adapter-react'
import { createFileRoute } from '@tanstack/react-router'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { AttestTab } from '@/routes/app.console'

export const Route = createFileRoute('/app/issuer')({
  component: IssuerPage,
})

function IssuerPage() {
  const { publicKey } = useWallet()

  return (
    <div>
      <PageHeader
        title="Issuer"
        sub="Vouch for wallets as an aegis issuer — issue and revoke privacy-preserving attestations. argus transfer guards and merchant segments read your word to gate transfers and unlock verified boosts."
      />
      {!publicKey ? (
        <ConnectPrompt message="Connect a devnet wallet to manage your issuer." />
      ) : (
        <AttestTab authority={publicKey} />
      )}
    </div>
  )
}
