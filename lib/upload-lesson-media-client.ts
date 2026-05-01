'use client'

import { humanizeStorageUploadError } from '@/lib/storage-upload-errors'
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
    throw new Error(
      humanizeStorageUploadError(json.error || `Upload setup failed (${res.status})`),
    )
  }
  if (!json.path) {
    throw new Error('Invalid response from server')
  }

  if (json.resumable) {
    if (!json.token) {
      throw new Error('Invalid response from server')
    }
    const signedUploadToken = json.token
    const { Upload } = await import('tus-js-client')
    const projectRef = parseSupabaseProjectRef()
    const endpoint = `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable/sign`
    const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
    if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.')

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
          apikey: anonKey,
          'x-signature': signedUploadToken,
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
        onProgress: (uploaded, total) => {
          const t =
            total && total > 0 ? total : totalKnown > 0 ? totalKnown : (total ?? 0)
          emit(uploaded, t)
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : String(err)
          reject(new Error(humanizeStorageUploadError(msg)))
        },
        onSuccess: () => {
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
    if (uploadError) {
      throw new Error(humanizeStorageUploadError(uploadError.message))
    }
    args.onProgress?.({
      pct: 100,
      uploadedBytes: args.file.size,
      totalBytes: Math.max(1, args.file.size),
    })
  }

  const { data: urlData } = supabase.storage.from(LESSON_MEDIA_BUCKET_ID).getPublicUrl(json.path)
  return { path: json.path, publicUrl: urlData.publicUrl }
}

