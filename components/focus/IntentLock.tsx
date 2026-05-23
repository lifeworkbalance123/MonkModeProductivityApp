'use client'

import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { getUserIdSafe } from '@/lib/supabaseAuthSafe'
import { cn } from '@/lib/utils'

type Props = {
  userId: string | null
  intent: string
  onIntentChange: (text: string) => void
  intentLocked: boolean
  onIntentLocked: () => void
  onIntentUnlock: () => void
  disabled?: boolean
}

export function IntentLock({
  userId,
  intent,
  onIntentChange,
  intentLocked,
  onIntentLocked,
  onIntentUnlock,
  disabled,
}: Props) {
  const prefilledFromJournal = useRef(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const uid = userId ?? (await getUserIdSafe())
      if (!uid || cancelled) return
      const logDate = format(new Date(), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('daily_logs')
        .select('micro_journal_text')
        .eq('user_id', uid)
        .eq('log_date', logDate)
        .maybeSingle()
      if (cancelled || error) {
        return
      }
      const text = data?.micro_journal_text
      if (
        !prefilledFromJournal.current &&
        typeof text === 'string' &&
        text.trim()
      ) {
        prefilledFromJournal.current = true
        onIntentChange(text.trim().slice(0, 280))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, onIntentChange])

  const valid = intent.trim().length >= 3

  if (intentLocked) {
    return (
      <div
        className={cn(
          'mb-4 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-foreground',
        )}
      >
        <p className="font-medium text-foreground">Intent locked</p>
        <p className="mt-1 text-muted-foreground">&ldquo;{intent.trim()}&rdquo;</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 h-8 text-xs text-muted-foreground hover:text-foreground"
          disabled={disabled}
          onClick={() => {
            onIntentUnlock()
            onIntentChange('')
          }}
        >
          Clear and re-enter
        </Button>
      </div>
    )
  }

  return (
    <div className="mb-4 space-y-2">
      <Label htmlFor="focus-intent-lock" className="text-xs text-muted-foreground">
        What will you ship in this block? (required before starting Pomodoro)
      </Label>
      <Textarea
        id="focus-intent-lock"
        value={intent}
        onChange={(e) => onIntentChange(e.target.value)}
        placeholder="e.g. Finish client proposal draft"
        rows={2}
        maxLength={280}
        disabled={disabled}
        className="resize-none bg-background text-sm"
      />
      {!valid ? (
        <p className="text-xs text-amber-600/90 dark:text-amber-400/90">
          Add at least 3 characters, then lock intent. Today&apos;s micro-journal is prefilled when
          present.
        </p>
      ) : null}
      <Button
        type="button"
        size="sm"
        className="bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={!valid || disabled}
        onClick={onIntentLocked}
      >
        Lock intent
      </Button>
    </div>
  )
}
