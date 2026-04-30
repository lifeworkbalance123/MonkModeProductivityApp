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

async function uploadViaTus(file: File, objectPath: string, accessToken: string): Promise<void> {
  const { Upload } = await import('tus-js-client')
  const projectRef = parseSupabaseProjectRef()
  const endpoint = `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
  if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.')

  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
        'x-upsert': 'true',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: LESSON_MEDIA_BUCKET_ID,
        objectName: objectPath,
        contentType: file.type || 'audio/mpeg',
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024,
      onError: (err) => {
        reject(err instanceof Error ? err : new Error(String(err)))
      },
      onSuccess: () => resolve(),
    })
    void upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0])
      }
      upload.start()
    })
  })
}

export async function uploadDeepWorkMp3WithAdminSession(args: {
  file: File
  slotIndex: number
  removePath: string | null
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
    await uploadViaTus(args.file, json.path, session.access_token)
  } else {
    if (!json.token) {
      throw new Error('Invalid response from server')
    }
    const { error: uploadError } = await supabase.storage
      .from(LESSON_MEDIA_BUCKET_ID)
      .uploadToSignedUrl(json.path, json.token, args.file, {
        cacheControl: '3600',
        contentType: args.file.type || 'audio/mpeg',
        upsert: true,
      })
    if (uploadError) throw uploadError
  }

  const { data: urlData } = supabase.storage.from(LESSON_MEDIA_BUCKET_ID).getPublicUrl(json.path)
  return { path: json.path, publicUrl: urlData.publicUrl }
}

