import { ArrowUpRight } from 'lucide-react'

import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'

const STACK = ['Token-2022', 'Anchor', 'IDL on-chain', 'Python SDK', 'TypeScript', 'LiteSVM']

// §1.5 — ecosystem reach: a quiet monochrome strip, one outbound link.
export function Ecosystem() {
  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
        <SectionHeader
          kicker="Built to be built on"
          title="Plugs into"
          emphasis="everything"
          sub="Every mechanic is a public instruction. The IDL lives on-chain, the Python SDK speaks to merchant backends, and third-party dApps can gate on badges without asking permission."
        />

        <Reveal delay={0.1} className="mt-12">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            {STACK.map((item) => (
              <span key={item} className="font-mono text-muted-foreground text-sm">
                {item}
              </span>
            ))}
          </div>
          <a
            href="https://github.com/ivasik-k7/vesta-core/blob/main/docs/TECHNICAL_SPEC.md"
            target="_blank"
            rel="noreferrer"
            className="group mt-8 inline-flex items-center gap-1 text-flame text-sm transition-colors hover:text-flame-hover"
          >
            Read the integration contract
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
