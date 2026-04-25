'use client'

import { useCallback, useState } from 'react'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  onCleared: () => void
  /** Optional: run before state updates; should throw to surface error. */
  clearRequest: () => Promise<void>
}

export default function ClearAllDataButton({ className, onCleared, clearRequest }: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const confirm = useCallback(async () => {
    if (busy) return
    setBusy(true)
    try {
      await clearRequest()
      onCleared()
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }, [busy, clearRequest, onCleared])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-destructive hover:bg-muted/30',
          className,
        )}
      >
        Clear all schedule data
      </button>
      <ConfirmationModal
        isOpen={open}
        onClose={() => (busy ? null : setOpen(false))}
        onConfirm={confirm}
        confirmDisabled={busy}
        title="Clear all schedule data?"
        message="This will erase all your schedule blocks, planner tasks, and repeat settings."
        confirmText={busy ? 'Clearing…' : 'Yes, clear everything'}
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}

