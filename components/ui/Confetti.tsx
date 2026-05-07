'use client'

import { useEffect, useMemo, useState } from 'react'

type Props = {
  /** Increment or toggle to trigger a burst */
  trigger: number
  /** ms */
  durationMs?: number
  className?: string
}

/**
 * Lightweight, pointer-events-none confetti burst (no deps).
 * Respects `prefers-reduced-motion`.
 */
export function Confetti({ trigger, durationMs = 2400, className }: Props) {
  const [burst, setBurst] = useState(0)
  const reduced = useMemo(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    if (trigger < 1 || reduced) return
    setBurst(trigger)
    const t = window.setTimeout(() => setBurst(0), durationMs)
    return () => window.clearTimeout(t)
  }, [trigger, durationMs, reduced])

  if (burst < 1 || reduced) return null

  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: `${5 + ((i * 17) % 90)}%`,
    delay: `${(i % 8) * 0.04}s`,
    hue: (i * 47) % 360,
  }))

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[200] overflow-hidden ${className ?? ''}`}
      aria-hidden
    >
      {pieces.map((p) => (
        <span
          key={`${burst}-${p.id}`}
          className="confetti-piece absolute top-0 h-3 w-2 rounded-sm opacity-90"
          style={{
            left: p.left,
            animationDelay: p.delay,
            backgroundColor: `hsl(${p.hue} 75% 55%)`,
          }}
        />
      ))}
    </div>
  )
}
