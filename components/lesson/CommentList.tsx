'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { withAuthStorageLockRetry } from '@/lib/authStorageLock'
import type { LessonCommentApi } from '@/lib/lessonComments'
import { buildCommentReplyMap } from '@/lib/lessonComments'
import CommentItem from '@/components/lesson/CommentItem'
import CommentForm from '@/components/lesson/CommentForm'
import ShareButton from '@/components/lesson/ShareButton'

type CommentListProps = {
  lessonId: string | null
  /** For share links `/lesson?program=&day=`. */
  programType?: string | null
  day?: number | null
  /** When false, hide the share control (e.g. share page already has one next to the title). Default true. */
  showShare?: boolean
}

function CommentList({ lessonId, programType, day, showShare = true }: CommentListProps) {
  const [comments, setComments] = useState<LessonCommentApi[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [composeError, setComposeError] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    if (!lessonId) return
    setLoading(true)
    setError(null)
    try {
      const {
        data: { session },
      } = await withAuthStorageLockRetry(() => supabase.auth.getSession())
      const headers: Record<string, string> = {}
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }
      const res = await fetch(`/api/lesson/comments?lessonId=${encodeURIComponent(lessonId)}`, {
        headers,
      })
      const json = (await res.json().catch(() => ({}))) as {
        comments?: LessonCommentApi[]
        error?: string
      }
      if (!res.ok) {
        setError(json.error ?? 'Could not load comments.')
        setComments([])
        return
      }
      setComments(json.comments ?? [])
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  useEffect(() => {
    void fetchComments()
  }, [fetchComments])

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await withAuthStorageLockRetry(() => supabase.auth.getUser())
      setCurrentUserId(user?.id ?? null)
    })()
  }, [])

  const childMap = useMemo(() => buildCommentReplyMap(comments), [comments])
  const roots = childMap.get('__root__') ?? []

  const handlePostComment = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || !lessonId) return
      setPosting(true)
      setComposeError(null)
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
          body: JSON.stringify({ lessonId, content: trimmed }),
        })
        const json = (await res.json().catch(() => ({}))) as { error?: string }
        if (!res.ok) {
          setComposeError(json.error ?? 'Could not post comment.')
          return
        }
        setNewComment('')
        await fetchComments()
      } finally {
        setPosting(false)
      }
    },
    [lessonId, fetchComments],
  )

  if (!lessonId) {
    return null
  }

  return (
    <section className="mt-8 border-t border-border pt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">
          Discussions ({comments.length})
        </h3>
        {showShare ? (
          <ShareButton lessonId={lessonId} programType={programType ?? undefined} day={day ?? undefined} />
        ) : null}
      </div>

      <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Add a comment
        </p>
        <CommentForm
          value={newComment}
          onChange={setNewComment}
          onSubmit={(content) => void handlePostComment(content)}
          isSubmitting={posting}
          placeholder="Write a comment…"
          submitLabel="Post"
        />
        {composeError ? <p className="mt-2 text-sm text-destructive">{composeError}</p> : null}
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Loading comments…
          </div>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!loading && !error ? (
          roots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-1">
              {roots.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  lessonId={lessonId}
                  childMap={childMap}
                  currentUserId={currentUserId}
                  depth={0}
                  onRefresh={() => void fetchComments()}
                />
              ))}
            </div>
          )
        ) : null}
      </div>
    </section>
  )
}

export default CommentList
export { CommentList }
