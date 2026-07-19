import { ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'

import { Reveal } from '@/components/landing/reveal'
import { env } from '@/env'

const INIT_CONFIG_TX =
  '2AafQDwvTa7UDVMo3DTPFH4f8yqyzevBAZP6wpjLdyttZmugQccoBRxheXsYXjyRxt2AwFUi9cmV8JNKULWoEp61'

const LINES = [
  { text: `$ solana program show ${env.VITE_VESTA_CORE_PROGRAM_ID}`, tone: 'cmd' },
  { text: `Program Id: ${env.VITE_VESTA_CORE_PROGRAM_ID}`, tone: 'out' },
  { text: 'Status: deployed · IDL published on-chain', tone: 'out' },
  { text: '$ vesta tx init_config', tone: 'cmd' },
  { text: `✓ ${INIT_CONFIG_TX.slice(0, 20)}…${INIT_CONFIG_TX.slice(-6)}`, tone: 'ok' },
  { text: '$ vesta spike token-2022 --extensions all', tone: 'cmd' },
  { text: '✓ mint EsRwnbKn…6uDT2 · metadata + decay + hook + clawback', tone: 'ok' },
  { text: '✓ badge CK56tapA…44t3 · non-transferable, supply frozen', tone: 'ok' },
] as const

const TONE_CLASS = {
  cmd: 'text-foreground',
  out: 'text-muted-foreground',
  ok: 'text-solana-green',
} as const

const EXPLORER = 'https://explorer.solana.com'

const LINKS = [
  {
    label: 'vesta_core',
    href: `${EXPLORER}/address/${env.VITE_VESTA_CORE_PROGRAM_ID}?cluster=devnet`,
  },
  { label: 'argus', href: `${EXPLORER}/address/${env.VITE_ARGUS_PROGRAM_ID}?cluster=devnet` },
  { label: 'init_config tx', href: `${EXPLORER}/tx/${INIT_CONFIG_TX}?cluster=devnet` },
] as const

export function Proof() {
  return (
    <section className="border-border/40 border-t">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-24 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.25em]">
            no slides, receipts
          </p>
          <h2 className="mt-3 text-balance font-heading font-semibold text-3xl tracking-tight md:text-4xl">
            Already live on devnet
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground leading-relaxed">
            Both programs are deployed, the config is initialized, and the full Token-2022 extension
            stack is proven with real transactions. Verify everything yourself.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-1 font-mono text-muted-foreground text-sm underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
              >
                {link.label}
                <ArrowUpRight
                  className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </a>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-black/40 shadow-2xl">
            <div className="flex items-center gap-1.5 border-border/50 border-b px-4 py-3">
              <span className="size-2.5 rounded-full bg-border" aria-hidden />
              <span className="size-2.5 rounded-full bg-border" aria-hidden />
              <span className="size-2.5 rounded-full bg-border" aria-hidden />
              <span className="ml-3 font-mono text-[11px] text-muted-foreground">
                devnet · confirmed
              </span>
            </div>
            <div className="space-y-2 p-5 font-mono text-xs leading-relaxed md:text-[13px]">
              {LINES.map((line, index) => (
                <motion.p
                  key={line.text}
                  initial={{ opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + index * 0.14, duration: 0.3 }}
                  className={TONE_CLASS[line.tone]}
                >
                  {line.text}
                </motion.p>
              ))}
              <p aria-hidden className="text-solana-green">
                <span className="motion-safe:animate-blink">▍</span>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
