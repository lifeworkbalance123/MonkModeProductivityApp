'use client'

import { useMemo } from 'react'
import { PU } from '@/lib/program-ui-tokens'
import {
  trainingAccentFromCategory,
  trainingOnAccentForeground,
  trainingThumbnailBackdrop,
} from '@/lib/training-palette'
import { type TrainingModule, getYouTubeThumbnail } from '@/lib/trainingContent'

type TrainingCardProps = {
  module: TrainingModule
  isPro: boolean
  onPlay: (module: TrainingModule) => void
  onLockedClick?: () => void
}

export default function TrainingCard({ module, isPro, onPlay, onLockedClick }: TrainingCardProps) {
  const isLocked = module.isPro && !isPro
  const thumbnail = module.thumbnail || getYouTubeThumbnail(module.youtubeUrl)
  const accent = useMemo(() => trainingAccentFromCategory(module.category), [module.category])
  const onAccent = trainingOnAccentForeground(accent)
  const defaultBorder = PU.border

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (isLocked) {
          onLockedClick?.()
          return
        }
        onPlay(module)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (isLocked) {
            onLockedClick?.()
            return
          }
          onPlay(module)
        }
      }}
      style={{
        background: PU.card,
        borderRadius: '12px',
        border: `1px solid ${defaultBorder}`,
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: isLocked ? 0.7 : 1,
        transition: 'transform 0.15s, border-color 0.15s',
        position: 'relative',
      }}
      onMouseOver={(e) => {
        if (!isLocked) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.borderColor = accent
        }
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = defaultBorder
      }}
    >
      <div
        style={{
          position: 'relative',
          paddingBottom: '56.25%',
          background: PU.bg,
          overflow: 'hidden',
        }}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={module.title}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: isLocked ? 'blur(2px) brightness(0.5)' : 'none',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: trainingThumbnailBackdrop(accent),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '40px' }}>{module.type === 'article' ? '📄' : '🎬'}</span>
          </div>
        )}

        {!isLocked ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0)',
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.3)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0)'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                background: accent,
                color: onAccent,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                paddingLeft: '3px',
              }}
            >
              ▶
            </div>
          </div>
        ) : null}

        {isLocked ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '28px' }}>🔒</span>
            <span
              style={{
                background: PU.primary,
                color: PU.primaryFg,
                fontSize: '11px',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '4px',
              }}
            >
              PRO
            </span>
          </div>
        ) : null}

        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            background: 'rgba(0,0,0,0.75)',
            color: 'white',
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
          }}
        >
          {module.duration}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <span
            style={{
              background: `color-mix(in srgb, ${accent} 22%, transparent)`,
              color: accent,
              fontSize: '10px',
              fontWeight: '500',
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {module.category}
          </span>
          {module.isPro && !isPro ? (
            <span style={{ color: PU.mutedFg, fontSize: '11px' }}>Pro only</span>
          ) : null}
        </div>

        <h3
          style={{
            color: isLocked ? PU.mutedFg : PU.fg,
            fontSize: '14px',
            fontWeight: '500',
            margin: '0 0 6px',
            lineHeight: '1.4',
          }}
        >
          {module.title}
        </h3>

        <p
          style={{
            color: PU.mutedFg,
            fontSize: '12px',
            margin: 0,
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {module.description}
        </p>
      </div>
    </div>
  )
}
