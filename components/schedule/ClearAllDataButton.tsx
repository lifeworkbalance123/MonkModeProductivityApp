'use client'

import { useCallback, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  onClear: () => Promise<void>
  hasData?: boolean
}

function ClearAllDataButton({ className, onClear, hasData = true }: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const confirm = useCallback(async () => {
    if (busy) return
    setBusy(true)
    setOpen(false)
    try {
      await onClear()
    } finally {
      setBusy(false)
    }
  }, [busy, onClear])

  if (!hasData) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          'rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground opacity-70',
          className,
        )}
      >
        No Data to Clear
      </button>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={busy}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-destructive/60 px-4 py-2 text-sm font-medium text-destructive transition hover:bg-destructive hover:text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        <Trash2 size={16} aria-hidden />
        {busy ? 'Clearing...' : 'Clear All Data'}
      </button>
      <ConfirmationModal
        isOpen={open}
        onClose={() => (busy ? null : setOpen(false))}
        onConfirm={confirm}
        confirmDisabled={busy}
        title="Clear All Data?"
        message="Are you sure you want to erase all your schedule data?"
        confirmText="Yes, Clear Everything"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}

export { ClearAllDataButton }
export default ClearAllDataButton

