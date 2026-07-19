import type { ReactNode } from 'react'

import { Reveal } from '@/components/landing/reveal'
import { cn } from '@/lib/utils'

// REFERENCES.md §2.1: every section opens with a two-line kicker + H2 pattern.
// Kickers are sentence-case, muted, ≤5 words — never uppercase, never orange.
export function SectionHeader({
  kicker,
  title,
  emphasis,
  sub,
  align = 'left',
}: {
  kicker: string
  title: string
  /** optional dual-weight half of the H2, rendered bold + flame (§2.2) */
  emphasis?: string
  sub?: ReactNode
  align?: 'left' | 'center'
}) {
  return (
    <Reveal className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      <p className="font-medium text-[13px] text-muted-foreground">{kicker}</p>
      <h2 className="mt-2 text-balance font-heading text-4xl tracking-tight md:text-[2.75rem] md:leading-[1.1]">
        {title}
        {emphasis ? (
          <>
            {' '}
            <span className="font-bold text-flame">{emphasis}</span>
          </>
        ) : null}
      </h2>
      {sub ? <p className="mt-4 text-muted-foreground leading-relaxed">{sub}</p> : null}
    </Reveal>
  )
}
