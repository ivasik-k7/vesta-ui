import { cn } from '@/lib/utils'

/** Reserved-space placeholder so async reads never shift the layout. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-secondary/60', className)} />
}

export function CardSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => `sk-${i}`).map((k) => (
        <Skeleton key={k} className="h-40" />
      ))}
    </div>
  )
}
