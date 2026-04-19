'use client'

import { useEffect, useState } from 'react'
import type { ToastType } from '@/context/ToastContext'
import { cn } from '@/lib/utils'

type ToastRecord = {
  id: string
  message: string
  type: ToastType
}

const typeStyles: Record<
  ToastType,
  { bar: string; text: string }
> = {
  success: { bar: 'bg-emerald-500', text: 'text-emerald-50' },
  error: { bar: 'bg-red-500', text: 'text-red-50' },
  warning: { bar: 'bg-primary', text: 'text-primary-foreground' },
  info: { bar: 'bg-blue-500', text: 'text-blue-50' },
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastRecord
  onDismiss: (id: string) => void
}) {
  const [leaving, setLeaving] = useState(false)
  const duration = toast.type === 'error' ? 5000 : 3000

  useEffect(() => {
    const fadeTimer = setTimeout(() => setLeaving(true), duration)
    const removeTimer = setTimeout(() => onDismiss(toast.id), duration + 280)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [toast.id, duration, onDismiss])

  const styles = typeStyles[toast.type]

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex max-w-md min-w-[240px] overflow-hidden rounded-lg border border-border bg-card shadow-lg transition-all duration-300 ease-out',
        leaving ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100',
      )}
    >
      <div className={cn('w-1 shrink-0', styles.bar)} aria-hidden />
      <p className={cn('flex-1 px-3 py-2.5 text-sm', styles.text)}>
        {toast.message}
      </p>
      <button
        type="button"
        onClick={() => {
          setLeaving(true)
          setTimeout(() => onDismiss(toast.id), 200)
        }}
        className="shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastRecord[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null
  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
