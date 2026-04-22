'use client'

import { useCallback, useEffect, useState } from 'react'

export function useTooltip(tooltipId: string) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const hasSeen = localStorage.getItem(tooltipId)
      setShow(!hasSeen)
    } catch {
      setShow(true)
    }
  }, [tooltipId])

  const dismiss = useCallback(() => {
    setShow(false)
    try {
      localStorage.setItem(tooltipId, 'true')
    } catch {
      /* ignore quota / private mode */
    }
  }, [tooltipId])

  return { show, dismiss }
}
