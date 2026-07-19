import { ArrowUpRight, Flame } from 'lucide-react'

import { Reveal } from '@/components/landing/reveal'
import { Button } from '@/components/ui/button'

// §1.12 adapted: no mailing list — the build is public. Playful microcopy
// belongs only here (§2.5), never in the hero or security copy.
export function Follow() {
  return (
    <section className="relative overflow-hidden border-border/60 border-t">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_50%_115%,rgb(122_38_4/0.4),transparent_70%)]"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-4 py-24 text-center md:py-32">
        <Reveal>
          <h2 className="text-balance font-heading text-4xl tracking-tight md:text-5xl">
            Don't let it <span className="font-bold text-flame">go out</span>
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="max-w-md text-muted-foreground leading-relaxed">
            The protocol is built in public — releases, specs, and every audit round land on GitHub
            first.
          </p>
        </Reveal>
        <Reveal delay={0.16} className="flex flex-col items-center gap-3">
          <Button asChild size="lg" className="group">
            <a href="https://github.com/ivasik-k7/vesta-core" target="_blank" rel="noreferrer">
              <Flame className="size-4" aria-hidden />
              Watch vesta-core
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </Button>
          <p className="text-muted-foreground text-xs">
            Join the flame-keepers — it's a star, not a subscription. Unwatch any time.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
