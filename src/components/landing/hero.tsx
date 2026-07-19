import { Link } from '@tanstack/react-router'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { EASE } from '@/components/landing/reveal'
import { Button } from '@/components/ui/button'

import { FlameDemo } from './flame-demo'

export function Hero() {
  const reduce = useReducedMotion()
  const enter = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: EASE },
  })

  return (
    <section className="relative overflow-hidden">
      {/* ambient layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-fade" />
        <div className="-top-40 -left-32 absolute size-[42rem] rounded-full bg-solana-purple/20 blur-[140px] motion-safe:animate-aurora" />
        <div className="-right-40 absolute top-24 size-[36rem] rounded-full bg-solana-green/10 blur-[140px] motion-safe:animate-aurora-slow" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-16 px-4 pt-24 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:pt-32 lg:pb-28">
        <div className="flex flex-col items-start gap-7">
          <motion.h1
            {...enter(0.08)}
            className="text-balance font-heading font-semibold text-5xl leading-[1.04] tracking-tight md:text-6xl xl:text-7xl"
          >
            Loyalty that burns{' '}
            <span className="bg-[length:200%_auto] bg-clip-text bg-gradient-to-r from-solana-purple via-solana-green to-solana-purple text-transparent motion-safe:animate-gradient-pan">
              brighter
            </span>{' '}
            the more you show up
          </motion.h1>

          <motion.p
            {...enter(0.16)}
            className="max-w-xl text-pretty text-lg text-muted-foreground leading-relaxed"
          >
            VESTA makes points a living asset: value cools when ignored, compounds with streaks,
            swaps across merchants, and mints proof of devotion no one can buy.
          </motion.p>

          <motion.div {...enter(0.24)} className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="group">
              <Link to="/app">
                Launch the app
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="group text-muted-foreground">
              <a href="https://github.com/ivasik-k7/vesta-core" target="_blank" rel="noreferrer">
                Explore the architecture
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
        >
          <FlameDemo />
        </motion.div>
      </div>
    </section>
  )
}
