import { cn } from '@/lib/utils'

type BonusBadgeProps = {
  className?: string
}

export function BonusBadge({ className }: BonusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-dashed border-accent/50 bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent',
        className,
      )}
    >
      Bonus
    </span>
  )
}

