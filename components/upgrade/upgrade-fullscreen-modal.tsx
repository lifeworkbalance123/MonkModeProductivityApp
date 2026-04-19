'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

type UpgradeFullscreenModalProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function UpgradeFullscreenModal({
  open,
  onClose,
  children,
}: UpgradeFullscreenModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col justify-end sm:justify-center sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade to Pro"
    >
      <button
        type="button"
        className="absolute top-3 right-3 z-[70] flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 bg-background/90 text-foreground shadow-lg transition hover:bg-card hover:scale-105"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
      <button
        type="button"
        className="absolute inset-0 z-0 cursor-default sm:hidden"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl border border-primary/35 bg-background shadow-2xl animate-in slide-in-from-bottom duration-300 sm:mx-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-3xl sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  )
}
