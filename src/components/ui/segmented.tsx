import { motion } from 'motion/react'
import { type ComponentType, useId } from 'react'

import { cn } from '@/lib/utils'

export interface SegmentedOption<T> {
  value: T
  label?: string
  icon?: ComponentType<{ className?: string }>
}

/**
 * Segmented control with a shared-element flame pill that slides between
 * options. Fully keyboard-operable (it's a row of buttons).
 */
export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: {
  value: T
  onChange: (v: T) => void
  options: SegmentedOption<T>[]
  className?: string
  size?: 'sm' | 'md'
}) {
  const group = useId()
  const pad = size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'

  return (
    <div
      className={cn('inline-flex rounded-xl border border-border bg-background/40 p-1', className)}
    >
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'relative inline-flex items-center justify-center gap-1.5 rounded-lg transition-colors duration-200',
              pad,
              active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active ? (
              <motion.span
                layoutId={`seg-${group}`}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-lg bg-flame shadow-[0_0_12px_-4px_var(--color-flame)]"
                aria-hidden
              />
            ) : null}
            {o.icon ? <o.icon className="relative size-3.5" aria-hidden /> : null}
            {o.label ? <span className="relative">{o.label}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
