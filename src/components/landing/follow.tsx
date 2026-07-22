import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEnterApp } from '@/components/landing/launch'
import { Reveal } from '@/components/landing/reveal'
import { Button } from '@/components/ui/button'

// §1.12 — the capture section: the build is public, the app is live. One glow,
// two actions, and the clone line for the people who read code first.
export function Follow() {
  const enterApp = useEnterApp()
  const { t } = useTranslation()
  return (
    <section className="relative overflow-hidden border-border/60 border-t">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_50%_115%,rgb(122_38_4/0.4),transparent_70%)]"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24 md:py-32">
        <Reveal>
          <h2 className="text-balance font-heading text-4xl tracking-tight md:text-5xl">
            {t('landing.follow.title1')}{' '}
            <span className="font-bold text-flame">{t('landing.follow.emphasis')}</span>
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="max-w-md text-muted-foreground leading-relaxed">
            {t('landing.follow.sub')}
          </p>
        </Reveal>
        <Reveal delay={0.16} className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="group" onClick={enterApp}>
            {t('landing.cta.launch')}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button asChild size="lg" variant="outline" className="group border-line-strong">
            <a href="https://github.com/ivasik-k7/vesta-core" target="_blank" rel="noreferrer">
              {t('landing.cta.source')}
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </Button>
        </Reveal>
        <Reveal delay={0.24}>
          <p className="font-mono text-muted-foreground text-xs">
            $ git clone github.com/ivasik-k7/vesta-core
            <span aria-hidden className="text-flame motion-safe:animate-blink">
              ▍
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
