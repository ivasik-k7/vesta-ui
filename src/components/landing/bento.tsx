import { ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { SectionHeader } from '@/components/landing/section-header'
import { env } from '@/env'
import { cn } from '@/lib/utils'

const INIT_CONFIG_TX =
  '2AafQDwvTa7UDVMo3DTPFH4f8yqyzevBAZP6wpjLdyttZmugQccoBRxheXsYXjyRxt2AwFUi9cmV8JNKULWoEp61'

const LINES = [
  { text: `$ solana program show ${env.VITE_VESTA_CORE_PROGRAM_ID.slice(0, 20)}…`, tone: 'cmd' },
  { text: 'Status: deployed · IDL published on-chain', tone: 'out' },
  { text: '$ vesta tx init_config', tone: 'cmd' },
  { text: `✓ ${INIT_CONFIG_TX.slice(0, 18)}…${INIT_CONFIG_TX.slice(-6)}`, tone: 'ok' },
  { text: '$ vesta spike token-2022 --extensions all', tone: 'cmd' },
  { text: '✓ metadata + decay + hook + clawback on one mint', tone: 'ok' },
] as const

const TONE = {
  cmd: 'text-foreground/85',
  out: 'text-muted-foreground',
  ok: 'text-flame-hover',
} as const

function Card({
  title,
  body,
  className,
  children,
  link,
}: {
  title: string
  body: string
  className?: string
  children?: ReactNode
  link?: { label: string; href: string }
}) {
  return (
    <div
      className={cn(
        'group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-line-strong',
        className,
      )}
    >
      <h3 className="font-heading font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{body}</p>
      {children}
      {link ? (
        <a
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-flame text-sm transition-colors hover:text-flame-hover"
        >
          {link.label}
          <ArrowUpRight className="size-3.5" aria-hidden />
        </a>
      ) : null}
    </div>
  )
}

// §1.7 — mixed-size bento; ≤1 link per card.
export function Bento() {
  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
        <SectionHeader kicker="Explore the system" title="Everything" emphasis="on-chain" />

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          <Card
            title="Receipts, not slides"
            body="Both programs are deployed and verifiable — the config transaction and the full Token-2022 extension spike are public."
            className="md:col-span-2 md:row-span-2"
            link={{
              label: 'vesta_core on explorer',
              href: `https://explorer.solana.com/address/${env.VITE_VESTA_CORE_PROGRAM_ID}?cluster=devnet`,
            }}
          >
            <div className="mt-5 space-y-2 rounded-xl border border-border bg-background/60 p-5 font-mono text-xs leading-relaxed">
              {LINES.map((line, index) => (
                <motion.p
                  key={line.text}
                  initial={{ opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + index * 0.1, duration: 0.25 }}
                  className={TONE[line.tone]}
                >
                  {line.text}
                </motion.p>
              ))}
              <p aria-hidden className="text-flame">
                <span className="motion-safe:animate-blink">▍</span>
              </p>
            </div>
          </Card>

          <Card
            title="Gasless where it counts"
            body="Earning is customer-gasless by construction — the merchant signs and pays. Scan, sip, done."
          />
          <Card
            title="Streaks up to ×1.6"
            body="Thirty consecutive days of showing up outruns a full year of decay. Devotion pays."
          />
          <Card
            title="Fail-closed guard"
            body="Omit the hook accounts and the transfer aborts. Policy cannot be skipped, only satisfied."
          />
          <Card
            title="Audited clawback"
            body="Issuer refunds are transfers, so the guard sees every one — reason-coded and public."
          />
          <Card
            title="Open IDL + SDKs"
            body="Ghosted by your loyalty vendor? Integrate in an afternoon — Python for backends, TypeScript in the app."
            link={{ label: 'vesta-sdk on GitHub', href: 'https://github.com/ivasik-k7/vesta-sdk' }}
          />
        </div>
      </div>
    </section>
  )
}
