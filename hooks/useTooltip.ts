'use client'

import { useCallback, useEffect, useState } from 'react'

/** `hidden` = dismissed; `collapsed` = minimized chip; `expanded` = full panel. */
export type TooltipVisibility = 'expanded' | 'collapsed' | 'hidden'

function readVisibility(tooltipId: string): TooltipVisibility {
  try {
    if (typeof window === 'undefined') return 'hidden'
    const v = localStorage.getItem(tooltipId)
    if (v === 'true' || v === 'dismissed') return 'hidden'
    if (v === 'collapsed') return 'collapsed'
    return 'expanded'
  } catch {
    return 'expanded'
  }
}

export function useTooltip(tooltipId: string) {
  const [visibility, setVisibility] = useState<TooltipVisibility>('hidden')

  useEffect(() => {
    setVisibility(readVisibility(tooltipId))
  }, [tooltipId])

  const dismiss = useCallback(() => {
    setVisibility('hidden')
    try {
      localStorage.setItem(tooltipId, 'dismissed')
    } catch {
      /* ignore */
    }
  }, [tooltipId])

  const collapse = useCallback(() => {
    setVisibility('collapsed')
    try {
      localStorage.setItem(tooltipId, 'collapsed')
    } catch {
      /* ignore */
    }
  }, [tooltipId])

  const expand = useCallback(() => {
    setVisibility('expanded')
    try {
      localStorage.removeItem(tooltipId)
    } catch {
      /* ignore */
    }
  }, [tooltipId])

  /** @deprecated Prefer `visibility !== 'hidden'` */
  const show = visibility !== 'hidden'

  return { visibility, show, dismiss, collapse, expand }
}
