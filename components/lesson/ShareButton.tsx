'use client'

import { useCallback, useState } from 'react'
import { Share2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { withAuthStorageLockRetry } from '@/lib/authStorageLock'
import { useToast } from '@/context/ToastContext'

export type ShareButtonProps = {
  lessonId: string
  /** Pretty URL `/lesson?program=&day=` when both are set; otherwise `/lesson?id=`. */
  programType?: string | null
  day?: number | null
  className?: string
}

function buildShareUrl(
  lessonId: string,
  programType: string | null | undefined,
  day: number | null | undefined,
): string {
  if (typeof window === 'undefined') return ''
  const u = new URL('/lesson', window.location.origin)
  const p = programType?.trim() ?? ''
  const d = day != null && Number.isFinite(day) ? Math.floor(day) : NaN
  if (p && d >= 1) {
    u.searchParams.set('program', p)
    u.searchParams.set('day', String(d))
  } else {
    u.searchParams.set('id', lessonId)
  }
  return u.toString()
}

export default function ShareButton({ lessonId, programType, day, className }: ShareButtonProps) {
  const { showToast } = useToast()
  const [showTooltip, setShowTooltip] = useState(false)

  const handleShare = useCallback(async () => {
    const url = buildShareUrl(lessonId, programType, day)
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setShowTooltip(true)
      setTimeout(() => setShowTooltip(false), 2000)

      const {
        data: { session },
      } = await withAuthStorageLockRetry(() => supabase.auth.getSession())
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }
      void fetch('/api/lesson/share', {
        method: 'POST',
        headers,
        body: JSON.stringify({ lessonId }),
      }).catch(() => {})
    } catch {
      showToast('Could not copy link', 'error')
    }
  }, [lessonId, programType, day, showToast])

  return (
    <div className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => void handleShare()}
        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Share2 className="h-4 w-4 shrink-0" aria-hidden />
        <span>Share</span>
      </button>
      {showTooltip ? (
        <div
          role="status"
          className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md ring-1 ring-border"
        >
          Link copied!
        </div>
      ) : null}
    </div>
  )
}

export { ShareButton }
