'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadSiteMediaWithAdminSession } from '@/lib/upload-site-media-client'

type MediaType = 'youtube' | 'image' | 'video' | null
const C = {
  bg: 'var(--background)',
  card: 'var(--card)',
  fg: 'var(--foreground)',
  mutedFg: 'var(--muted-foreground)',
  border: 'var(--border)',
  accent: 'var(--accent)',
  accentFg: 'var(--accent-foreground)',
  primary: 'var(--primary)',
} as const

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

async function removeSiteMediaWithAdminSession(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData.session
  if (!session?.access_token) {
    throw new Error('Not signed in. Refresh the page and sign in again.')
  }

  const res = await fetch('/api/admin/site-media/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ paths }),
  })
  const json = (await res.json()) as { error?: string }
  if (!res.ok) {
    throw new Error(json.error || `Remove failed (${res.status})`)
  }
}

export default function AdminHeroPage() {
  const [currentType, setCurrentType] = useState<MediaType>(null)
  const [currentUrl, setCurrentUrl] = useState('')
  const [currentPath, setCurrentPath] = useState('')
  const [selectedType, setSelectedType] = useState<MediaType>(null)
  const [youtubeInput, setYoutubeInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rhythmCurrentUrl, setRhythmCurrentUrl] = useState('')
  const [rhythmCurrentPath, setRhythmCurrentPath] = useState('')
  const [rhythmPreviewUrl, setRhythmPreviewUrl] = useState('')
  /** How the rhythm intro is sourced in the editor: uploaded file vs YouTube (no storage size cap). */
  const [rhythmMediaMode, setRhythmMediaMode] = useState<'file' | 'youtube'>('file')
  const [rhythmYoutubeInput, setRhythmYoutubeInput] = useState('')
  const [rhythmUploading, setRhythmUploading] = useState(false)
  const [rhythmSaving, setRhythmSaving] = useState(false)
  const [rhythmSaved, setRhythmSaved] = useState(false)
  const [rhythmError, setRhythmError] = useState('')
  const rhythmFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('site_settings').select('*').in('key', ['hero_media', 'rhythm_intro_video'])

      const heroData = data?.find((row) => row.key === 'hero_media')
      const rhythmData = data?.find((row) => row.key === 'rhythm_intro_video')

      if (heroData) {
        setCurrentType((heroData.media_type as MediaType) ?? null)
        setCurrentUrl((heroData.media_url as string | null) ?? '')
        setCurrentPath((heroData.media_storage_path as string | null) ?? '')
        setSelectedType((heroData.media_type as MediaType) ?? null)
        setPreviewUrl((heroData.media_url as string | null) ?? '')
        if (heroData.media_type === 'youtube') {
          setYoutubeInput((heroData.media_url as string | null) ?? '')
        }
      }

      if (rhythmData) {
        const rType = (rhythmData.media_type as MediaType) ?? null
        setRhythmCurrentUrl((rhythmData.media_url as string | null) ?? '')
        setRhythmCurrentPath((rhythmData.media_storage_path as string | null) ?? '')
        setRhythmPreviewUrl((rhythmData.media_url as string | null) ?? '')
        if (rType === 'youtube') {
          setRhythmMediaMode('youtube')
          setRhythmYoutubeInput((rhythmData.media_url as string | null) ?? '')
        } else if (rType === 'video') {
          setRhythmMediaMode('file')
          setRhythmYoutubeInput('')
        } else {
          setRhythmMediaMode('file')
          setRhythmYoutubeInput('')
        }
      }
      setLoading(false)
    }
    void load()
  }, [])

  async function handleRhythmFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setRhythmUploading(true)
    setRhythmError('')
    setRhythmMediaMode('file')
    setRhythmYoutubeInput('')
    try {
      const { path, publicUrl } = await uploadSiteMediaWithAdminSession(file, 'rhythm', rhythmCurrentPath || null)
      setRhythmPreviewUrl(publicUrl)
      setRhythmCurrentPath(path)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setRhythmError('Upload failed: ' + message)
    } finally {
      setRhythmUploading(false)
      e.target.value = ''
    }
  }

  async function handleSaveRhythmVideo() {
    setRhythmSaving(true)
    setRhythmError('')
    setRhythmSaved(false)
    try {
      const { data: authData } = await supabase.auth.getUser()

      if (rhythmMediaMode === 'youtube') {
        const yid = getYouTubeId(rhythmYoutubeInput)
        if (!rhythmYoutubeInput.trim()) {
          setRhythmError('Paste a YouTube URL or switch to file upload.')
          return
        }
        if (!yid) {
          setRhythmError('Invalid YouTube URL. Please check and try again.')
          return
        }
        const url = rhythmYoutubeInput.trim()
        if (rhythmCurrentPath) {
          try {
            await removeSiteMediaWithAdminSession([rhythmCurrentPath])
          } catch {
            /* still save YouTube row */
          }
        }
        const { error: saveError } = await supabase.from('site_settings').upsert(
          {
            key: 'rhythm_intro_video',
            value: 'Discipline x Focus x Productivity section video',
            media_type: 'youtube',
            media_url: url,
            media_storage_path: null,
            updated_at: new Date().toISOString(),
            updated_by: authData.user?.id ?? null,
          },
          { onConflict: 'key' },
        )
        if (saveError) throw saveError
        setRhythmCurrentUrl(url)
        setRhythmCurrentPath('')
        setRhythmPreviewUrl(url)
        setRhythmSaved(true)
        setTimeout(() => setRhythmSaved(false), 4000)
        return
      }

      if (!rhythmCurrentPath) {
        setRhythmError('Upload a video file first.')
        return
      }

      const { error: saveError } = await supabase.from('site_settings').upsert(
        {
          key: 'rhythm_intro_video',
          value: 'Discipline x Focus x Productivity section video',
          media_type: 'video',
          media_url: rhythmPreviewUrl || null,
          media_storage_path: rhythmCurrentPath || null,
          updated_at: new Date().toISOString(),
          updated_by: authData.user?.id ?? null,
        },
        { onConflict: 'key' },
      )
      if (saveError) throw saveError

      setRhythmCurrentUrl(rhythmPreviewUrl)
      setRhythmSaved(true)
      setTimeout(() => setRhythmSaved(false), 4000)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setRhythmError('Save failed: ' + message)
    } finally {
      setRhythmSaving(false)
    }
  }

  function handleRhythmYouTubeInput(url: string) {
    setRhythmYoutubeInput(url)
    setRhythmError('')
    setRhythmMediaMode('youtube')
    const id = getYouTubeId(url)
    if (id || !url) {
      setRhythmPreviewUrl(url)
    }
  }

  const rhythmYoutubeId = getYouTubeId(rhythmYoutubeInput)

  function setRhythmEditorModeFile() {
    setRhythmMediaMode('file')
    setRhythmError('')
    setRhythmYoutubeInput('')
    if (rhythmCurrentPath) {
      setRhythmPreviewUrl(rhythmCurrentUrl)
    } else {
      setRhythmPreviewUrl('')
    }
  }

  function setRhythmEditorModeYoutube() {
    setRhythmMediaMode('youtube')
    setRhythmError('')
    if (getYouTubeId(rhythmCurrentUrl)) {
      setRhythmYoutubeInput(rhythmCurrentUrl)
      setRhythmPreviewUrl(rhythmCurrentUrl)
    } else if (!rhythmYoutubeInput.trim()) {
      setRhythmPreviewUrl('')
    }
  }

  function handleYouTubeInput(url: string) {
    setYoutubeInput(url)
    setError('')
    const id = getYouTubeId(url)
    if (id || !url) {
      setPreviewUrl(url)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const { path, publicUrl } = await uploadSiteMediaWithAdminSession(file, 'hero', currentPath || null)
      setPreviewUrl(publicUrl)
      setCurrentPath(path)

      const mediaType = file.type.startsWith('image/') ? 'image' : 'video'
      setSelectedType(mediaType)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError('Upload failed: ' + message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      let finalUrl = ''
      let finalType: MediaType = null

      if (selectedType === 'youtube') {
        const id = getYouTubeId(youtubeInput)
        if (!id && youtubeInput) {
          setError('Invalid YouTube URL. Please check and try again.')
          setSaving(false)
          return
        }
        finalUrl = youtubeInput
        finalType = youtubeInput ? 'youtube' : null
      } else {
        finalUrl = previewUrl
        finalType = previewUrl ? selectedType : null
      }

      const { data: authData } = await supabase.auth.getUser()
      const { error: saveError } = await supabase.from('site_settings').upsert(
        {
          key: 'hero_media',
          value: 'Hero section media',
          media_type: finalType,
          media_url: finalUrl || null,
          media_storage_path: currentPath || null,
          updated_at: new Date().toISOString(),
          updated_by: authData.user?.id ?? null,
        },
        { onConflict: 'key' },
      )

      if (saveError) throw saveError

      setCurrentType(finalType)
      setCurrentUrl(finalUrl)
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError('Save failed: ' + message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    if (!window.confirm('Remove the hero media? The original static mockup will be shown instead.')) return

    setSaving(true)

    if (currentPath) {
      try {
        await removeSiteMediaWithAdminSession([currentPath])
      } catch {
        /* still clear DB row */
      }
    }

    await supabase.from('site_settings').upsert(
      {
        key: 'hero_media',
        value: 'Hero section media',
        media_type: null,
        media_url: null,
        media_storage_path: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    )

    setCurrentType(null)
    setCurrentUrl('')
    setCurrentPath('')
    setSelectedType(null)
    setPreviewUrl('')
    setYoutubeInput('')
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const youtubeId = getYouTubeId(youtubeInput)

  const typeButtonStyle = (type: MediaType | 'none') =>
    ({
      padding: '10px 20px',
      borderRadius: '8px',
      border: `1px solid ${selectedType === type || (type === 'none' && !selectedType) ? C.accent : C.border}`,
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500' as const,
      background:
        selectedType === type || (type === 'none' && !selectedType)
          ? 'color-mix(in srgb, var(--accent) 18%, transparent)'
          : C.card,
      color: selectedType === type || (type === 'none' && !selectedType) ? C.accent : C.mutedFg,
      transition: 'all 0.15s',
    }) as const

  if (loading) {
    return <div style={{ color: C.mutedFg, padding: '40px' }}>Loading...</div>
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: C.fg, fontSize: '24px', fontWeight: '600', margin: '0 0 4px' }}>Hero Media</h1>
        <p style={{ color: C.mutedFg, fontSize: '14px', margin: '0 0 6px' }}>
          Controls the media displayed in the right side of the landing page hero section. Changes are
          live immediately.
        </p>
        <p style={{ color: C.mutedFg, fontSize: '12px', margin: 0 }}>
          Uploaded videos: up to <strong style={{ color: C.fg }}>5 GB</strong> by default; files over ~6 MB use chunked
          (resumable) upload. Or use YouTube. Match the cap in Supabase Storage settings if uploads still fail.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        <div>
          <div
            style={{
              background: C.card,
              borderRadius: '12px',
              padding: '16px 20px',
              border: `1px solid ${C.border}`,
              marginBottom: '20px',
            }}
          >
            <p
              style={{
                color: C.mutedFg,
                fontSize: '12px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: '0 0 8px',
              }}
            >
              Currently showing
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>
                {currentType === 'youtube'
                  ? '▶'
                  : currentType === 'image'
                    ? '🖼️'
                    : currentType === 'video'
                      ? '🎬'
                      : '📋'}
              </span>
              <div>
                <p style={{ color: C.fg, fontSize: '14px', fontWeight: '500', margin: 0 }}>
                  {currentType === 'youtube'
                    ? 'YouTube video'
                    : currentType === 'image'
                      ? 'Custom image'
                      : currentType === 'video'
                        ? 'Custom video'
                        : 'Default static mockup'}
                </p>
                {currentUrl ? (
                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: C.mutedFg,
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      textDecoration: 'none',
                      display: 'block',
                      marginTop: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '280px',
                    }}
                  >
                    {currentUrl}
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <p style={{ color: C.mutedFg, fontSize: '13px', fontWeight: '500', margin: '0 0 12px' }}>
            Choose media type
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
            <button
              onClick={() => {
                setSelectedType(null)
                setPreviewUrl('')
              }}
              style={typeButtonStyle('none')}
            >
              📋 Default mockup
            </button>
            <button onClick={() => setSelectedType('youtube')} style={typeButtonStyle('youtube')}>
              ▶ YouTube video
            </button>
            <button
              onClick={() => {
                setSelectedType('image')
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'image/png,image/jpeg,image/webp,image/gif'
                  fileInputRef.current.click()
                }
              }}
              style={typeButtonStyle('image')}
            >
              🖼️ Image (PNG/JPG)
            </button>
            <button
              onClick={() => {
                setSelectedType('video')
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'video/mp4,video/quicktime,video/webm'
                  fileInputRef.current.click()
                }
              }}
              style={typeButtonStyle('video')}
            >
              🎬 Video (MP4)
            </button>
          </div>

          <input ref={fileInputRef} type="file" onChange={handleFileUpload} style={{ display: 'none' }} />

          {selectedType === 'youtube' ? (
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  color: C.mutedFg,
                  fontSize: '12px',
                  fontWeight: '500',
                  marginBottom: '8px',
                }}
              >
                YouTube URL
              </label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeInput}
                onChange={(e) => handleYouTubeInput(e.target.value)}
                style={{
                  width: '100%',
                  background: C.bg,
                  border: `1px solid ${youtubeId ? C.primary : C.border}`,
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: C.fg,
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {youtubeId ? (
                <p style={{ color: C.primary, fontSize: '11px', margin: '6px 0 0' }}>✓ Valid YouTube link detected</p>
              ) : youtubeInput ? (
                <p style={{ color: '#EF4444', fontSize: '11px', margin: '6px 0 0' }}>✗ Could not detect YouTube ID</p>
              ) : null}
            </div>
          ) : null}

          {uploading ? (
            <div
              style={{
                background: C.card,
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  border: `2px solid ${C.border}`,
                  borderTop: `2px solid ${C.accent}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  flexShrink: 0,
                }}
              />
              <span style={{ color: C.mutedFg, fontSize: '13px' }}>Uploading to storage...</span>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : null}

          {!uploading && previewUrl && selectedType !== 'youtube' && selectedType !== null ? (
            <div
              style={{
                background: C.card,
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                border: `1px solid color-mix(in srgb, ${C.primary} 30%, transparent)`,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ color: C.primary, fontSize: '14px' }}>✓</span>
              <span style={{ color: C.primary, fontSize: '13px' }}>
                {selectedType === 'image' ? 'Image uploaded successfully' : 'Video uploaded successfully'}
              </span>
              <button
                onClick={() => {
                  setSelectedType(null)
                  setPreviewUrl('')
                  setCurrentPath('')
                }}
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: 'none',
                  color: C.mutedFg,
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ×
              </button>
            </div>
          ) : null}

          {error ? (
            <div
              style={{
                background: '#450A0A',
                border: '1px solid #EF4444',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                color: '#FCA5A5',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              style={{
                background: C.accent,
                color: C.accentFg,
                border: 'none',
                borderRadius: '8px',
                padding: '12px 28px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: saving || uploading ? 'wait' : 'pointer',
                opacity: saving || uploading ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save to landing page'}
            </button>

            {currentType ? (
              <button
                onClick={handleRemove}
                style={{
                  background: 'transparent',
                  border: '1px solid color-mix(in srgb, var(--destructive) 35%, transparent)',
                  color: 'var(--destructive)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Remove media
              </button>
            ) : null}

            {saved ? (
              <span style={{ color: C.primary, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ✓ Live on landing page
              </span>
            ) : null}
          </div>
        </div>

        <div>
          <p style={{ color: C.mutedFg, fontSize: '13px', fontWeight: '500', margin: '0 0 12px' }}>
            Preview
            <span style={{ color: C.mutedFg, fontWeight: 400, marginLeft: '8px', fontSize: '12px' }}>
              (what visitors will see)
            </span>
          </p>

          <div
            style={{
              background: C.bg,
              borderRadius: '16px',
              overflow: 'hidden',
              border: `1px solid ${C.border}`,
              minHeight: '300px',
            }}
          >
            {selectedType === 'youtube' && youtubeId ? (
              <div style={{ position: 'relative', paddingBottom: '62.5%', height: 0, overflow: 'hidden' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                  title="Preview"
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
            ) : null}

            {selectedType === 'image' && previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  width: '100%',
                  display: 'block',
                  maxHeight: '400px',
                  objectFit: 'cover',
                }}
              />
            ) : null}

            {selectedType === 'video' && previewUrl ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                style={{
                  width: '100%',
                  display: 'block',
                  maxHeight: '400px',
                  objectFit: 'cover',
                }}
              >
                <source src={previewUrl} type="video/mp4" />
              </video>
            ) : null}

            {!selectedType || (selectedType === 'youtube' && !youtubeId) ? (
              <div style={{ padding: '20px', opacity: 0.6 }}>
                <div
                  style={{
                    background: 'var(--card)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ background: 'var(--accent)', borderRadius: '6px', padding: '10px 14px' }}>
                    <p style={{ color: 'var(--accent-foreground)', fontSize: '14px', fontWeight: '800', margin: 0 }}>34 Day</p>
                    <p style={{ color: 'var(--accent-foreground)', fontSize: '10px', margin: '2px 0 0' }}>Streak</p>
                  </div>
                  <div style={{ background: 'var(--background)', borderRadius: '6px', padding: '10px 12px', flex: 1 }}>
                    <p style={{ color: 'var(--foreground)', fontSize: '11px', fontWeight: '600', margin: '0 0 4px' }}>Habits</p>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '10px', margin: 0 }}>Exercise · Read · Plan</p>
                  </div>
                </div>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', textAlign: 'center', margin: 0 }}>Default static mockup</p>
              </div>
            ) : null}
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: '12px',
              color: C.accent,
              fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            View live landing page →
          </a>
        </div>
      </div>

      <div
        style={{
          marginTop: '40px',
          paddingTop: '24px',
          borderTop: `1px solid ${C.border}`,
          maxWidth: '560px',
        }}
      >
        <h2 style={{ color: C.fg, fontSize: '20px', fontWeight: '600', margin: '0 0 4px' }}>
          Discipline x Focus x Productivity Video
        </h2>
        <p style={{ color: C.mutedFg, fontSize: '13px', margin: '0 0 8px' }}>
          This video appears above the "Your daily monkcubed rhythm" section.
        </p>
        <p style={{ color: C.mutedFg, fontSize: '12px', margin: '0 0 8px' }}>
          Use a <strong style={{ color: C.fg }}>YouTube link</strong> to avoid storage file size limits.
        </p>
        <p style={{ color: C.mutedFg, fontSize: '11px', margin: '0 0 16px' }}>
          MP4 uploads allow up to <strong style={{ color: C.fg }}>5 GB</strong> per file by default (server env{' '}
          <code style={{ fontSize: '10px' }}>SITE_MEDIA_MAX_UPLOAD_BYTES</code> to override). Your Supabase project
          global upload limit must be at least as high.
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={setRhythmEditorModeFile}
            disabled={rhythmUploading || rhythmSaving}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: `1px solid ${rhythmMediaMode === 'file' ? C.accent : C.border}`,
              background:
                rhythmMediaMode === 'file' ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : C.card,
              color: rhythmMediaMode === 'file' ? C.accent : C.mutedFg,
              cursor: rhythmUploading || rhythmSaving ? 'wait' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Video file (MP4)
          </button>
          <button
            type="button"
            onClick={setRhythmEditorModeYoutube}
            disabled={rhythmUploading || rhythmSaving}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: `1px solid ${rhythmMediaMode === 'youtube' ? C.accent : C.border}`,
              background:
                rhythmMediaMode === 'youtube' ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : C.card,
              color: rhythmMediaMode === 'youtube' ? C.accent : C.mutedFg,
              cursor: rhythmUploading || rhythmSaving ? 'wait' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            YouTube link
          </button>
        </div>

        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '14px',
          }}
        >
          <p style={{ color: C.mutedFg, fontSize: '12px', margin: '0 0 6px' }}>Currently saved</p>
          {rhythmCurrentUrl ? (
            <>
              <p style={{ color: C.mutedFg, fontSize: '11px', margin: '0 0 4px' }}>
                {getYouTubeId(rhythmCurrentUrl) ? 'YouTube' : 'Uploaded file'}
              </p>
              <a
                href={rhythmCurrentUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: C.fg,
                  fontSize: '12px',
                  textDecoration: 'none',
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}
              >
                {rhythmCurrentUrl}
              </a>
            </>
          ) : (
            <p style={{ color: C.mutedFg, fontSize: '12px', margin: 0 }}>No custom video set yet.</p>
          )}
        </div>

        {rhythmMediaMode === 'youtube' ? (
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                color: C.mutedFg,
                fontSize: '12px',
                fontWeight: '500',
                marginBottom: '8px',
              }}
            >
              YouTube URL
            </label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={rhythmYoutubeInput}
              onChange={(e) => handleRhythmYouTubeInput(e.target.value)}
              style={{
                width: '100%',
                background: C.bg,
                border: `1px solid ${rhythmYoutubeId ? C.primary : C.border}`,
                borderRadius: '8px',
                padding: '10px 14px',
                color: C.fg,
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {rhythmYoutubeId ? (
              <p style={{ color: C.primary, fontSize: '11px', margin: '6px 0 0' }}>Valid YouTube link detected</p>
            ) : rhythmYoutubeInput ? (
              <p style={{ color: '#EF4444', fontSize: '11px', margin: '6px 0 0' }}>Could not detect YouTube ID</p>
            ) : null}
          </div>
        ) : (
          <>
            <button
              onClick={() => {
                setRhythmError('')
                if (rhythmFileInputRef.current) {
                  rhythmFileInputRef.current.accept = 'video/mp4,video/quicktime,video/webm'
                  rhythmFileInputRef.current.click()
                }
              }}
              disabled={rhythmUploading || rhythmSaving}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: `1px solid ${C.border}`,
                background: C.card,
                color: C.fg,
                cursor: rhythmUploading || rhythmSaving ? 'wait' : 'pointer',
              }}
            >
              {rhythmUploading ? 'Uploading video...' : 'Upload video (MP4)'}
            </button>
            <input ref={rhythmFileInputRef} type="file" onChange={handleRhythmFileUpload} style={{ display: 'none' }} />
          </>
        )}

        {rhythmMediaMode === 'youtube' && rhythmYoutubeId ? (
          <div
            style={{
              marginTop: '12px',
              borderRadius: '10px',
              overflow: 'hidden',
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
              <iframe
                src={`https://www.youtube.com/embed/${rhythmYoutubeId}?rel=0&modestbranding=1`}
                title="Rhythm section preview"
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
        ) : null}
        {rhythmMediaMode === 'file' && rhythmPreviewUrl && rhythmCurrentPath ? (
          <div style={{ marginTop: '12px', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
            <video autoPlay muted loop playsInline style={{ width: '100%', display: 'block', maxHeight: '300px', objectFit: 'cover' }}>
              <source src={rhythmPreviewUrl} type="video/mp4" />
            </video>
          </div>
        ) : null}

        {rhythmError ? (
          <div
            style={{
              background: '#450A0A',
              border: '1px solid #EF4444',
              borderRadius: '8px',
              padding: '10px 14px',
              marginTop: '12px',
              color: '#FCA5A5',
              fontSize: '13px',
            }}
          >
            {rhythmError}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSaveRhythmVideo}
            disabled={rhythmSaving || rhythmUploading}
            style={{
              background: C.accent,
              color: C.accentFg,
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: rhythmSaving || rhythmUploading ? 'wait' : 'pointer',
              opacity: rhythmSaving || rhythmUploading ? 0.7 : 1,
            }}
          >
            {rhythmSaving ? 'Saving...' : 'Save section video'}
          </button>
          {rhythmSaved ? <span style={{ color: C.primary, fontSize: '13px' }}>✓ Live on landing page</span> : null}
        </div>
      </div>
    </div>
  )
}
