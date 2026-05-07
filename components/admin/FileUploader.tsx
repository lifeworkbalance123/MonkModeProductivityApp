'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'

export type FileUploaderProps = {
  /** Passed to `<input type="file" />` */
  accept: string
  /** Routes to `/api/admin/program-lessons/upload-media` (stores under `lesson-media`). */
  mediaType: 'audio' | 'video'
  label?: string
  onUploadComplete: (url: string) => void
  disabled?: boolean
  /** Optional class for the trigger button */
  buttonClassName?: string
}

/**
 * Admin upload to `lesson-media` via the server route (same bucket as daily program lessons).
 * Does not use separate `bonus-audio` / `bonus-video` buckets — paths are organized server-side.
 */
export function FileUploader({
  accept,
  mediaType,
  label = 'Upload',
  onUploadComplete,
  disabled,
  buttonClassName,
}: FileUploaderProps) {
  const { showToast } = useToast()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        showToast('Sign in again to upload.', 'error')
        return
      }
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', mediaType)
      const res = await fetch('/api/admin/program-lessons/upload-media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const json = (await res.json()) as { url?: string; error?: string }
      if (!res.ok) {
        showToast(json.error || 'Upload failed', 'error')
        return
      }
      if (!json.url) {
        showToast('Invalid upload response', 'error')
        return
      }
      onUploadComplete(json.url)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  const busy = disabled || uploading

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={busy}
        onChange={(e) => void onChange(e)}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={
          buttonClassName ??
          'rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60'
        }
      >
        {uploading ? 'Uploading…' : label}
      </button>
    </div>
  )
}
