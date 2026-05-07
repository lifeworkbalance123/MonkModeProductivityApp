'use client'

import { useCallback, useEffect, useState } from 'react'
import { Heart, MessageCircle, Pencil, Trash2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { withAuthStorageLockRetry } from '@/lib/authStorageLock'
import type { LessonCommentApi } from '@/lib/lessonComments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import CommentForm from '@/components/lesson/CommentForm'

function formatRelativeTime(iso: string) {
  const t = new Date(iso).getTime()
  const diff = Date.now() - t
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 14) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

function displayName(c: LessonCommentApi) {
  const n = c.authorDisplayName?.trim()
  if (n) return n
  return `User ${c.userId.slice(0, 6)}…`
}

function avatarInitial(c: LessonCommentApi) {
  const name = displayName(c).trim()
  if (!name) return '👤'
  const ch = name.charAt(0).toUpperCase()
  return /[A-Z0-9]/.test(ch) ? ch : '👤'
}

async function authJsonHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await withAuthStorageLockRetry(() => supabase.auth.getSession())
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }
  return headers
}

export type CommentItemProps = {
  comment: LessonCommentApi
  lessonId: string
  childMap: Map<string, LessonCommentApi[]>
  currentUserId: string | null
  depth: number
  /** Refetch the comment list after mutations. */
  onRefresh: () => void
}

function CommentItem({
  comment,
  lessonId,
  childMap,
  currentUserId,
  depth,
  onRefresh,
}: CommentItemProps) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [likeBusy, setLikeBusy] = useState(false)
  const [delBusy, setDelBusy] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)

  const replies = childMap.get(comment.id) ?? []
  const isMine = currentUserId !== null && comment.userId === currentUserId
  const isNested = depth > 0

  const [likedLocal, setLikedLocal] = useState(comment.likedByMe)
  const [likesLocal, setLikesLocal] = useState(comment.likesCount)

  useEffect(() => {
    setLikedLocal(comment.likedByMe)
    setLikesLocal(comment.likesCount)
  }, [comment.id, comment.likedByMe, comment.likesCount])

  const handleLike = useCallback(async () => {
    setLikeBusy(true)
    try {
      const headers = await authJsonHeaders()
      const action = likedLocal ? 'unlike' : 'like'
      const res = await fetch(`/api/lesson/comments/${comment.id}/like`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action }),
      })
      const json = (await res.json().catch(() => ({}))) as { liked?: boolean; error?: string }
      if (!res.ok) return
      if (json.liked === true) {
        setLikedLocal(true)
        setLikesLocal((n) => n + 1)
      } else if (json.liked === false) {
        setLikedLocal(false)
        setLikesLocal((n) => Math.max(0, n - 1))
      }
    } finally {
      setLikeBusy(false)
    }
  }, [comment.id, likedLocal])

  async function saveEdit() {
    const trimmed = editText.trim()
    if (!trimmed) return
    setSaveBusy(true)
    try {
      const headers = await authJsonHeaders()
      const res = await fetch(`/api/lesson/comments/${comment.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ content: trimmed }),
      })
      if (!res.ok) return
      setEditing(false)
      onRefresh()
    } finally {
      setSaveBusy(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this comment? Replies will be removed too.')) return
    setDelBusy(true)
    try {
      const {
        data: { session },
      } = await withAuthStorageLockRetry(() => supabase.auth.getSession())
      const headers: Record<string, string> = {}
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }
      const res = await fetch(`/api/lesson/comments/${comment.id}`, {
        method: 'DELETE',
        headers,
      })
      if (!res.ok) return
      onRefresh()
    } finally {
      setDelBusy(false)
    }
  }

  return (
    <div className={isNested ? 'ml-6 mt-3 space-y-3 border-l-2 border-border pl-4' : ''}>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
              aria-hidden
            >
              <span className="text-xs font-semibold">{avatarInitial(comment)}</span>
            </div>
            <div className="min-w-0">
              <span className="font-medium text-foreground">{displayName(comment)}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                <time dateTime={comment.createdAt}>{formatRelativeTime(comment.createdAt)}</time>
              </span>
            </div>
          </div>
          {isMine ? (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={delBusy}
              className="shrink-0 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
              aria-label="Delete comment"
            >
              {delBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          ) : null}
        </div>

        {editing ? (
          <div className="mt-3 space-y-2">
            <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} maxLength={4000} />
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={() => void saveEdit()} disabled={saveBusy || !editText.trim()}>
                {saveBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(false)
                  setEditText(comment.content)
                }}
                disabled={saveBusy}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{comment.content}</p>
        )}

        {!editing ? (
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => void handleLike()}
              disabled={likeBusy}
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
              aria-pressed={likedLocal}
            >
              <Heart
                className={`h-3.5 w-3.5 ${likedLocal ? 'fill-primary text-primary' : ''}`}
                aria-hidden
              />
              {likesLocal > 0 ? <span>{likesLocal}</span> : null}
            </button>

            <button
              type="button"
              onClick={() => setReplyOpen((o) => !o)}
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              <span>Reply</span>
            </button>

            {isMine ? (
              <button
                type="button"
                onClick={() => {
                  setEditText(comment.content)
                  setEditing(true)
                }}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Edit comment"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {replyOpen ? (
        <div className="mt-3 ml-8">
          <CommentForm
            lessonId={lessonId}
            parentCommentId={comment.id}
            isReply
            submitLabel="Reply"
            placeholder="Write a reply…"
            onPosted={() => {
              setReplyOpen(false)
              onRefresh()
            }}
            onCancel={() => setReplyOpen(false)}
          />
        </div>
      ) : null}

      {replies.map((r) => (
        <CommentItem
          key={r.id}
          comment={r}
          lessonId={lessonId}
          childMap={childMap}
          currentUserId={currentUserId}
          depth={depth + 1}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  )
}

export default CommentItem
export { CommentItem }
