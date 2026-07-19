import { ArrowUpRight } from 'lucide-react'

import { Reveal } from '@/components/landing/reveal'
import { Button } from '@/components/ui/button'

const REPOS = [
  { label: 'vesta-core · Rust/Anchor', href: 'https://github.com/ivasik-k7/vesta-core' },
  { label: 'vesta-sdk · Python', href: 'https://github.com/ivasik-k7/vesta-sdk' },
  { label: 'vesta-ui · React', href: 'https://github.com/ivasik-k7/vesta-ui' },
] as const

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-border/40 border-t">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_110%,rgb(153_69_255/0.18),transparent_70%)]"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-28 text-center">
        <Reveal>
          <h2 className="max-w-2xl text-balance font-heading font-semibold text-4xl tracking-tight md:text-5xl">
            Composability is the product
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="max-w-xl text-pretty text-muted-foreground leading-relaxed">
            The IDL lives on-chain, the Python SDK speaks to merchant backends, and every mechanic
            is a public instruction. Build a quest on our streaks — we won't even know.
          </p>
        </Reveal>
        <Reveal delay={0.16} className="flex flex-wrap items-center justify-center gap-3">
          {REPOS.map((repo) => (
            <Button key={repo.href} asChild variant="outline" className="group font-mono text-xs">
              <a href={repo.href} target="_blank" rel="noreferrer">
                {repo.label}
                <ArrowUpRight
                  className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </a>
            </Button>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
