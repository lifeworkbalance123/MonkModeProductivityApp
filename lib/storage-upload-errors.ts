/** Turn Supabase Storage / tus-js-client errors into short, actionable admin copy. */
export function humanizeStorageUploadError(raw: string): string {
  const s = raw.trim()
  if (/413|Maximum size exceeded|max(imum)?\s+size/i.test(s)) {
    return [
      'This file is larger than your Supabase project’s Storage upload limit.',
      'Dashboard: Storage → Storage settings → set “Global file size limit” at least to this file’s size; per-bucket limits cannot exceed that global cap.',
      'On the Free plan Supabase caps a single upload at 50 MB—if your MP3 is larger, compress it (lower bitrate / shorter) or upgrade. Pro+ allows much higher limits.',
      'Details: https://supabase.com/docs/guides/storage/uploads/file-limits',
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
