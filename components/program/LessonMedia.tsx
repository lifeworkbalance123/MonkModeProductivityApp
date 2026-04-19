'use client'

import { PU } from '@/lib/program-ui-tokens'

type LessonMediaProps = {
  mediaType: string | null | undefined
  mediaUrl: string | null | undefined
}

function getYouTubeId(url: string) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtu\.be\/([^?\s]+)/,
    /youtube\.com\/embed\/([^?\s]+)/,
    /youtube\.com\/shorts\/([^?\s]+)/,
  ]
  for (const p of patterns) {
    const match = url.match(p)
    if (match) return match[1]
  }
  return null
}

export default function LessonMedia({ mediaType, mediaUrl }: LessonMediaProps) {
  if (!mediaType || !mediaUrl) return null

  if (mediaType === 'youtube') {
    const videoId = getYouTubeId(mediaUrl)
    if (!videoId) return null

    return (
      <div
        style={{
          position: 'relative',
          paddingBottom: '56.25%',
          height: 0,
          overflow: 'hidden',
          borderRadius: '10px',
          marginBottom: '16px',
          background: '#000',
        }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title="Lesson video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </div>
    )
  }

  if (mediaType === 'audio') {
    return (
      <div
        style={{
          background: PU.bg,
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '16px',
          border: `1px solid ${PU.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{ fontSize: '20px' }}>🎵</span>
          <span style={{ color: PU.mutedFg, fontSize: '13px' }}>Listen to today&apos;s lesson</span>
        </div>
        <audio controls style={{ width: '100%', height: '40px', accentColor: PU.primary }}>
          <source src={mediaUrl} type="audio/mpeg" />
          Your browser does not support audio playback.
        </audio>
      </div>
    )
  }

  if (mediaType === 'video') {
    return (
      <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '16px', background: '#000' }}>
        <video controls style={{ width: '100%', maxHeight: '400px', display: 'block' }} playsInline>
          <source src={mediaUrl} type="video/mp4" />
          Your browser does not support video playback.
        </video>
      </div>
    )
  }

  if (mediaType === 'image') {
    return (
      <div
        style={{
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '16px',
          border: `1px solid ${PU.border}`,
          background: PU.bg,
          aspectRatio: '16 / 9',
          maxHeight: 'min(56vh, 420px)',
        }}
      >
        <img
          src={mediaUrl}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
    )
  }

  return null
}
