import { ArrowUpRight, Check, Copy, TerminalSquare } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'
import { env } from '@/env'
import { cn } from '@/lib/utils'

type Tone = 'cmd' | 'out' | 'ok'
const TONE: Record<Tone, string> = {
  cmd: 'text-foreground/85',
  out: 'text-muted-foreground',
  ok: 'text-flame-hover',
}

type Program = {
  id: string
  name: string
  role: string
  address: string
  instructions: number
  seeds: string[]
  terminal: { text: string; tone: Tone }[]
}

// Real on-chain surface: addresses from env, seeds verbatim from the programs,
// instruction counts from the deployed source. Nothing invented.
const PROGRAMS: Program[] = [
  {
    id: 'core',
    name: 'vesta_core',
    role: 'roleCore',
    address: env.VITE_VESTA_CORE_PROGRAM_ID,
    instructions: 56,
    seeds: [
      'merchant',
      'mint',
      'customer',
      'offer',
      'campaign',
      'achieve',
      'alliance',
      'mtrust',
      'mreserve',
      'mstmt',
      'segments',
      'celig',
    ],
    terminal: [
      { text: '$ vesta merchant register --decay -20%/yr', tone: 'cmd' },
      { text: '✓ mint + metadata + hook + delegate · one tx', tone: 'ok' },
      { text: '$ vesta earn --customer 7xKp… --base 12.50', tone: 'cmd' },
      { text: '✓ +1,412 pts · streak ×1.14 · segment boost ×1.5', tone: 'ok' },
      { text: '$ vesta reserve attest', tone: 'cmd' },
      { text: '✓ outstanding 41,203 · reserve 45,000 · solvent', tone: 'ok' },
    ],
  },
  {
    id: 'argus',
    name: 'argus',
    role: 'roleArgus',
    address: env.VITE_ARGUS_PROGRAM_ID,
    instructions: 31,
    seeds: [
      'guard',
      'wstate',
      'entry',
      'cap',
      'pver',
      'active',
      'roles',
      'statement',
      'trust',
      'license',
    ],
    terminal: [
      { text: '$ argus policy propose --daily-cap 500', tone: 'cmd' },
      { text: '✓ pver 4f0a… · approver ≠ author · timelock 24h', tone: 'ok' },
      { text: '$ token-2022 transfer 25 → friend', tone: 'cmd' },
      { text: '✓ execute: allow · 2,801 CU · 0 CPI', tone: 'ok' },
      { text: '$ argus bump_screening_epoch', tone: 'cmd' },
      { text: '✓ every cached verdict stale — freeze propagated', tone: 'ok' },
    ],
  },
  {
    id: 'aegis',
    name: 'aegis',
    role: 'roleAegis',
    address: env.VITE_AEGIS_PROGRAM_ID,
    instructions: 21,
    seeds: ['issuer', 'attestation', 'schema', 'policy', 'troot', 'accred'],
    terminal: [
      { text: '$ aegis issue --schema REGION --commitment 0x9f…', tone: 'cmd' },
      { text: '✓ credential live · PII on-chain: none', tone: 'ok' },
      { text: '$ aegis verify --policy eu-kyc2 --subject ETas…', tone: 'cmd' },
      { text: '✓ verdict ok · jurisdiction EU · tier 2', tone: 'ok' },
      { text: '$ aegis accreditation revoke --issuer 7hTB…', tone: 'cmd' },
      { text: '✓ trust edge cut · dependents auto-degrade', tone: 'ok' },
    ],
  },
]

const shorten = (k: string) => `${k.slice(0, 8)}…${k.slice(-8)}`

function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(address).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
      className="group inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-1.5 font-mono text-xs transition-colors hover:border-flame/40"
      aria-label="Copy program address"
    >
      <span className="text-foreground/85">{shorten(address)}</span>
      {copied ? (
        <Check className="size-3.5 text-flame-hover" aria-hidden />
      ) : (
        <Copy className="size-3.5 text-muted-foreground group-hover:text-flame" aria-hidden />
      )}
    </button>
  )
}

// §1.7 — the system, explorable: pick a program, watch it work, inspect its
// real on-chain surface (address, PDA namespace, instruction count).
export function Bento() {
  const reduce = useReducedMotion()
  const { t } = useTranslation()
  const [activeId, setActiveId] = useState('core')
  const program = PROGRAMS.find((p) => p.id === activeId) ?? PROGRAMS[0]
  if (!program) return null

  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24 md:py-32">
        <SectionHeader
          kicker={t('landing.explore.kicker')}
          title={t('landing.explore.title')}
          emphasis={t('landing.explore.emphasis')}
          sub={t('landing.explore.sub')}
        />

        {/* program tabs */}
        <Reveal delay={0.06} className="mt-12">
          <div
            role="tablist"
            aria-label="Programs"
            className="flex gap-6 border-border/60 border-b"
          >
            {PROGRAMS.map((p) => {
              const on = p.id === activeId
              return (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={on}
                  type="button"
                  onClick={() => setActiveId(p.id)}
                  className={cn(
                    'relative pb-3 font-mono text-sm transition-colors',
                    on ? 'text-flame' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {p.name}
                  {on ? (
                    <motion.span
                      layoutId="bento-tab"
                      className="absolute inset-x-0 -bottom-px h-px bg-flame"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  ) : null}
                </button>
              )
            })}
          </div>
        </Reveal>

        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          {/* terminal */}
          <Reveal delay={0.1} className="lg:col-span-3">
            <div className="h-full overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-center gap-2 border-border/60 border-b px-4 py-2.5">
                <TerminalSquare className="size-4 text-flame" aria-hidden />
                <span className="font-mono text-muted-foreground text-xs">
                  {program.name} · devnet
                </span>
                <span className="ml-auto flex gap-1.5" aria-hidden>
                  <span className="size-2 rounded-full bg-border" />
                  <span className="size-2 rounded-full bg-border" />
                  <span className="size-2 rounded-full bg-flame/60" />
                </span>
              </div>
              <div className="min-h-[13rem] space-y-2 p-5 font-mono text-xs leading-relaxed">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={program.id}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-2"
                  >
                    {program.terminal.map((line, index) => (
                      <motion.p
                        key={line.text}
                        initial={reduce ? false : { opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.08 + index * 0.14, duration: 0.22 }}
                        className={TONE[line.tone]}
                      >
                        {line.text}
                      </motion.p>
                    ))}
                    <p aria-hidden className="text-flame">
                      <span className="motion-safe:animate-blink">▍</span>
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </Reveal>

          {/* on-chain surface */}
          <Reveal delay={0.14} className="lg:col-span-2">
            <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                {t(`landing.explore.${program.role}`)}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <CopyAddress address={program.address} />
                <a
                  href={`https://explorer.solana.com/address/${program.address}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-1 text-flame text-xs transition-colors hover:text-flame-hover"
                >
                  {t('landing.explore.explorer')}
                  <ArrowUpRight
                    className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                </a>
              </div>

              <div className="mt-5">
                <p className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]">
                  {t('landing.explore.pda')}
                </p>
                <p className="mt-2 font-mono text-[11px] text-foreground/70 leading-relaxed">
                  {program.seeds.map((seed, index) => (
                    <motion.span
                      key={`${program.id}-${seed}`}
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.05 + index * 0.03, duration: 0.18 }}
                    >
                      "{seed}"
                      {index < program.seeds.length - 1 ? (
                        <span className="text-muted-foreground/50"> · </span>
                      ) : null}
                    </motion.span>
                  ))}
                </p>
              </div>

              <div className="mt-auto flex items-end justify-between pt-5">
                <div>
                  <p className="font-bold font-heading text-4xl text-flame tabular-nums">
                    {program.instructions}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t('landing.explore.instructions')}
                  </p>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {t('landing.explore.idl')}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
