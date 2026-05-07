'use client'

import { cn } from '@/lib/utils'

const BUILTIN: ReadonlyArray<{ id: 'silence' | 'rain' | 'ocean' | 'white'; icon: string; title: string }> = [
  { id: 'silence', icon: '🔇', title: 'Silence' },
  { id: 'rain', icon: '🌧️', title: 'Rain' },
  { id: 'ocean', icon: '🌊', title: 'Ocean' },
  { id: 'white', icon: '⬜', title: 'White noise' },
]

export type AudioTrackSelectorProps = {
  ambient: string
  onAmbientChange: (id: string) => void
  mp3Tracks: Array<{ key: string; label: string }>
  disabled?: boolean
  /** Tighter spacing for inline card vs fullscreen */
  compact?: boolean
}

export function AudioTrackSelector({
  ambient,
  onAmbientChange,
  mp3Tracks,
  disabled,
  compact,
}: AudioTrackSelectorProps) {
  return (
    <div className={cn(compact ? 'space-y-2' : 'space-y-3')}>
      <p
        className={cn(
          'text-center text-muted-foreground',
          compact ? 'text-[11px]' : 'text-xs',
        )}
      >
        Ambient sound
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {BUILTIN.map((b) => (
          <button
            key={b.id}
            type="button"
            title={b.title}
            disabled={disabled}
            className={cn(
              'flex items-center justify-center rounded-lg border text-lg transition-colors',
              compact ? 'h-10 w-10' : 'h-12 w-12',
              disabled && 'cursor-not-allowed opacity-50',
              ambient === b.id
                ? 'border-accent bg-accent/20'
                : 'border-border bg-muted/40 hover:bg-muted/70',
            )}
            onClick={() => onAmbientChange(b.id)}
          >
            <span aria-hidden>{b.icon}</span>
            <span className="sr-only">{b.title}</span>
          </button>
        ))}
      </div>
      <p
        className={cn(
          'text-center text-muted-foreground',
          compact ? 'pt-1 text-[11px]' : 'pt-2 text-xs',
        )}
      >
        Curated (MP3)
      </p>
      {mp3Tracks.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-2">
          {mp3Tracks.map((t) => (
            <button
              key={t.key}
              type="button"
              title={t.label}
              disabled={disabled}
              className={cn(
                'rounded-lg border px-2 text-xs font-medium transition-colors',
                compact ? 'min-h-9 min-w-[3rem] py-1' : 'min-h-12 min-w-[3.5rem]',
                disabled && 'cursor-not-allowed opacity-50',
                ambient === t.key
                  ? 'border-accent bg-accent/20 text-foreground'
                  : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/70',
              )}
              onClick={() => onAmbientChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          No focus music in library yet. Built-in sounds above still work.
        </p>
      )}
    </div>
  )
}
