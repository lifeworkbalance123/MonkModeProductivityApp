'use client'

import { useEffect, useMemo } from 'react'
import { PU } from '@/lib/program-ui-tokens'
import { trainingAccentFromCategory } from '@/lib/training-palette'
import { getYouTubeId } from '@/lib/trainingContent'

type VideoModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  youtubeUrl: string
  duration: string
  category: string
}

export default function VideoModal({
  isOpen,
  onClose,
  title,
  description,
  youtubeUrl,
  duration,
  category,
}: VideoModalProps) {
  const videoId = getYouTubeId(youtubeUrl)
  const accent = useMemo(() => trainingAccentFromCategory(category), [category])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: PU.card,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '800px',
          border: `1px solid ${PU.border}`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: `1px solid ${PU.border}`,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
              }}
            >
              <span
                style={{
                  background: `color-mix(in srgb, ${accent} 22%, transparent)`,
                  color: accent,
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: '500',
                }}
              >
                {category}
              </span>
              <span style={{ color: PU.mutedFg, fontSize: '12px' }}>{duration}</span>
            </div>
            <h2 style={{ color: PU.fg, fontSize: '18px', fontWeight: '600', margin: 0 }}>{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: PU.muted,
              border: 'none',
              color: PU.mutedFg,
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginLeft: '16px',
            }}
          >
            ×
          </button>
        </div>

        {videoId ? (
          <div
            style={{
              position: 'relative',
              paddingBottom: '56.25%',
              height: 0,
              overflow: 'hidden',
              background: '#000',
            }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
              title={title}
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
        ) : (
          <div
            style={{
              background: PU.bg,
              height: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: PU.mutedFg,
              fontSize: '14px',
            }}
          >
            Invalid YouTube URL
          </div>
        )}

        {description ? (
          <div style={{ padding: '20px 24px', borderTop: `1px solid ${PU.border}` }}>
            <p style={{ color: PU.mutedFg, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              {description}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
