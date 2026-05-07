'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { withAuthStorageLockRetry } from '@/lib/authStorageLock'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type BaseProps = {
  onCancel?: () => void
  submitLabel?: string
  placeholder?: string
  compact?: boolean
  /** Reply row: tighter vertical spacing (also implies compact height unless overridden). */
  isReply?: boolean
  disabled?: boolean
}

/** Parent-owned value; `onSubmit` receives trimmed text (like a native form). */
export type ControlledCommentFormProps = BaseProps & {
  value: string
  onChange: (val: string) => void
  onSubmit: (content: string) => void | Promise<void>
  isSubmitting?: boolean
}

export type UncontrolledCommentFormProps = BaseProps & {
  lessonId: string
  parentCommentId?: string | null
  onPosted: () => void
}

export type CommentFormProps = ControlledCommentFormProps | UncontrolledCommentFormProps

function isControlled(props: CommentFormProps): props is ControlledCommentFormProps {
  return 'value' in props && 'onChange' in props && 'onSubmit' in props
}

function CommentForm(props: CommentFormProps) {
  const {
    onCancel,
    submitLabel = 'Post',
    placeholder = 'Write a comment…',
    compact = false,
    isReply = false,
    disabled: disabledProp,
  } = props

  const effectiveCompact = compact || isReply

  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isControlled(props)) {
    const { value, onChange, onSubmit, isSubmitting } = props
    const busy = !!isSubmitting
    const disabled = disabledProp || busy
    const trimmed = value.trim()

    async function handleSubmit() {
      if (!trimmed) return
      await onSubmit(trimmed)
    }

    return (
      <div>
        <div className={`flex gap-2 ${isReply ? 'mt-2' : 'mb-4'}`}>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'Write a comment…'}
            maxLength={4000}
            disabled={disabled}
            rows={effectiveCompact ? 2 : 3}
            className="min-h-20 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:opacity-50"
          />
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={disabled || !trimmed}
            className="h-fit shrink-0 self-start"
          >
            {busy ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden />
                Posting…
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={onCancel} disabled={disabled}>
            Cancel
          </Button>
        ) : null}
      </div>
    )
  }

  const { lessonId, parentCommentId = null, onPosted } = props

  async function submit() {
    const trimmed = content.trim()
    if (!trimmed) return
    setSaving(true)
    setError(null)
    try {
      const {
        data: { session },
      } = await withAuthStorageLockRetry(() => supabase.auth.getSession())
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }
      const res = await fetch('/api/lesson/comments', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          lessonId,
          content: trimmed,
          parentCommentId: parentCommentId || undefined,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Could not post comment.')
        return
      }
      setContent('')
      onPosted()
    } finally {
      setSaving(false)
    }
  }

  const disabled = disabledProp || saving

  return (
    <div className={effectiveCompact ? 'space-y-2' : 'space-y-3'}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={effectiveCompact ? 2 : 3}
        maxLength={4000}
        className="resize-y text-sm"
        disabled={disabled}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={() => void submit()} disabled={disabled || !content.trim()}>
          {saving ? (
            <>
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden />
              Posting…
            </>
          ) : (
            submitLabel
          )}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={disabled}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export default CommentForm
export { CommentForm }
