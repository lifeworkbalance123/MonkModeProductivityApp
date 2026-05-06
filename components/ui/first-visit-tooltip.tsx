'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { HoverTooltip } from '@/components/ui/HoverTooltip'

type Props = {
  id: string
  text: string
  children: ReactNode
}

export function Tooltip({ id, text, children }: Props) {
  const key = useMemo(() => `first-visit-tooltip:${id}`, [id])
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(key) === '1'
      if (!seen) setShow(true)
    } catch {
      setShow(true)
    }
  }, [key])

  useEffect(() => {
    if (!show) return
    try {
      localStorage.setItem(key, '1')
    } catch {
      // ignore
    }
  }, [key, show])

  if (!show) return <>{children}</>
  return <HoverTooltip text={text}>{children}</HoverTooltip>
}

