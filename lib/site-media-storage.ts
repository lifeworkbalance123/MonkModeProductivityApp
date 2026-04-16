/**
 * Shared limits for the `site-media` bucket (landing hero / rhythm uploads).
 *
 * Set `SITE_MEDIA_MAX_UPLOAD_BYTES` (integer, bytes) on the server to override the default.
 * The Supabase dashboard also has a project-level max upload size that can override bucket limits.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

const FIVE_GIB = 5 * 1024 * 1024 * 1024

export const SITE_MEDIA_BUCKET_ID = 'site-media'

export const SITE_MEDIA_ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
] as const

export function getSiteMediaMaxUploadBytes(): number {
  const raw = process.env.SITE_MEDIA_MAX_UPLOAD_BYTES?.trim()
  if (raw) {
    const n = Number.parseInt(raw, 10)
    if (Number.isFinite(n) && n > 0) return n
  }
  return FIVE_GIB
}

export function getSiteMediaBucketOptions() {
  return {
    public: true,
    allowedMimeTypes: [...SITE_MEDIA_ALLOWED_MIME_TYPES],
    fileSizeLimit: getSiteMediaMaxUploadBytes(),
  }
}

/** Bucket update without a per-bucket byte cap (defers to the project “Global file size limit” in Supabase). */
export function getSiteMediaBucketOptionsMinimal() {
  return {
    public: true,
    allowedMimeTypes: [...SITE_MEDIA_ALLOWED_MIME_TYPES],
  }
}

function isDuplicateBucketMessage(msg: string) {
  return /already exists|duplicate/i.test(msg)
}

/** Supabase rejects raising bucket file_size_limit above the project global cap; message varies by version. */
export function looksLikeStorageSizePolicyError(msg: string) {
  return /maximum allowed size|exceeded|global|file.?size|limit|too large/i.test(msg)
}

/**
 * Create or update `site-media`. If the API rejects our desired fileSizeLimit (above project global max),
 * fall back to a minimal update so uploads can still proceed within the global cap.
 */
export async function ensureSiteMediaBucket(admin: SupabaseClient): Promise<string | null> {
  const full = getSiteMediaBucketOptions()
  const minimal = getSiteMediaBucketOptionsMinimal()

  const { error: createErr } = await admin.storage.createBucket(SITE_MEDIA_BUCKET_ID, full)
  if (!createErr) return null

  if (isDuplicateBucketMessage(createErr.message)) {
    const { error: updateErr } = await admin.storage.updateBucket(SITE_MEDIA_BUCKET_ID, full)
    if (!updateErr) return null
    if (looksLikeStorageSizePolicyError(updateErr.message)) {
      const { error: e2 } = await admin.storage.updateBucket(SITE_MEDIA_BUCKET_ID, minimal)
      return e2?.message ?? null
    }
    return updateErr.message
  }

  if (looksLikeStorageSizePolicyError(createErr.message)) {
    const { error: retry } = await admin.storage.createBucket(SITE_MEDIA_BUCKET_ID, minimal)
    if (!retry) return null
    if (isDuplicateBucketMessage(retry.message)) {
      const { error: u2 } = await admin.storage.updateBucket(SITE_MEDIA_BUCKET_ID, minimal)
      return u2?.message ?? null
    }
    return retry.message
  }

  return createErr.message
}
