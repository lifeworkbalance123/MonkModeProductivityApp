import { youtubeEmbedFromUrl } from '@/lib/morning-video'

/**
 * Validates if a given URL is a valid YouTube video URL.
 *
 * Supports common YouTube URL formats:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://www.youtube.com/embed/dQw4w9WgXcQ
 * - https://m.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtube.com/shorts/dQw4w9WgXcQ
 */
export const isValidYoutubeUrl = (url: string): boolean => {
  return youtubeEmbedFromUrl(url) !== null
}

/** Extract the 11-char YouTube video id or null. */
export const extractYoutubeVideoId = (url: string): string | null => {
  const embed = youtubeEmbedFromUrl(url)
  if (!embed) return null
  const m = embed.match(/\/embed\/([^/?]+)/)
  return m?.[1] ?? null
}

/** Convert any valid YouTube URL to a standard embed URL, or null if invalid. */
export const getYoutubeEmbedUrl = (url: string): string | null => {
  return youtubeEmbedFromUrl(url)
}

/** Normalize a YouTube URL to a standard watch URL format, or null if invalid. */
export const getYoutubeWatchUrl = (url: string): string | null => {
  const id = extractYoutubeVideoId(url)
  if (!id) return null
  return `https://www.youtube.com/watch?v=${id}`
}

/** Get a YouTube thumbnail URL for the given video URL, or null if invalid. */
export const getYoutubeThumbnail = (
  url: string,
  quality: 'default' | 'mqdefault' | 'hqdefault' | 'maxresdefault' = 'mqdefault',
): string | null => {
  const id = extractYoutubeVideoId(url)
  if (!id) return null
  const qualityMap: Record<typeof quality, string> = {
    default: 'default.jpg',
    mqdefault: 'mqdefault.jpg',
    hqdefault: 'hqdefault.jpg',
    maxresdefault: 'maxresdefault.jpg',
  }
  return `https://img.youtube.com/vi/${id}/${qualityMap[quality]}`
}

/** User-friendly validation error message. */
export const getYoutubeValidationError = (url: string): string => {
  if (!url || url.trim() === '') return 'Please enter a YouTube URL'
  if (!isValidYoutubeUrl(url)) {
    return 'Please enter a valid YouTube URL (e.g., https://youtu.be/... or https://www.youtube.com/watch?v=...)'
  }
  return ''
}

