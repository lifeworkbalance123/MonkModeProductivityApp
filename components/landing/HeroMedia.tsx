'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type HeroMediaData = {
  mediaType: 'youtube' | 'image' | 'video' | null
  mediaUrl: string | null
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

function StaticMockup() {
  return (
    <div
      style={{
        background: '#1E293B',
        borderRadius: '16px',
        margin: '16px',
        padding: '28px',
        width: 'calc(100% - 32px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
        <div
          style={{
            background: '#F59E0B',
            borderRadius: '10px',
            padding: '16px 20px',
            minWidth: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <p style={{ color: '#000', fontSize: '22px', fontWeight: '800', margin: 0, lineHeight: 1 }}>34 Day</p>
          <p style={{ color: '#000', fontSize: '14px', fontWeight: '600', margin: '4px 0 0', opacity: 0.8 }}>
            Streak
          </p>
        </div>
        <div style={{ background: '#0F172A', borderRadius: '10px', padding: '14px 16px', flex: 1 }}>
          <p style={{ color: 'white', fontSize: '14px', fontWeight: '600', margin: '0 0 6px' }}>Habits</p>
          <p style={{ color: '#64748B', fontSize: '12px', margin: 0, lineHeight: '1.6' }}>
            Done Exercise · Done Read · Plan · Meditate
          </p>
        </div>
      </div>

      <div style={{ background: '#0F172A', borderRadius: '10px', padding: '14px 16px' }}>
        <p style={{ color: 'white', fontSize: '14px', fontWeight: '600', margin: '0 0 10px' }}>Time Schedule</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ height: '8px', flex: 2, background: '#F59E0B', borderRadius: '4px' }} />
          <div style={{ height: '8px', flex: 2, background: '#3B82F6', borderRadius: '4px' }} />
          <div style={{ height: '8px', flex: 2, background: '#10B981', borderRadius: '4px' }} />
          <div style={{ height: '8px', flex: 1, background: '#334155', borderRadius: '4px' }} />
        </div>
      </div>

      <div style={{ background: '#0F172A', borderRadius: '10px', padding: '14px 16px' }}>
        <p style={{ color: 'white', fontSize: '14px', fontWeight: '600', margin: '0 0 10px' }}>Today&apos;s Goals</p>
        {[
          { label: 'Write 1,000 words', done: true },
          { label: 'Review proposal', done: true },
          { label: 'Deep work session', done: false },
        ].map((goal) => (
          <div key={goal.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: goal.done ? '#F59E0B' : '#334155',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                color: '#000',
              }}
            >
              {goal.done ? '✓' : ''}
            </div>
            <span
              style={{
                color: goal.done ? '#94A3B8' : 'white',
                fontSize: '12px',
                textDecoration: goal.done ? 'line-through' : 'none',
              }}
            >
              {goal.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HeroMedia() {
  const [media, setMedia] = useState<HeroMediaData>({ mediaType: null, mediaUrl: null })
  const [loading, setLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [volume, setVolume] = useState(1)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    async function fetchHeroMedia() {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('media_type, media_url')
          .eq('key', 'hero_media')
          .single()

        if (data) {
          setMedia({
            mediaType: (data.media_type as HeroMediaData['mediaType']) ?? null,
            mediaUrl: (data.media_url as string | null) ?? null,
          })
        }
      } catch {
        // Fallback to static mockup
      } finally {
        setLoading(false)
      }
    }
    void fetchHeroMedia()
  }, [])

  useEffect(() => {
    if (!videoRef.current) return
    videoRef.current.muted = isMuted
    videoRef.current.volume = volume
  }, [isMuted, volume, media.mediaUrl])

  const frameStyle = {
    background: '#0F172A',
    borderRadius: '20px',
    overflow: 'hidden',
    width: '100%',
    border: '1px solid #1E293B',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
    minHeight: '380px',
    display: 'flex',
    alignItems: 'stretch',
  } as const

  if (loading) {
    return (
      <div style={frameStyle}>
        <div
          style={{
            flex: 1,
            background: '#1E293B',
            borderRadius: '16px',
            margin: '16px',
            animation: 'pulse 2s infinite',
          }}
        />
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  if (!media.mediaType || !media.mediaUrl) {
    return (
      <div style={frameStyle}>
        <StaticMockup />
      </div>
    )
  }

  if (media.mediaType === 'youtube') {
    const videoId = getYouTubeId(media.mediaUrl)
    if (!videoId) {
      return (
        <div style={frameStyle}>
          <StaticMockup />
        </div>
      )
    }
    return (
      <div style={frameStyle}>
        <div
          style={{
            position: 'relative',
            paddingBottom: '62.5%',
            height: 0,
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&color=white`}
            title="monkcubed demo"
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
      </div>
    )
  }

  if (media.mediaType === 'image') {
    return (
      <div style={frameStyle}>
        <img
          src={media.mediaUrl}
          alt="monkcubed app preview"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top left',
            display: 'block',
            minHeight: '380px',
          }}
        />
      </div>
    )
  }

  if (media.mediaType === 'video') {
    return (
      <div style={{ ...frameStyle, position: 'relative' }}>
        <video
          ref={videoRef}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          style={{
            width: '100%',
            minHeight: '380px',
            objectFit: 'cover',
            display: 'block',
          }}
        >
          <source src={media.mediaUrl} type="video/mp4" />
        </video>
        <div
          style={{
            position: 'absolute',
            right: '12px',
            bottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(2, 6, 23, 0.72)',
            border: '1px solid rgba(148, 163, 184, 0.35)',
            borderRadius: '999px',
            padding: '8px 10px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <button
            onClick={() => setIsMuted((prev) => !prev)}
            aria-label={isMuted ? 'Unmute hero video' : 'Mute hero video'}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              padding: 0,
              lineHeight: 1,
            }}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              const next = Number(e.target.value)
              setVolume(next)
              setIsMuted(next === 0)
              if (videoRef.current) {
                videoRef.current.volume = next
                if (next > 0) videoRef.current.muted = false
              }
            }}
            aria-label="Hero video volume"
            style={{ width: '84px', accentColor: '#F59E0B', cursor: 'pointer' }}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={frameStyle}>
      <StaticMockup />
    </div>
  )
}
