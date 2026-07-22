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
import { setAdminIx, setPausedIx, verifyMerchantIx } from '@/lib/vesta/ixns'
import { useConfig } from '@/lib/vesta/queries'

export const Route = createFileRoute('/app/admin')({
  component: AdminPage,
})

function AdminPage() {
  const { publicKey } = useWallet()
  const config = useConfig()

  const isAdmin =
    !!publicKey && !!config.data && config.data.admin.toBase58() === publicKey.toBase58()

  return (
    <div>
      <PageHeader
        title="Protocol admin"
        sub="Governance of the vesta-core protocol — the global pause, merchant verification, and the two-step admin handover. These controls touch every merchant on the network."
      />
      {!publicKey ? (
        <ConnectPrompt message="Connect the protocol admin wallet to manage governance." />
      ) : config.isLoading ? (
        <Skeleton className="h-40" />
      ) : !isAdmin ? (
        <EmptySlate icon={ShieldCheck}>
          This wallet isn't the protocol admin, so the controls are hidden. The current admin is{' '}
          <span className="font-mono text-foreground">
            {config.data ? short(config.data.admin.toBase58()) : '—'}
          </span>
          .
        </EmptySlate>
      ) : (
        <AdminControls paused={!!config.data?.paused} pending={config.data?.pendingAdmin ?? null} />
      )}
    </div>
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
