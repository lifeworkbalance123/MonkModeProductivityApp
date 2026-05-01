'use client'

import { supabase } from '@/lib/supabase'

const LESSON_MEDIA_BUCKET_ID = 'lesson-media'

/** Supabase recommends resumable uploads above ~6 MB; single-request uploads often fail or stall beyond that. */
export const LESSON_MEDIA_RESUMABLE_THRESHOLD_BYTES = 6 * 1024 * 1024

function parseSupabaseProjectRef(): string {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const m = url.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i)
  if (!m) throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing or invalid.')
  return m[1]
}

export type DeepWorkMp3UploadProgress = {
  /** 0–100 when total size is known; omitted when only bytes are known */
  pct?: number
  uploadedBytes: number
  totalBytes: number
}

export async function uploadDeepWorkMp3WithAdminSession(args: {
  file: File
  slotIndex: number
  removePath: string | null
  onProgress?: (p: DeepWorkMp3UploadProgress) => void
}): Promise<{ path: string; publicUrl: string }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData.session
  if (!session?.access_token) {
    throw new Error('Not signed in. Refresh the page and sign in again.')
  }

  const preferResumable = args.file.size > LESSON_MEDIA_RESUMABLE_THRESHOLD_BYTES

  const res = await fetch('/api/admin/deep-work/signed-upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      slot: args.slotIndex,
      originalFileName: args.file.name,
      removePath: args.removePath || undefined,
      preferResumable,
    }),
  })

  const json = (await res.json()) as {
    error?: string
    path?: string
    token?: string
    resumable?: boolean
  }

  if (!res.ok) {
    throw new Error(json.error || `Upload setup failed (${res.status})`)
  }
  if (!json.path) {
    throw new Error('Invalid response from server')
  }

  if (json.resumable) {
    const { Upload } = await import('tus-js-client')
    const projectRef = parseSupabaseProjectRef()
    const endpoint = `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`
    const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
    if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.')

    let token = session.access_token
    let refreshTimer: number | null = null
    const startTokenRefreshLoop = () => {
      if (typeof window === 'undefined') return
      refreshTimer = window.setInterval(() => {
        void (async () => {
          const { data } = await supabase.auth.getSession()
          const s = data.session
          if (!s) return
          const expiresAtMs = (s.expires_at ?? 0) * 1000
          if (expiresAtMs > 0 && expiresAtMs - Date.now() < 5 * 60 * 1000) {
            const { data: refreshed } = await supabase.auth.refreshSession()
            const next = refreshed.session?.access_token ?? null
            if (next) token = next
          } else {
            token = s.access_token
          }
        })()
      }, 2 * 60 * 1000)
    }

    const totalKnown = args.file.size > 0 ? args.file.size : 0
    const emit = (uploadedBytes: number, totalBytes: number) => {
      if (!args.onProgress) return
      const t = totalBytes > 0 ? totalBytes : totalKnown
      if (t > 0) {
        const pct = Math.max(0, Math.min(100, Math.round((uploadedBytes / t) * 100)))
        args.onProgress({ pct, uploadedBytes, totalBytes: t })
      } else {
        args.onProgress({ uploadedBytes, totalBytes: 0 })
      }
    }

    emit(0, totalKnown)

    await new Promise<void>((resolve, reject) => {
      const upload = new Upload(args.file, {
        endpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          authorization: `Bearer ${token}`,
          apikey: anonKey,
          'x-upsert': 'true',
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: LESSON_MEDIA_BUCKET_ID,
          objectName: json.path as string,
          contentType: args.file.type || 'audio/mpeg',
          cacheControl: '3600',
        },
        chunkSize: 6 * 1024 * 1024,
        onBeforeRequest: (req) => {
          req.setHeader('authorization', `Bearer ${token}`)
          req.setHeader('apikey', anonKey)
        },
        onProgress: (uploaded, total) => {
          const t =
            total && total > 0 ? total : totalKnown > 0 ? totalKnown : (total ?? 0)
          emit(uploaded, t)
        },
        onError: (err) => {
          if (refreshTimer) window.clearInterval(refreshTimer)
          reject(err instanceof Error ? err : new Error(String(err)))
        },
        onSuccess: () => {
          if (refreshTimer) window.clearInterval(refreshTimer)
          const t = totalKnown > 0 ? totalKnown : args.file.size
          if (t > 0) emit(t, t)
          else args.onProgress?.({ pct: 100, uploadedBytes: 0, totalBytes: 0 })
          resolve()
        },
      })
      void upload.findPreviousUploads().then((previousUploads) => {
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0])
        }
        startTokenRefreshLoop()
        upload.start()
      })
    })
  } else {
    if (!json.token) {
      throw new Error('Invalid response from server')
    }
    args.onProgress?.({
      pct: 0,
      uploadedBytes: 0,
      totalBytes: Math.max(0, args.file.size),
    })
    const { error: uploadError } = await supabase.storage
      .from(LESSON_MEDIA_BUCKET_ID)
      .uploadToSignedUrl(json.path, json.token, args.file, {
        cacheControl: '3600',
        contentType: args.file.type || 'audio/mpeg',
        upsert: true,
      })
    if (uploadError) throw uploadError
    args.onProgress?.({
      pct: 100,
      uploadedBytes: args.file.size,
      totalBytes: Math.max(1, args.file.size),
    })
  }

  const { data: urlData } = supabase.storage.from(LESSON_MEDIA_BUCKET_ID).getPublicUrl(json.path)
  return { path: json.path, publicUrl: urlData.publicUrl }
}

