import { Link } from '@tanstack/react-router'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { FlameDemo } from '@/components/landing/flame-demo'
import { EASE } from '@/components/landing/reveal'
import { Button } from '@/components/ui/button'

export function Hero() {
  const reduce = useReducedMotion()
  const enter = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: EASE },
  })

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-fade" />
        {/* ambient flame glow behind the product visual (§3.2) */}
        <div className="-translate-x-1/2 absolute top-[46%] left-1/2 h-[40rem] w-[64rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgb(122_38_4/0.35),transparent_65%)]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-7 px-4 pt-24 pb-28 text-center md:pt-32">
        <motion.h1
          {...enter(0.06)}
          className="max-w-3xl text-balance font-heading text-6xl leading-[1.04] tracking-tight md:text-7xl"
        >
          <span className="font-normal text-foreground/90">Loyalty that burns</span>
          <br />
          <span className="font-bold text-flame">brighter every visit</span>
        </motion.h1>

        <motion.p
          {...enter(0.12)}
          className="max-w-2xl text-lg text-muted-foreground leading-relaxed"
        >
          The living loyalty protocol on Solana. Points cool when ignored and compound with streaks,
          move only under governed on-chain policy, and unlock rewards gated by privacy-preserving
          identity — value that behaves like a flame across every brand you tend.
        </motion.p>

        <motion.div
          {...enter(0.15)}
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-muted-foreground text-xs"
        >
          <span className="text-flame">vesta_core</span>
          <span aria-hidden>·</span>
          <span>living economy</span>
          <span aria-hidden className="text-line-strong">
            /
          </span>
          <span className="text-flame">argus</span>
          <span aria-hidden>·</span>
          <span>governed transfer policy</span>
          <span aria-hidden className="text-line-strong">
            /
          </span>
          <span className="text-flame">aegis</span>
          <span aria-hidden>·</span>
          <span>private identity &amp; trust</span>
        </motion.div>

        <motion.div {...enter(0.18)} className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="group">
            <Link to="/app">
              Launch app
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="group border-line-strong">
            <a
              href="https://github.com/ivasik-k7/vesta-core/blob/main/README.md#architecture"
              target="_blank"
              rel="noreferrer"
            >
              Read the architecture
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </Button>
        </motion.div>

        {/* the product visual slot (§1.2): our product shot is alive */}
        <motion.div {...enter(0.26)} className="mt-10 w-full max-w-2xl">
          <FlameDemo />
        </motion.div>
      </div>
    </section>
  )
}
