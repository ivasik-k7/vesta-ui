import { Link, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'

import { useEnterApp } from '@/components/landing/launch'
import { Button } from '@/components/ui/button'

// The branded dead end: a PDA that derives to nothing. Same grid + glow +
// terminal language as the landing, so even the failure page feels like VESTA.
export function NotFound() {
  const reduce = useReducedMotion()
  const { t } = useTranslation()
  const enterApp = useEnterApp()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-fade" />
        <div className="-translate-x-1/2 absolute top-[55%] left-1/2 h-[30rem] w-[52rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgb(122_38_4/0.3),transparent_65%)]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-24 text-center">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-clip-text font-bold font-heading text-[8rem] text-transparent leading-none tracking-tight md:text-[12rem]"
          style={{
            backgroundImage: 'linear-gradient(180deg,#f25c1f,#7a2604 80%,transparent)',
            backgroundSize: '100% 130%',
          }}
        >
          404
        </motion.p>

        <div className="w-full max-w-lg rounded-xl border border-border bg-card/80 p-4 text-left font-mono text-xs backdrop-blur">
          <p className="text-muted-foreground">
            $ vesta resolve <span className="text-foreground/85">{pathname}</span>
          </p>
          <p className="mt-1.5 text-flame">
            ✗ AccountNotFound — no PDA derives to this address
            <span aria-hidden className="motion-safe:animate-blink">
              ▍
            </span>
          </p>
        </div>

        <h1 className="text-balance font-heading font-semibold text-3xl tracking-tight md:text-4xl">
          {t('notFound.title')}
        </h1>
        <p className="max-w-md text-muted-foreground leading-relaxed">{t('notFound.body')}</p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" variant="outline" className="group border-line-strong">
            <Link to="/">
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              {t('notFound.home')}
            </Link>
          </Button>
          <Button size="lg" className="group" onClick={enterApp}>
            {t('landing.cta.launch')}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </section>
  )
}
