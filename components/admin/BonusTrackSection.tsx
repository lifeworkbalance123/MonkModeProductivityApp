'use client'

import { useState, type CSSProperties } from 'react'
import { useFormContext } from 'react-hook-form'
import { FileUploader } from '@/components/admin/FileUploader'

export type BonusTrackFields = {
  bonus_label: string
  bonus_title: string
  bonus_body: string
  bonus_audio_url: string
  bonus_video_url: string
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--background)',
  color: 'var(--foreground)',
  fontSize: '14px',
  boxSizing: 'border-box',
}

/**
 * Collapsible bonus fields for react-hook-form (`FormProvider`).
 * Register fields: `bonus_label`, `bonus_title`, `bonus_body`, `bonus_audio_url`, `bonus_video_url`.
 */
export function BonusTrackSection() {
  const { register, setValue, watch } = useFormContext()
  const [isOpen, setIsOpen] = useState(false)

  const bonusAudioUrl = watch('bonus_audio_url') as string | undefined
  const bonusVideoUrl = watch('bonus_video_url') as string | undefined

  return (
    <div className="bonus-track-section mt-6 border-t border-border pt-4">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 text-foreground hover:text-accent"
      >
        <span className="text-lg" aria-hidden>
          ✨
        </span>
        <span className="font-medium">Bonus Track (optional)</span>
        <span className="text-muted-foreground">{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen ? (
        <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Section Label</label>
            <input
              {...register('bonus_label')}
              placeholder="Bonus"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">Shown as the bonus tab / section heading.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Bonus Title</label>
            <input
              {...register('bonus_title')}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Bonus Body (Markdown)</label>
            <textarea
              {...register('bonus_body')}
              rows={4}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">Supports markdown in storage; Today/share views may render as plain text.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Audio (MP3)</label>
            <div className="mt-1">
              <FileUploader
                accept="audio/mpeg,audio/mp3,.mp3"
                mediaType="audio"
                label="Upload MP3"
                onUploadComplete={(url) => setValue('bonus_audio_url', url, { shouldDirty: true })}
              />
            </div>
            {bonusAudioUrl ? (
              <audio controls src={bonusAudioUrl} className="mt-2 h-9 w-full max-w-md" preload="metadata" />
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Video (MP4 / MOV / WebM)</label>
            <div className="mt-1">
              <FileUploader
                accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                mediaType="video"
                label="Upload video"
                onUploadComplete={(url) => setValue('bonus_video_url', url, { shouldDirty: true })}
              />
            </div>
            {bonusVideoUrl ? (
              <video
                controls
                playsInline
                src={bonusVideoUrl}
                className="mt-2 max-h-[280px] w-full max-w-lg rounded-lg"
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export type BonusTrackSectionControlledProps = {
  values: BonusTrackFields
  onChange: (partial: Partial<BonusTrackFields>) => void
  /** Called when any field or upload changes (e.g. set draft dirty flag). */
  onMarkDirty?: () => void
}

/** Same fields as `BonusTrackSection`, wired to controlled props for the Program Lessons editor draft. */
export function BonusTrackSectionControlled({
  values,
  onChange,
  onMarkDirty,
}: BonusTrackSectionControlledProps) {
  const [isOpen, setIsOpen] = useState(false)

  const patch = (partial: Partial<BonusTrackFields>) => {
    onMarkDirty?.()
    onChange(partial)
  }

  return (
    <div
      style={{
        marginTop: '8px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border)',
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'var(--foreground)',
          fontSize: '14px',
        }}
      >
        <span style={{ fontSize: '18px' }} aria-hidden>
          ✨
        </span>
        <span style={{ fontWeight: 600 }}>Bonus Track (optional)</span>
        <span style={{ color: 'var(--muted-foreground)' }}>{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen ? (
        <div
          style={{
            marginTop: '12px',
            display: 'grid',
            gap: '12px',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: 'color-mix(in srgb, var(--muted) 25%, transparent)',
          }}
        >
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
            Shown as a second tab on Today when any bonus title, body, or media URL is set. Prefer this over the
            legacy separate bonus row if you don&apos;t need two models at once.
          </p>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
            Bonus section label
            <input
              value={values.bonus_label}
              onChange={(e) => patch({ bonus_label: e.target.value })}
              style={inputStyle}
              placeholder="Bonus"
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
            Bonus title
            <input
              value={values.bonus_title}
              onChange={(e) => patch({ bonus_title: e.target.value })}
              style={inputStyle}
              placeholder="Headline for the bonus block"
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
            Bonus body (markdown)
            <textarea
              value={values.bonus_body}
              onChange={(e) => patch({ bonus_body: e.target.value })}
              style={{ ...inputStyle, minHeight: '120px', fontFamily: 'ui-monospace, monospace', fontSize: '13px' }}
              placeholder="Optional markdown…"
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
            Bonus audio URL (optional)
            <input
              value={values.bonus_audio_url}
              onChange={(e) => patch({ bonus_audio_url: e.target.value })}
              style={inputStyle}
              placeholder="https://…"
            />
          </label>
          <FileUploader
            accept="audio/mpeg,audio/mp3,.mp3"
            mediaType="audio"
            label="Upload bonus MP3"
            onUploadComplete={(url) => patch({ bonus_audio_url: url })}
          />
          {values.bonus_audio_url.trim() ? (
            <audio
              controls
              preload="metadata"
              style={{ width: '100%', maxWidth: '420px', height: '36px' }}
              src={values.bonus_audio_url.trim()}
            />
          ) : null}

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
            Bonus video URL (optional)
            <input
              value={values.bonus_video_url}
              onChange={(e) => patch({ bonus_video_url: e.target.value })}
              style={inputStyle}
              placeholder="YouTube or hosted MP4 URL"
            />
          </label>
          <FileUploader
            accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
            mediaType="video"
            label="Upload bonus MP4 / MOV"
            onUploadComplete={(url) => patch({ bonus_video_url: url })}
          />
          {values.bonus_video_url.trim() ? (
            <video
              controls
              playsInline
              style={{ width: '100%', maxWidth: '480px', maxHeight: '280px', borderRadius: '8px' }}
              src={values.bonus_video_url.trim()}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
