/**
 * Shared limits for the `site-media` bucket (landing hero / rhythm uploads).
 *
 * Set `SITE_MEDIA_MAX_UPLOAD_BYTES` (integer, bytes) on the server to override the default.
 * The Supabase dashboard also has a project-level max upload size that can override bucket limits.
 */

const FIVE_GIB = 5 * 1024 * 1024 * 1024

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
