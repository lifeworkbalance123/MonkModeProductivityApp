/** Row shape for `public.training_videos` (admin catalog + /videos). */
export type TrainingVideo = {
  id: string
  title: string
  description: string | null
  video_url: string
  category: string
  sort_order: number
  created_at: string
  updated_at: string
}

export function isValidHttpUrl(raw: string): boolean {
  const s = raw.trim()
  if (!s) return false
  try {
    const u = new URL(s)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}
