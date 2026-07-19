import { Flame, Plus } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

const TICK_MS = 100
// -20%/yr on-chain; accelerated here so the mechanic is visible
const DEMO_DECAY_PER_TICK = 0.9986
const WEEK = [0.55, 0.7, 0.45, 0.8, 0.62, 0.9, 1]

export function FlameDemo() {
  const reduce = useReducedMotion()
  const [balance, setBalance] = useState(142.6)
  const [streak, setStreak] = useState(5)
  const [burstKey, setBurstKey] = useState(0)
  const peak = useRef(160)

  useEffect(() => {
    const id = setInterval(() => {
      setBalance((value) => Math.max(value * DEMO_DECAY_PER_TICK, 0))
    }, TICK_MS)
    return () => clearInterval(id)
  }, [])

  const multiplier = useMemo(() => 1 + streak * 0.12, [streak])
  const health = Math.min(balance / peak.current, 1)

  const checkIn = () => {
    setBalance((value) => {
      const next = value + 18 * multiplier
      peak.current = Math.max(peak.current, next)
      return next
    })
    setStreak((days) => days + 1)
    setBurstKey((key) => key + 1)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-white/[0.05] to-transparent p-6 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] backdrop-blur md:p-8">
      <p className="flex items-center justify-between font-medium text-[13px] text-muted-foreground">
        Live mechanic
        <span className="text-flame/80">token-2022 · interest-bearing</span>
      </p>

      <div className="mt-6 flex items-center gap-6">
        <div className="relative grid size-24 shrink-0 place-items-center">
          <div
            aria-hidden
            className="absolute inset-0 rounded-full bg-flame/25 blur-2xl transition-opacity duration-500"
            style={{ opacity: 0.25 + health * 0.75 }}
          />
          <motion.div
            animate={reduce ? undefined : { scale: 0.92 + health * 0.16 }}
            transition={{ duration: 0.5 }}
            className="motion-safe:animate-flicker"
            style={{ opacity: 0.45 + health * 0.55 }}
          >
            <Flame
              className="size-14 text-flame drop-shadow-[0_0_18px_rgb(226_71_10/0.45)]"
              aria-hidden
            />
          </motion.div>
          <AnimatePresence>
            <motion.div
              key={burstKey}
              aria-hidden
              className="absolute inset-0 rounded-full border border-flame/50"
              initial={{ opacity: 0.7, scale: 0.6 }}
              animate={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.8 }}
            />
          </AnimatePresence>
        </div>

        <div className="min-w-0">
          <p className="font-medium text-[13px] text-muted-foreground">Your flame</p>
          <p className="font-mono text-5xl text-foreground tabular-nums tracking-tight">
            {balance.toFixed(1)}
          </p>
          <p className="mt-1 text-muted-foreground text-sm">
            cooling in real time — tend it or lose it
          </p>
        </div>
      </div>

      <div className="mt-7 flex items-end justify-between gap-6">
        <div className="flex items-end gap-1.5" aria-hidden>
          {WEEK.map((height, day) => (
            <motion.div
              key={`h-${String(height)}`}
              initial={reduce ? false : { scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35 + day * 0.06, duration: 0.5 }}
              className={`w-2.5 origin-bottom rounded-full ${
                day === WEEK.length - 1 ? 'bg-flame' : 'bg-muted-foreground/25'
              }`}
              style={{ height: `${12 + height * 30}px` }}
            />
          ))}
        </div>
        <div className="text-right">
          <p className="font-mono text-muted-foreground text-xs tabular-nums">
            streak <span className="text-foreground">{streak}d</span> · multiplier{' '}
            <span className="text-flame">×{multiplier.toFixed(2)}</span>
          </p>
          <Button onClick={checkIn} size="sm" className="group mt-3 active:scale-[0.97]">
            <Plus className="size-4 transition-transform group-hover:rotate-90" />
            Check in at the counter
          </Button>
        </div>
      </div>

      <p className="mt-6 border-border/50 border-t pt-4 font-mono text-[11px] text-muted-foreground/70">
        on-chain rate −20%/yr via InterestBearingConfig · accelerated ~10 000× for demo
      </p>
    </div>
  )
}
