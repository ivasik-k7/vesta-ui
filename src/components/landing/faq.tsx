import { useTranslation } from 'react-i18next'

import { Reveal } from '@/components/landing/reveal'
import { SectionHeader } from '@/components/landing/section-header'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQ_COUNT = 7

export function Faq() {
  const { t } = useTranslation()
  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-24 md:py-32">
        <SectionHeader
          kicker={t('landing.faq.kicker')}
          title={t('landing.faq.title')}
          emphasis={t('landing.faq.emphasis')}
        />

        <Reveal delay={0.1} className="mt-10">
          <Accordion type="single" collapsible className="w-full">
            {Array.from({ length: FAQ_COUNT }, (_, i) => i + 1).map((n) => (
              <AccordionItem key={n} value={String(n)} className="border-border/60">
                <AccordionTrigger className="gap-4 py-4 text-base hover:no-underline">
                  <span className="flex min-w-0 items-baseline gap-4">
                    <span className="shrink-0 font-mono text-flame text-xs tabular-nums">
                      {String(n).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 font-heading font-semibold tracking-tight">
                      {t(`landing.faq.q${n}`)}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <p className="border-border/60 border-l pl-[2.05rem] text-muted-foreground leading-relaxed">
                    {t(`landing.faq.a${n}`)}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  )
}
