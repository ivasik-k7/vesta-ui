import type { ComponentType, ReactNode } from 'react'

// Standardized composition kit for the settings overlay — a premium, "techy"
// look (à la nu.fi / Discord) aligned with the flame/dark system: glassy
// layered cards, flame accents, icon tiles, and tactile controls.

/** A titled card: flame-accent header, gradient divider, tactile rows. */
export function Group({
  title,
  desc,
  icon: Icon,
  right,
  children,
}: {
  title: string
  desc?: string
  icon?: ComponentType<{ className?: string }>
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="group/card fade-in-0 slide-in-from-bottom-2 animate-in overflow-hidden rounded-2xl border border-border bg-card/50 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.75)] ring-1 ring-foreground/[0.02] ring-inset backdrop-blur-sm transition-colors duration-300 hover:border-line-strong">
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2.5">
        {Icon ? (
          <span className="grid size-6 shrink-0 place-items-center rounded-lg border border-flame/20 bg-flame/10 text-flame">
            <Icon className="size-3.5" aria-hidden />
          </span>
        ) : (
          <span
            aria-hidden
            className="h-3.5 w-1 shrink-0 rounded-full bg-gradient-to-b from-flame to-flame-deep"
          />
        )}
        <h3 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.16em]">
          {title}
        </h3>
        {right ? <div className="ml-auto">{right}</div> : null}
      </div>
      <div
        aria-hidden
        className="mx-4 h-px bg-gradient-to-r from-border via-border/50 to-transparent"
      />
      <div className="divide-y divide-border/40">{children}</div>
      {desc ? (
        <p className="truncate border-border/40 border-t bg-background/20 px-4 py-2 font-mono text-[11px] text-muted-foreground/60">
          {desc}
        </p>
      ) : null}
    </section>
  )
}

/** A row: icon tile + label/description on the left, control on the right. */
export function Row({
  icon: Icon,
  title,
  desc,
  children,
  onClick,
}: {
  icon?: ComponentType<{ className?: string }>
  title: ReactNode
  desc?: ReactNode
  children?: ReactNode
  onClick?: () => void
}) {
  const inner = (
    <>
      {onClick ? (
        <span
          aria-hidden
          className="-translate-y-1/2 absolute top-1/2 left-0 h-6 w-[2.5px] scale-y-0 rounded-r-full bg-flame transition-transform duration-200 group-hover/row:scale-y-100"
        />
      ) : null}
      {Icon ? (
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border/60 bg-background/50 text-muted-foreground transition-colors duration-200 group-hover/row:border-flame/40 group-hover/row:text-flame">
          <Icon className="size-4" aria-hidden />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm">{title}</div>
        {desc ? (
          <div className="mt-0.5 text-muted-foreground text-xs leading-snug">{desc}</div>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </>
  )
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group/row relative flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gradient-to-r hover:from-flame/[0.07] hover:to-transparent"
      >
        {inner}
      </button>
    )
  }
  return <div className="group/row relative flex items-center gap-3 px-4 py-3">{inner}</div>
}

/** Read-only key → value row; value monospaced and high-contrast by default. */
export function DataRow({
  label,
  value,
  mono = true,
  children,
}: {
  label: string
  value: ReactNode
  mono?: boolean
  children?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="shrink-0 text-muted-foreground text-xs">{label}</span>
      <span
        className={`ml-auto min-w-0 truncate text-foreground/90 text-sm ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </span>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  )
}

/** A stacked labelled field (mono micro-label above the control). */
export function FieldRow({
  label,
  desc,
  children,
}: {
  label: string
  desc?: string
  children: ReactNode
}) {
  return (
    <div className="px-4 py-3">
      <span className="font-medium font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]">
        {label}
      </span>
      <div className="mt-2">{children}</div>
      {desc ? (
        <p className="mt-2 text-[11px] text-muted-foreground/60 leading-relaxed">{desc}</p>
      ) : null}
    </div>
  )
}

/** Tactile pill toggle: flame track + glow when on, springy knob. */
export function Switch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full ring-1 ring-inset transition-colors duration-200 ${
        checked
          ? 'bg-flame ring-flame/40 shadow-[0_0_14px_-3px_var(--color-flame)]'
          : 'bg-secondary ring-border'
      }`}
    >
      <span
        className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

/** Compact segmented control with a glowing active pill. */
export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label?: string; icon?: ComponentType<{ className?: string }> }[]
}) {
  return (
    <div className="inline-flex rounded-xl border border-border bg-background/40 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-200 ${
            value === o.value
              ? 'bg-flame text-primary-foreground shadow-[0_0_12px_-4px_var(--color-flame)]'
              : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
          }`}
        >
          {o.icon ? <o.icon className="size-3.5" aria-hidden /> : null}
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Standard input styled for the kit — inset dark field, flame focus ring. */
export function Input({
  mono,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return (
    <input
      {...rest}
      className={`w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm shadow-inner outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/50 focus:border-flame/60 focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-flame)_15%,transparent)] ${
        mono ? 'font-mono' : ''
      } ${className ?? ''}`}
    />
  )
}
