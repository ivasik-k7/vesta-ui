import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

// REFERENCES.md §6: gentle fade+rise, ~300ms ease-out, nothing bouncy.
const EASE = [0.25, 0.6, 0.35, 1] as const

export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.35, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

export { EASE }
