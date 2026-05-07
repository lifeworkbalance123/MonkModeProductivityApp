'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workMinutes: number
  /** Completed work sessions today (local) */
  sessionsToday: number
}

export function SessionSummary({ open, onOpenChange, workMinutes, sessionsToday }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border">
        <DialogHeader>
          <DialogTitle>Focus block complete</DialogTitle>
          <DialogDescription>
            You finished a {workMinutes}-minute work phase. Take your break, then come back for
            another round.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center">
          <p className="text-3xl font-bold tabular-nums text-accent">{sessionsToday}</p>
          <p className="text-xs text-muted-foreground">
            completed focus {sessionsToday === 1 ? 'block' : 'blocks'} today
          </p>
        </div>
        <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  )
}
