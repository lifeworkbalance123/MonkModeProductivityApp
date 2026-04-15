'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

function useDocumentDarkClass(): boolean {
  const [dark, setDark] = useState(true)
  useEffect(() => {
    const el = document.documentElement
    const sync = () => setDark(el.classList.contains('dark'))
    sync()
    const obs = new MutationObserver(sync)
    obs.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return dark
}

const Toaster = ({ ...props }: ToasterProps) => {
  const dark = useDocumentDarkClass()

  return (
    <Sonner
      theme={dark ? 'dark' : 'light'}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
