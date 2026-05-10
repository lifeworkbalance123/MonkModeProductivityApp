'use client'

import { cn } from '@/lib/utils'

export type CircularProgressRingProps = {
  /** Remaining fraction of interval (same semantics as deep-work ring: arc shrinks as time runs out). */
  remaining: number
  total: number
  size?: number
  className?: string
  /** Optional class on track circle stroke */
  trackClassName?: string
  /** Optional class on progress arc stroke */
  progressClassName?: string
}

/**
 * SVG circular countdown ring — visual only; timer logic lives in parent.
 */
export function CircularProgressRing({
  remaining,
  total,
  size = 280,
  className,
  trackClassName,
  progressClassName,
}: CircularProgressRingProps) {
  const baseR = 140
  const r = (baseR / 280) * size
  const c = 2 * Math.PI * r
  const frac = total > 0 ? remaining / total : 0
  const offset = c * (1 - frac)
  const stroke = Math.max(6, (10 / 280) * size)
  const half = size / 2

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <circle
        cx={half}
        cy={half}
        r={r}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={stroke}
        className={trackClassName}
      />
      <circle
        cx={half}
        cy={half}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${half} ${half})`}
        className={progressClassName}
      />
    </svg>
  )
}
