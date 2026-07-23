import { cn } from '@/lib/utils'

/**
 * Standardized brand toggle — flame track with a soft glow when on, a springy
 * white knob, and a focus ring. One implementation for the whole app.
 */
export function Switch({
  checked,
  onChange,
  disabled,
  size = 'md',
  id,
  'aria-label': ariaLabel,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  id?: string
  'aria-label'?: string
}) {
  const dims =
    size === 'sm'
      ? { track: 'h-5 w-9', knob: 'size-3.5', on: 'translate-x-4', off: 'translate-x-0.5' }
      : { track: 'h-6 w-11', knob: 'size-4', on: 'translate-x-6', off: 'translate-x-1' }

  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full outline-none ring-1 ring-inset transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-flame/60',
        dims.track,
        checked
          ? 'bg-flame ring-flame/40 shadow-[0_0_14px_-3px_var(--color-flame)]'
          : 'bg-secondary ring-border',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={cn(
          'inline-block rounded-full bg-white shadow-sm ring-1 ring-black/10 transition-transform duration-200 ease-out',
          dims.knob,
          checked ? dims.on : dims.off,
        )}
      />
    </button>
  )
}
