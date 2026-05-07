import type { DailyLesson } from '@/lib/lessonContent'
import { isValidYoutubeUrl } from '@/utils/urlValidation'

/** Pick primary lesson media + optional second audio (e.g. video + separate MP3). */
export function inferMediaFromAudioVideoUrls(
  audioUrl: string | null | undefined,
  videoUrl: string | null | undefined,
): Pick<DailyLesson, 'media_type' | 'media_url' | 'secondary_audio_url'> {
  const a = audioUrl?.trim() ?? ''
  const v = videoUrl?.trim() ?? ''

  if (v && isValidYoutubeUrl(v)) {
    return {
      media_type: 'youtube',
      media_url: v,
      secondary_audio_url: a || null,
    }
  }
  if (v) {
    return {
      media_type: 'video',
      media_url: v,
      secondary_audio_url: a || null,
    }
  }
  if (a) {
    return {
      media_type: 'audio',
      media_url: a,
      secondary_audio_url: null,
    }
  }
  return {
    media_type: null,
    media_url: null,
    secondary_audio_url: null,
  }
}
