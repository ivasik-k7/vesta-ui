import type { ComponentType, ReactNode } from 'react'

// Standardized page-section primitive — the "indexed terminal" language:
// a monospace index (01 —, shown only inside a `.section-scope`), the title,
// a flame-led hairline rule, then the description and content. Auto-numbering
// is done with CSS counters (see index.css .section-scope) so it is fully
// deterministic and needs no per-call index wiring.

/** A page section: indexed terminal header + content. */
export function Section({
  icon: Icon,
  title,
  desc,
  right,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  desc?: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="fade-in-0 slide-in-from-bottom-2 animate-in">
      <div className="flex items-baseline gap-2.5">
        <span className="section-index flex min-w-0 items-center gap-2">
          <Icon className="size-3.5 shrink-0 translate-y-px text-flame/70" aria-hidden />
          <h2 className="truncate font-semibold text-[11px] uppercase tracking-[0.18em]">
            {title}
          </h2>
        </span>
        {right ? <div className="ml-auto shrink-0">{right}</div> : null}
      </div>
      <div
        aria-hidden
        className="mt-2 h-px w-full bg-gradient-to-r from-flame/55 via-border to-transparent"
      />
      {desc ? (
        <p className="mt-2.5 max-w-2xl text-muted-foreground/70 text-xs leading-relaxed">{desc}</p>
      ) : null}
      <div className="mt-3.5">{children}</div>
    </section>
  )
}

/** Plain tabular meta for a section header's right slot — no chrome. */
export function SectionMeta({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[11px] text-muted-foreground/80 uppercase tracking-[0.1em] tabular-nums">
      {children}
    </span>
  )
}

/** Standardized empty state — one look for every "nothing here yet". */
export function EmptySlate({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-border border-dashed bg-card/30 p-8 text-center">
      <Icon className="size-6 text-muted-foreground/40" aria-hidden />
      <div className="max-w-sm text-muted-foreground text-sm leading-relaxed">{children}</div>
    </div>
  )
}
