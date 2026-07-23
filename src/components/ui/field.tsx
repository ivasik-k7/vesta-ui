import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** The shared field-label look — mono, tracked, muted. */
export const FIELD_LABEL =
  'font-medium font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]'

/** The shared text-input look — inset field, flame focus ring. */
export const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm shadow-inner outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/50 focus:border-flame/60 focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-flame)_15%,transparent)]'

/** A labelled field wrapper: label · control · hint/error. Not a <label> (its
 *  control may be a custom widget), so it stays valid with any child. */
export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label?: string
  hint?: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('block', className)}>
      {label ? <span className={FIELD_LABEL}>{label}</span> : null}
      <div className={label ? 'mt-1.5' : ''}>{children}</div>
      {error ? (
        <p className="mt-1.5 text-[11px] text-red-400/90 leading-relaxed">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] text-muted-foreground/60 leading-relaxed">{hint}</p>
      ) : null}
    </div>
  )
}

/** Standardized text input. `invalid` paints the border red; `mono` for keys. */
export function Input({
  mono,
  invalid,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean; invalid?: boolean }) {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      className={cn(
        INPUT_CLASS,
        mono && 'font-mono',
        invalid && 'border-red-500/60 focus:border-red-500/70 focus:shadow-none',
        className,
      )}
    />
  )
}

/** Input with a trailing unit/suffix inside the same framed box (e.g. "pts"). */
export function InputWithSuffix({
  suffix,
  mono = true,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { suffix: string; mono?: boolean }) {
  return (
    <div className="flex items-center rounded-lg border border-border bg-background/60 px-3 shadow-inner transition-[border-color,box-shadow] duration-200 focus-within:border-flame/60 focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-flame)_15%,transparent)]">
      <input
        {...rest}
        className={cn(
          'w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/50',
          mono && 'font-mono',
          className,
        )}
      />
      <span className="shrink-0 text-muted-foreground text-xs">{suffix}</span>
    </div>
  )
}
