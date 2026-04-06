import { cn } from '@/lib/utils'

type ProBadgeProps = {
  className?: string
}

export function ProBadge({ className }: ProBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-accent/40 bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent',
        className,
      )}
    >
      Pro
    </span>
  )
}
