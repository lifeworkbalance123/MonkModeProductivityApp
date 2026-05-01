/** Turn Supabase Storage / tus-js-client errors into short, actionable admin copy. */
export function humanizeStorageUploadError(raw: string): string {
  const s = raw.trim()
  if (/413|Maximum size exceeded|max(imum)?\s+size/i.test(s)) {
    return [
      'This file is larger than your Supabase project’s Storage upload limit.',
      'In Supabase: Project Settings → Storage → raise “Global file size limit” above this file’s size (the bucket can allow more, but the project-wide cap still applies).',
      'Or use a smaller MP3 (lower bitrate / shorter length).',
    ].join(' ')
  }
  if (/Invalid Compact JWS/i.test(s)) {
    return [
      'Storage rejected the auth token on upload.',
      'Deploy the latest app (signed resumable uploads) or confirm NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY match this Supabase project.',
    ].join(' ')
  }
  return s
}
