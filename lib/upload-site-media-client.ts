'use client'

import { humanizeStorageUploadError } from '@/lib/storage-upload-errors'
import { supabase } from '@/lib/supabase'
import { SITE_MEDIA_BUCKET_ID } from '@/lib/site-media-storage'

/** Supabase recommends resumable uploads above ~6 MB; single-request uploads often fail or stall beyond that. */
export const SITE_MEDIA_RESUMABLE_THRESHOLD_BYTES = 6 * 1024 * 1024

export type SiteMediaUploadPrefix = 'hero' | 'rhythm'

function parseSupabaseProjectRef(): string {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const m = url.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i)
  if (!m) throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing or invalid.')
  return m[1]
}

async function uploadViaTus(file: File, objectPath: string, signedUploadToken: string): Promise<void> {
  const { Upload } = await import('tus-js-client')
  const projectRef = parseSupabaseProjectRef()
  const endpoint = `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable/sign`
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
  if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.')

  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
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
        bucketName: SITE_MEDIA_BUCKET_ID,
        objectName: objectPath,
        contentType: file.type || 'video/mp4',
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024,
      onError: (err) => {
        const msg = err instanceof Error ? err.message : String(err)
        reject(new Error(humanizeStorageUploadError(msg)))
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

export async function uploadSiteMediaWithAdminSession(
  file: File,
  prefix: SiteMediaUploadPrefix,
  removePath: string | null,
): Promise<{ path: string; publicUrl: string }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData.session
  if (!session?.access_token) {
    throw new Error('Not signed in. Refresh the page and sign in again.')
  }

  const preferResumable = file.size > SITE_MEDIA_RESUMABLE_THRESHOLD_BYTES

  const res = await fetch('/api/admin/site-media/signed-upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      prefix,
      originalFileName: file.name,
      removePath: removePath || undefined,
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
    await uploadViaTus(file, json.path, json.token)
  } else {
    if (!json.token) {
      throw new Error('Invalid response from server')
    }
    const { error: uploadError } = await supabase.storage.from(SITE_MEDIA_BUCKET_ID).uploadToSignedUrl(
      json.path,
      json.token,
      file,
      {
        cacheControl: '3600',
        contentType: file.type || undefined,
        upsert: true,
      },
    )
    if (uploadError) {
      throw new Error(humanizeStorageUploadError(uploadError.message))
    }
  }

  const { data: urlData } = supabase.storage.from(SITE_MEDIA_BUCKET_ID).getPublicUrl(json.path)
  return { path: json.path, publicUrl: urlData.publicUrl }
}
