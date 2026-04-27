'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  DEEP_WORK_INTRO_KEY,
  DEEP_WORK_MP3_KEYS,
  parseDeepWorkRows,
  type DeepWorkCmsState,
} from '@/lib/deep-work-site-settings'

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.access_token) return session.access_token
  const { data } = await supabase.auth.refreshSession()
  return data.session?.access_token ?? null
}

function isLikelyMp3(file: File): boolean {
  if (file.name.toLowerCase().endsWith('.mp3')) return true
  const t = (file.type || '').toLowerCase()
  return (
    t.includes('mpeg') ||
    t === 'audio/mp3' ||
    t === 'audio/x-mpeg' ||
    t === '' /* some browsers omit type */
  )
}

export default function AdminDeepWorkPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [intro, setIntro] = useState('')
  const [tracks, setTracks] = useState<DeepWorkCmsState['tracks']>([])
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const fileRefMap = useRef<Record<number, HTMLInputElement | null>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value, media_url, media_storage_path, is_active')
      .in('key', [DEEP_WORK_INTRO_KEY, ...DEEP_WORK_MP3_KEYS])

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }
    const parsed = parseDeepWorkRows(data ?? [])
    setIntro(parsed.introText)
    setTracks(parsed.tracks)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function saveIntro() {
    setSaving(true)
    setMessage(null)
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          value: intro,
          updated_at: new Date().toISOString(),
        })
        .eq('key', DEEP_WORK_INTRO_KEY)
      if (error) throw error
      setMessage('Saved intro text.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function uploadMp3(slotIndex: number, file: File) {
    if (!isLikelyMp3(file)) {
      setMessage('Please choose an MP3 file.')
      return
    }
    // Keep this aligned with bucket config (50 MiB) and avoid silent failures.
    const MAX_BYTES = 50 * 1024 * 1024
    if (file.size > MAX_BYTES) {
      setMessage('That MP3 is too large (max 50MB).')
      return
    }
    const key = DEEP_WORK_MP3_KEYS[slotIndex]
    setUploadingSlot(slotIndex)
    setMessage(null)
    try {
      const token = await getAccessToken()
      if (!token) {
        setMessage('Sign in again to upload (no session).')
        return
      }

      const label = tracks[slotIndex]?.label?.trim() || `Track ${slotIndex + 1}`
      const bucket = 'lesson-media'
      const safe = file.name.replace(/[^\w.\-]+/g, '_')
      let uploadPath = `deep-work/${key}-${Date.now()}-${safe}`

      // Prefer direct-to-storage upload (avoids host request size limits).
      // If policies/env are misconfigured, fall back to the server route.
      const prevPath = tracks[slotIndex]?.storagePath ?? null
      if (prevPath) {
        await supabase.storage.from(bucket).remove([prevPath])
      }

      const { error: upErr } = await supabase.storage.from(bucket).upload(uploadPath, file, {
        cacheControl: '3600',
        contentType: 'audio/mpeg',
        upsert: false,
      })

      let publicUrl: string | null = null
      if (!upErr) {
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(uploadPath)
        publicUrl = pub.publicUrl ?? null

        // Persist metadata with service role — anon client upsert often fails for new slot
        // keys (INSERT under RLS) even when storage upload succeeds.
        const commitRes = await fetch('/api/admin/deep-work/commit-track', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slot: slotIndex,
            label,
            publicUrl,
            storagePath: uploadPath,
            isActive: tracks[slotIndex]?.isActive !== false,
          }),
        })
        const commitPayload = (await commitRes.json().catch(() => ({}))) as { error?: string }
        if (!commitRes.ok) {
          await supabase.storage.from(bucket).remove([uploadPath])
          setMessage(commitPayload.error ?? `Save failed (${commitRes.status})`)
          return
        }
      } else {
        // Fallback: server-side upload (service role) when client policies fail.
        const fd = new FormData()
        fd.set('slot', String(slotIndex))
        fd.set('file', file)
        fd.set('label', label)

        const res = await fetch('/api/admin/deep-work/upload-audio', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        })
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string
          publicUrl?: string
          storagePath?: string
        }
        if (!res.ok) {
          setMessage(payload.error ?? `Upload failed (${res.status})`)
          return
        }
        publicUrl = payload.publicUrl ?? null
        const serverPath = payload.storagePath ?? null
        if (!publicUrl || !serverPath) {
          setMessage('Upload succeeded but response was incomplete. Refresh the page.')
          return
        }
        // For consistency with the state update below.
        uploadPath = serverPath
      }

      if (!publicUrl) {
        setMessage('Upload succeeded but no public URL was returned. Refresh the page.')
        return
      }

      setTracks((prev) => {
        const next = [...prev]
        next[slotIndex] = {
          ...next[slotIndex],
          key,
          url: publicUrl,
          storagePath: uploadPath,
        }
        return next
      })
      setMessage(`Uploaded ${key}.`)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploadingSlot(null)
    }
  }

  async function clearMp3(slotIndex: number) {
    const key = DEEP_WORK_MP3_KEYS[slotIndex]
    setMessage(null)
    try {
      const token = await getAccessToken()
      if (!token) {
        setMessage('Sign in again to remove the file.')
        return
      }

      const res = await fetch('/api/admin/deep-work/clear-audio', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slot: slotIndex }),
      })
      const payload = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setMessage(payload.error ?? `Remove failed (${res.status})`)
        return
      }
      setTracks((prev) => {
        const next = [...prev]
        next[slotIndex] = {
          ...next[slotIndex],
          url: null,
          storagePath: null,
        }
        return next
      })
      setMessage('Removed audio file.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Remove failed')
    }
  }

  async function saveTrackLabel(slotIndex: number) {
    const key = DEEP_WORK_MP3_KEYS[slotIndex]
    const label = tracks[slotIndex]?.label?.trim() || `Track ${slotIndex + 1}`
    setSaving(true)
    setMessage(null)
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          value: label,
          updated_at: new Date().toISOString(),
        })
        .eq('key', key)
      if (error) throw error
      setMessage('Saved track label.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function saveSlotActive(slotIndex: number, isActive: boolean) {
    const key = DEEP_WORK_MP3_KEYS[slotIndex]
    const label = tracks[slotIndex]?.label?.trim() || `Track ${slotIndex + 1}`
    setSaving(true)
    setMessage(null)
    try {
      const { data: existing, error: selErr } = await supabase
        .from('site_settings')
        .select('key')
        .eq('key', key)
        .maybeSingle()
      if (selErr) throw selErr

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('key', key)
        if (error) throw error
      } else {
        const { error } = await supabase.from('site_settings').insert({
          key,
          value: label,
          media_type: null,
          media_url: null,
          media_storage_path: null,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        if (error) throw error
      }
      setMessage(isActive ? 'Track is live on the Focus page.' : 'Track hidden from the Focus page.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed')
      setTracks((prev) => {
        const next = [...prev]
        next[slotIndex] = { ...next[slotIndex], isActive: !isActive }
        return next
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-muted-foreground">
        Loading…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6 text-foreground">
      <div>
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Deep Work (Focus page)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Intro copy and up to eight MP3 ambient tracks for the Deep Work fullscreen player. MP3s are stored in the{' '}
          <code className="rounded bg-muted px-1 text-xs">lesson-media</code> bucket via a server-side upload (same
          admin rules as the rest of the admin panel).
        </p>
      </div>

      {message ? (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground">{message}</p>
      ) : null}

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-medium">Intro text</h2>
        <p className="text-xs text-muted-foreground">
          Shown on the Focus page under &quot;Deep Work Mode&quot; and in the fullscreen ambient panel. Use line breaks for paragraphs.
        </p>
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          placeholder="Optional. E.g. guidance for your community before they start a sprint."
        />
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveIntro()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save intro'}
        </button>
      </section>

      <section className="space-y-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-medium">Ambient MP3 tracks (8 slots)</h2>
        <p className="text-xs text-muted-foreground">
          MP3 only. Users only see tracks that have an uploaded file and &quot;Live on Focus page&quot; enabled. Slots
          without audio never appear in the app.
        </p>

        {DEEP_WORK_MP3_KEYS.map((slotKey, i) => (
          <div key={slotKey} className="space-y-2 border-b border-border pb-6 last:border-0 last:pb-0">
            <p className="text-sm font-medium">Slot {i + 1}</p>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={tracks[i]?.isActive !== false}
                onChange={(e) => {
                  const v = e.target.checked
                  setTracks((prev) => {
                    const next = [...prev]
                    next[i] = { ...next[i], isActive: v }
                    return next
                  })
                  void saveSlotActive(i, v)
                }}
                disabled={saving}
              />
              <span>Live on Focus page</span>
            </label>
            <label className="block text-xs text-muted-foreground">
              Button label
              <input
                type="text"
                value={tracks[i]?.label ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  setTracks((prev) => {
                    const next = [...prev]
                    next[i] = { ...next[i], label: v }
                    return next
                  })
                }}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder={`Track ${i + 1}`}
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={(el) => {
                  fileRefMap.current[i] = el
                }}
                type="file"
                accept="audio/mpeg,audio/mp3,.mp3"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (f) void uploadMp3(i, f)
                }}
              />
              <button
                type="button"
                disabled={uploadingSlot === i}
                onClick={() => fileRefMap.current[i]?.click()}
                className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm hover:bg-secondary/80 disabled:opacity-50"
              >
                {uploadingSlot === i ? 'Uploading…' : tracks[i]?.url ? 'Replace MP3' : 'Upload MP3'}
              </button>
              {tracks[i]?.url ? (
                <>
                  <audio controls src={tracks[i].url} className="h-8 max-w-[200px] md:max-w-xs" />
                  <button
                    type="button"
                    onClick={() => void clearMp3(i)}
                    className="text-sm text-destructive hover:underline"
                  >
                    Remove file
                  </button>
                </>
              ) : null}
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveTrackLabel(i)}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Save label only
            </button>
          </div>
        ))}
      </section>
    </div>
  )
}
