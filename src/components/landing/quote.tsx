import { Reveal } from '@/components/landing/reveal'

// §1.3 — a single standalone brand statement as a breather after the hero.
export function BrandQuote() {
  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
        <Reveal className="mx-auto max-w-3xl text-center">
          <blockquote className="text-balance font-heading text-2xl text-foreground/90 leading-snug md:text-3xl">
            “Loyalty programs treat devotion like a spreadsheet.
            <br className="hidden md:block" /> We treat it like a{' '}
            <span className="font-bold text-flame">flame</span> — it lives if you tend it.”
          </blockquote>
          <p className="mt-5 text-muted-foreground text-sm">— the VESTA team</p>
        </Reveal>
      </div>
    </section>
  )
}
