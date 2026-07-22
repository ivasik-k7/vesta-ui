import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { createFileRoute } from '@tanstack/react-router'
import { Gauge, ShieldCheck, UserCog } from 'lucide-react'
import { useState } from 'react'

import { ActionPanel, AddressField, isPubkey } from '@/components/app/action-panel'
import { EmptySlate, Section } from '@/components/app/section'
import { DataRow, Group } from '@/components/app/settings-kit'
import { ConnectPrompt, PageHeader } from '@/components/app/shell'
import { Skeleton } from '@/components/ui/skeleton'
import { acceptAdminIx, setAdminIx, setPausedIx, verifyMerchantIx } from '@/lib/vesta/ixns'
import { useConfig } from '@/lib/vesta/queries'

export const Route = createFileRoute('/app/admin')({
  component: AdminPage,
})

function AdminPage() {
  const { publicKey } = useWallet()
  const config = useConfig()

  const address = publicKey?.toBase58() ?? null
  const onChainAdmin = config.data?.admin.toBase58() ?? null
  const pendingAdmin = config.data?.pendingAdmin?.toBase58() ?? null
  const isOnChainAdmin = !!address && address === onChainAdmin
  const isPendingAdmin = !!address && address === pendingAdmin

  return (
    <div>
      <PageHeader
        title="Protocol admin"
        sub="Governance of the vesta-core protocol — the global pause, merchant verification, and the two-step admin handover. These controls touch every merchant on the network."
      />
      {!publicKey ? (
        <ConnectPrompt message="Connect the admin wallet to manage protocol governance." />
      ) : config.isLoading ? (
        <Skeleton className="h-40" />
      ) : isOnChainAdmin ? (
        <AdminControls paused={!!config.data?.paused} pending={config.data?.pendingAdmin ?? null} />
      ) : isPendingAdmin ? (
        <AcceptHandover onChainAdmin={onChainAdmin} />
      ) : (
        <EmptySlate icon={ShieldCheck}>
          This wallet isn't the protocol admin, so the controls are hidden. Admin authority is a
          single on-chain key (currently{' '}
          <span className="font-mono text-foreground">
            {onChainAdmin ? short(onChainAdmin) : '—'}
          </span>
          ), handed over via a two-step transfer.
        </EmptySlate>
      )}
    </div>
  )
}

/** Shown to the pending admin mid-handover — accept to become the on-chain admin. */
function AcceptHandover({ onChainAdmin }: { onChainAdmin: string | null }) {
  return (
    <Section
      icon={UserCog}
      title="Accept admin transfer"
      desc="You've been nominated as the protocol admin. Accept from this wallet to take over — the second step of the safe two-step handover."
    >
      <div className="max-w-xl">
        <ActionPanel
          title="Become the protocol admin"
          description={`The current admin (${onChainAdmin ? short(onChainAdmin) : '—'}) proposed this wallet. Accepting makes you the sole on-chain admin, effective immediately.`}
          cta="Accept admin role"
          run={async ({ wallet, connection, send }) => {
            if (!wallet.publicKey) throw new Error('Connect a wallet')
            return send(connection, wallet, [acceptAdminIx(wallet.publicKey)])
          }}
        />
      </div>
    </Section>
  )
}

function AdminControls({ paused, pending }: { paused: boolean; pending: PublicKey | null }) {
  const [merchant, setMerchant] = useState('')
  const [newAdmin, setNewAdmin] = useState('')

  return (
    <div className="space-y-8">
      <Section icon={Gauge} title="Protocol status" desc="The global circuit breaker.">
        <div className="max-w-xl">
          <ActionPanel
            title={paused ? 'Resume the protocol' : 'Pause the protocol'}
            description={
              paused
                ? 'Lift the global halt — earning, redemption and transfers resume network-wide.'
                : 'Halt state-changing operations across every merchant. Use only for incident response.'
            }
            cta={paused ? 'Resume protocol' : 'Pause protocol'}
            run={async ({ wallet, connection, send }) => {
              if (!wallet.publicKey) throw new Error('Connect a wallet')
              return send(connection, wallet, [setPausedIx(wallet.publicKey, !paused)])
            }}
          >
            <DataRow label="Current state" value={paused ? 'Paused' : 'Active'} mono={false} />
          </ActionPanel>
        </div>
      </Section>

      <Section
        icon={ShieldCheck}
        title="Merchant verification"
        desc="Grant or clear the trusted badge."
      >
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <ActionPanel
            title="Verify a merchant"
            description="Sets the verified trust badge on a merchant — shown across Discover and the public profile."
            cta="Verify merchant"
            disabled={!isPubkey(merchant)}
            run={async ({ wallet, connection, send }) => {
              if (!wallet.publicKey) throw new Error('Connect a wallet')
              return send(connection, wallet, [
                verifyMerchantIx(wallet.publicKey, new PublicKey(merchant), true),
              ])
            }}
          >
            <AddressField label="Merchant account" value={merchant} onChange={setMerchant} />
          </ActionPanel>
          <ActionPanel
            title="Clear verification"
            description="Removes the verified badge from a merchant account."
            cta="Unverify merchant"
            disabled={!isPubkey(merchant)}
            run={async ({ wallet, connection, send }) => {
              if (!wallet.publicKey) throw new Error('Connect a wallet')
              return send(connection, wallet, [
                verifyMerchantIx(wallet.publicKey, new PublicKey(merchant), false),
              ])
            }}
          />
        </div>
      </Section>

      <Section icon={UserCog} title="Admin handover" desc="Two-step transfer of protocol control.">
        <div className="max-w-xl space-y-4">
          {pending ? (
            <Group title="Pending transfer">
              <DataRow label="Awaiting acceptance from" value={short(pending.toBase58())} />
            </Group>
          ) : null}
          <ActionPanel
            title="Propose a new admin"
            description="Nominates a new protocol admin. They must accept from their own wallet before it takes effect — a safe, two-step handover."
            cta="Propose new admin"
            disabled={!isPubkey(newAdmin)}
            run={async ({ wallet, connection, send }) => {
              if (!wallet.publicKey) throw new Error('Connect a wallet')
              return send(connection, wallet, [
                setAdminIx(wallet.publicKey, new PublicKey(newAdmin)),
              ])
            }}
          >
            <AddressField label="New admin wallet" value={newAdmin} onChange={setNewAdmin} />
          </ActionPanel>
        </div>
      </Section>
    </div>
  )
}

const short = (k: string) => `${k.slice(0, 6)}…${k.slice(-6)}`
