import type { ComponentType, ReactNode } from 'react'

// Standardized page-section primitives for the customer journey. Every section
// shares the same header anatomy (flame icon tile + uppercase label + optional
// meta on the right), the same rhythm, and the same empty-state treatment.

/** A page section: uniform header + content. */
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
      <div className="mb-1 flex items-center gap-2.5">
        <span className="grid size-6 shrink-0 place-items-center rounded-lg border border-flame/20 bg-flame/10 text-flame">
          <Icon className="size-3.5" aria-hidden />
        </span>
        <h2 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.16em]">
          {title}
        </h2>
        {right ? <div className="ml-auto">{right}</div> : null}
      </div>
      {desc ? (
        <p className="mb-3 pl-[34px] text-muted-foreground/70 text-xs leading-relaxed">{desc}</p>
      ) : (
        <div className="mb-3" />
      )}
      {children}
    </section>
  )
}

/** Small tabular meta chip for a section header's right slot. */
export function SectionMeta({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-background/40 px-2.5 py-0.5 text-[11px] text-muted-foreground tabular-nums">
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
