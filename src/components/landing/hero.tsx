import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { FlameDemo } from '@/components/landing/flame-demo'
import { useEnterApp } from '@/components/landing/launch'
import { EASE } from '@/components/landing/reveal'
import { Button } from '@/components/ui/button'

export function Hero() {
  const reduce = useReducedMotion()
  const enterApp = useEnterApp()
  const { t } = useTranslation()
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
        <div className="absolute top-[30%] right-[-20%] h-[36rem] w-[48rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgb(122_38_4/0.35),transparent_65%)]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pt-16 pb-16 sm:pt-24 sm:pb-24 md:grid-cols-[1.05fr_0.95fr] md:gap-10 md:pt-32 md:pb-32">
        <div>
          <motion.h1
            {...enter(0.06)}
            className="text-balance font-heading text-5xl leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"
          >
            <span className="font-normal text-foreground/90">{t('landing.hero.h1a')}</span>{' '}
            <motion.span
              className="bg-clip-text font-bold text-transparent"
              style={{
                backgroundImage: 'linear-gradient(90deg,#f25c1f,#ffb27a,#f25c1f)',
                backgroundSize: '200% 100%',
              }}
              animate={reduce ? undefined : { backgroundPositionX: ['0%', '200%'] }}
              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            >
              {t('landing.hero.h1b')}
            </motion.span>
          </motion.h1>

          <motion.p
            {...enter(0.12)}
            className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed"
          >
            {t('landing.hero.sub')}
          </motion.p>

          <motion.div {...enter(0.18)} className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" className="group" onClick={enterApp}>
              {t('landing.cta.launch')}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button asChild size="lg" variant="outline" className="group border-line-strong">
              <a
                href="https://github.com/ivasik-k7/vesta-core/blob/main/README.md#architecture"
                target="_blank"
                rel="noreferrer"
              >
                {t('landing.cta.architecture')}
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </Button>
          </motion.div>
        </div>

        {/* the product visual slot (§1.2): our product shot is alive */}
        <motion.div {...enter(0.2)} className="w-full">
          <FlameDemo />
        </motion.div>
      </div>
    </section>
  )
}
