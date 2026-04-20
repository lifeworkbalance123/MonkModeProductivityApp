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

const BUCKET = 'lesson-media'

export default function AdminDeepWorkPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [intro, setIntro] = useState('')
  const [tracks, setTracks] = useState<DeepWorkCmsState['tracks']>([])
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const fileRef0 = useRef<HTMLInputElement>(null)
  const fileRef1 = useRef<HTMLInputElement>(null)
  const fileRef2 = useRef<HTMLInputElement>(null)
  const fileRefs = [fileRef0, fileRef1, fileRef2] as const

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value, media_url, media_storage_path')
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
    if (!file.type.includes('mpeg') && !file.name.toLowerCase().endsWith('.mp3')) {
      setMessage('Please choose an MP3 file.')
      return
    }
    const key = DEEP_WORK_MP3_KEYS[slotIndex]
    setUploadingSlot(slotIndex)
    setMessage(null)
    try {
      const prevPath = tracks[slotIndex]?.storagePath
      if (prevPath) {
        await supabase.storage.from(BUCKET).remove([prevPath])
      }

      const safe = file.name.replace(/[^\w.\-]+/g, '_')
      const path = `deep-work/${key}-${Date.now()}-${safe}`
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        contentType: 'audio/mpeg',
        upsert: false,
      })
      if (upErr) throw upErr

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const publicUrl = pub.publicUrl

      const label = tracks[slotIndex]?.label?.trim() || `Track ${slotIndex + 1}`

      const { error: dbErr } = await supabase.from('site_settings').upsert(
        {
          key,
          value: label,
          media_type: 'audio',
          media_url: publicUrl,
          media_storage_path: path,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      )
      if (dbErr) throw dbErr

      setTracks((prev) => {
        const next = [...prev]
        next[slotIndex] = {
          ...next[slotIndex],
          key,
          url: publicUrl,
          storagePath: path,
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
    const prevPath = tracks[slotIndex]?.storagePath
    setMessage(null)
    try {
      if (prevPath) {
        await supabase.storage.from(BUCKET).remove([prevPath])
      }
      const label = tracks[slotIndex]?.label?.trim() || `Track ${slotIndex + 1}`
      const { error } = await supabase.from('site_settings').upsert(
        {
          key,
          value: label,
          media_type: null,
          media_url: null,
          media_storage_path: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      )
      if (error) throw error
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
          Intro copy and up to three MP3 ambient tracks for the Deep Work fullscreen player. Files upload to the{' '}
          <code className="rounded bg-muted px-1 text-xs">lesson-media</code> bucket.
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
        <h2 className="text-lg font-medium">Ambient MP3 tracks (3 slots)</h2>
        <p className="text-xs text-muted-foreground">
          MP3 only. Users pick these in Deep Work fullscreen next to Rain / Ocean / White noise. Leave a slot empty to hide it.
        </p>

        {[0, 1, 2].map((i) => (
          <div key={DEEP_WORK_MP3_KEYS[i]} className="space-y-2 border-b border-border pb-6 last:border-0 last:pb-0">
            <p className="text-sm font-medium">Slot {i + 1}</p>
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
                ref={fileRefs[i]}
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
                onClick={() => fileRefs[i].current?.click()}
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
