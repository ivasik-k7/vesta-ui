import { ArrowUpRight } from 'lucide-react'

import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'

const PROGRAMS = [
  {
    name: 'vesta_core',
    role: 'the living economy',
    body: 'Merchants, decaying points, campaigns, offers, soulbound badges, alliances, clawback — now with accredited identity, reserve-backed solvency, and role-separated operators.',
  },
  {
    name: 'argus',
    role: 'governed transfer policy',
    body: 'A reusable Token-2022 policy engine: every transfer obeys editable, versioned, timelocked rules with a full audit trail — enforced fail-closed in under 3k CU.',
  },
  {
    name: 'aegis',
    role: 'private identity & trust',
    body: 'A privacy-preserving verification layer: commitments not PII, a verdict any program can consume, and an issuer accreditation trust graph that revokes cleanly.',
  },
] as const

const STACK = ['Token-2022', 'Anchor 1.1.2', 'IDL on-chain', 'Python SDK', 'TypeScript', 'LiteSVM']

// §1.5 — the architecture: three programs, strictly one-directional trust.
export function Ecosystem() {
  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
        <SectionHeader
          kicker="Three programs, one protocol"
          title="Built to be"
          emphasis="built on"
          sub="Strictly one-directional trust — the economy configures the guard, the guard consumes identity, and nothing points back up. Every mechanic is a public instruction with the IDL on-chain."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {PROGRAMS.map((program, index) => (
            <Reveal key={program.name} delay={0.06 + index * 0.06}>
              <div className="h-full rounded-2xl border border-border bg-card p-6">
                <p className="font-heading font-semibold text-flame text-lg">{program.name}</p>
                <p className="mt-0.5 text-muted-foreground text-xs uppercase tracking-wide">
                  {program.role}
                </p>
                <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{program.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1} className="mt-12">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            {STACK.map((item) => (
              <span key={item} className="font-mono text-muted-foreground text-sm">
                {item}
              </span>
            ))}
          </div>
          <a
            href="https://github.com/ivasik-k7/vesta-core/tree/main/docs/specs"
            target="_blank"
            rel="noreferrer"
            className="group mt-8 inline-flex items-center gap-1 text-flame text-sm transition-colors hover:text-flame-hover"
          >
            Read the enterprise specs
            <ArrowUpRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
