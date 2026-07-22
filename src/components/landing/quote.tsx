import { BadgeCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Reveal } from '@/components/landing/reveal'

// §1.3 — the brand statement, staged as a signed on-chain memo: crypto-native
// framing for the one sentence that carries the whole thesis.
export function BrandQuote() {
  const { t } = useTranslation()
  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24 md:py-32">
        <Reveal className="mx-auto max-w-2xl">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-flame/60 to-transparent"
            />
            <div className="flex items-center gap-2 border-border/60 border-b px-4 py-2.5 font-mono text-muted-foreground text-xs">
              <span aria-hidden className="flex gap-1.5">
                <span className="size-2 rounded-full bg-border" />
                <span className="size-2 rounded-full bg-border" />
                <span className="size-2 rounded-full bg-flame/60" />
              </span>
              <span className="ml-1">{t('landing.quote.header')}</span>
            </div>

            <div className="p-6 md:p-8">
              <p className="font-mono text-muted-foreground text-xs">
                $ memo sign --keypair vesta.json
              </p>
              <blockquote className="mt-4 text-balance font-heading text-2xl text-foreground/90 leading-snug md:text-3xl">
                “{t('landing.quote.q1')}
                <span className="font-bold text-flame">{t('landing.quote.flame')}</span>
                {t('landing.quote.q2')}”
              </blockquote>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs">
                <span className="text-muted-foreground">
                  {t('landing.quote.sig')}{' '}
                  <span className="text-foreground/70">3VstaF1…keEp5r</span>
                </span>
                <span className="inline-flex items-center gap-1 text-flame-hover">
                  <BadgeCheck className="size-3.5" aria-hidden />
                  {t('landing.quote.verified')}
                </span>
                <span className="text-muted-foreground">{t('landing.quote.team')}</span>
                <span aria-hidden className="text-flame motion-safe:animate-blink">
                  ▍
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
