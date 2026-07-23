import { Check, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { type ComponentType, useEffect, useId, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import { INPUT_CLASS } from './field'

export interface SelectOption<T> {
  value: T
  label: string
  icon?: ComponentType<{ className?: string }>
  hint?: string
  disabled?: boolean
}

/**
 * Brand dropdown — a styled trigger + an animated popover of options that
 * replaces the native <select>. Full keyboard support (arrows, Home/End,
 * Enter/Esc, type-ahead), click-outside, selected + highlighted states, and it
 * flips above the trigger when there isn't room below.
 */
export function Select<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled,
  mono,
  className,
  'aria-label': ariaLabel,
}: {
  value: T
  onChange: (v: T) => void
  options: SelectOption<T>[]
  placeholder?: string
  disabled?: boolean
  mono?: boolean
  className?: string
  'aria-label'?: string
}) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const typeahead = useRef({ buf: '', t: 0 })

  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const selectedIndex = options.findIndex((o) => o.value === value)
  const [active, setActive] = useState(selectedIndex >= 0 ? selectedIndex : 0)

  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined

  const firstEnabled = () => options.findIndex((o) => !o.disabled)
  const lastEnabled = () => options.map((o) => !o.disabled).lastIndexOf(true)
  const step = (from: number, dir: 1 | -1) => {
    const n = options.length
    for (let i = 1; i <= n; i++) {
      const idx = (from + dir * i + n * i) % n
      if (!options[idx]?.disabled) return idx
    }
    return from
  }

  function openMenu() {
    if (disabled) return
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) setOpenUp(window.innerHeight - rect.bottom < 240 && rect.top > 240)
    setActive(selectedIndex >= 0 ? selectedIndex : firstEnabled())
    setOpen(true)
  }
  function close() {
    setOpen(false)
    btnRef.current?.focus()
  }
  function commit(i: number) {
    const o = options[i]
    if (!o || o.disabled) return
    onChange(o.value)
    setOpen(false)
    btnRef.current?.focus()
  }

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Keep the highlighted option in view.
  useEffect(() => {
    if (open) itemRefs.current[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openMenu()
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive((a) => step(a, 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive((a) => step(a, -1))
        break
      case 'Home':
        e.preventDefault()
        setActive(firstEnabled())
        break
      case 'End':
        e.preventDefault()
        setActive(lastEnabled())
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        commit(active)
        break
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'Tab':
        setOpen(false)
        break
      default:
        if (e.key.length === 1) {
          window.clearTimeout(typeahead.current.t)
          typeahead.current.buf += e.key.toLowerCase()
          typeahead.current.t = window.setTimeout(() => {
            typeahead.current.buf = ''
          }, 600)
          const hit = options.findIndex(
            (o) => !o.disabled && o.label.toLowerCase().startsWith(typeahead.current.buf),
          )
          if (hit >= 0) setActive(hit)
        }
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={btnRef}
        type="button"
        role="combobox"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-label={ariaLabel}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          INPUT_CLASS,
          'flex cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <span
          className={cn('flex min-w-0 items-center gap-2', !selected && 'text-muted-foreground/60')}
        >
          {selected?.icon ? (
            <selected.icon className="size-3.5 shrink-0 text-flame" aria-hidden />
          ) : null}
          <span className={cn('truncate', mono && 'font-mono')}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground/60 transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: openUp ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUp ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.25, 0.6, 0.35, 1] }}
            className={cn(
              'absolute z-40 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-panel-lg',
              openUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
            )}
          >
            <div
              id={`${id}-list`}
              role="listbox"
              aria-label={ariaLabel}
              className="scrollbar-flame max-h-60 overflow-y-auto p-1"
            >
              {options.map((o, i) => {
                const isSel = o.value === value
                const isActive = i === active
                return (
                  <button
                    key={String(o.value)}
                    ref={(el) => {
                      itemRefs.current[i] = el
                    }}
                    id={`${id}-opt-${i}`}
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    disabled={o.disabled}
                    onClick={() => commit(i)}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                      isActive && !o.disabled ? 'bg-flame/10 text-flame' : 'text-foreground',
                    )}
                  >
                    {o.icon ? (
                      <o.icon
                        className={cn(
                          'size-3.5 shrink-0',
                          isActive ? 'text-flame' : 'text-muted-foreground',
                        )}
                        aria-hidden
                      />
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate', mono && 'font-mono')}>{o.label}</span>
                      {o.hint ? (
                        <span className="block truncate text-[11px] text-muted-foreground/70">
                          {o.hint}
                        </span>
                      ) : null}
                    </span>
                    {isSel ? <Check className="size-3.5 shrink-0 text-flame" aria-hidden /> : null}
                  </button>
                )
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
