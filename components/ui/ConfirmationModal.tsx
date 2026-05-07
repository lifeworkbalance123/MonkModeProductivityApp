'use client'

import { useEffect, useId } from 'react'
import { cn } from '@/lib/utils'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  confirmDisabled?: boolean
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Yes, Clear Everything',
  cancelText = 'Cancel',
  variant = 'danger',
  confirmDisabled = false,
}: ConfirmationModalProps) {
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const confirmBtn =
    variant === 'danger'
      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
      : variant === 'warning'
        ? 'bg-amber-600 text-white hover:bg-amber-700'
        : 'bg-blue-600 text-white hover:bg-blue-700'

  const iconColor =
    variant === 'danger' ? 'text-destructive' : variant === 'warning' ? 'text-amber-500' : 'text-blue-500'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className={cn('text-xl', iconColor)} aria-hidden>
              ⚠️
            </span>
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              {title}
            </h2>
          </div>

          <p id={descId} className="text-sm text-muted-foreground">
            {message}
          </p>

          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">This will erase:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>All time blocks and tasks</li>
              <li>All repeat settings (Mon, Tue, etc.)</li>
              <li>All text inputs across the schedule</li>
            </ul>
            <p className="mt-2 text-destructive">This action cannot be undone.</p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-muted/40"
            >
              {cancelText}
            </button>
            <button
              type="button"
              disabled={confirmDisabled}
              onClick={() => void onConfirm()}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
                confirmBtn,
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

