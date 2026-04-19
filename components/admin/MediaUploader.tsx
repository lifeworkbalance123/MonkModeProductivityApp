'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type MediaType = 'youtube' | 'audio' | 'video' | 'image' | null

type MediaUploaderProps = {
  currentType: MediaType
  currentUrl: string
  currentStoragePath: string
  onMediaChange: (data: { type: MediaType; url: string; storagePath: string }) => void
  context: 'lesson' | 'onboarding'
  contextId: string
}

export default function MediaUploader({
  currentType,
  currentUrl,
  currentStoragePath,
  onMediaChange,
  context,
  contextId,
}: MediaUploaderProps) {
  const [selectedType, setSelectedType] = useState<MediaType>(currentType)
  const [youtubeInput, setYoutubeInput] = useState(currentType === 'youtube' ? currentUrl : '')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(currentUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSelectedType(currentType)
    if (currentType === 'youtube') {
      setYoutubeInput(currentUrl)
      setPreviewUrl(currentUrl)
    } else if (currentUrl && (currentType === 'audio' || currentType === 'video' || currentType === 'image')) {
      setYoutubeInput('')
      setPreviewUrl(currentUrl)
    } else {
      setYoutubeInput('')
      setPreviewUrl('')
    }
  }, [currentType, currentUrl])

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

  function handleYouTubeChange(url: string) {
    setYoutubeInput(url)
    const id = getYouTubeId(url)
    if (id) {
      setPreviewUrl(url)
      onMediaChange({ type: 'youtube', url, storagePath: '' })
    }
  }

  function classifyUpload(file: File): MediaType | null {
    if (file.type.startsWith('audio/')) return 'audio'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type === 'image/png' || file.type === 'image/jpeg') return 'image'
    if (file.type === 'image/jpg') return 'image'
    return null
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError('')
    setUploadProgress(0)

    try {
      const mediaType = classifyUpload(file)
      if (!mediaType) {
        setUploadError('Use PNG or JPG for images, MP3 for audio, or MP4/MOV/WebM for video.')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${context}-${contextId}-${Date.now()}.${fileExt}`
      const storagePath = `${context}/${fileName}`

      if (currentStoragePath) {
        await supabase.storage.from('lesson-media').remove([currentStoragePath])
      }

      const { error } = await supabase.storage.from('lesson-media').upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

      if (error) throw error

      const { data: urlData } = supabase.storage.from('lesson-media').getPublicUrl(storagePath)
      const publicUrl = urlData.publicUrl
      setPreviewUrl(publicUrl)
      setUploadProgress(100)
      setSelectedType(mediaType)

      onMediaChange({ type: mediaType, url: publicUrl, storagePath })
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function removeMedia() {
    if (currentStoragePath) {
      await supabase.storage.from('lesson-media').remove([currentStoragePath])
    }
    setSelectedType(null)
    setYoutubeInput('')
    setPreviewUrl('')
    onMediaChange({ type: null, url: '', storagePath: '' })
  }

  async function selectNone() {
    setSelectedType(null)
    setYoutubeInput('')
    setPreviewUrl('')
    if (currentStoragePath) {
      await supabase.storage.from('lesson-media').remove([currentStoragePath])
    }
    onMediaChange({ type: null, url: '', storagePath: '' })
  }

  const tabStyle = (type: MediaType | 'none') =>
    ({
      padding: '6px 14px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500' as const,
      background:
        selectedType === type || (type === 'none' && !selectedType) ? '#F59E0B' : '#0F172A',
      color: selectedType === type || (type === 'none' && !selectedType) ? '#000' : '#64748B',
      transition: 'all 0.15s',
    }) as const

  const youtubeId = getYouTubeId(youtubeInput)

  return (
    <div
      style={{
        background: '#0F172A',
        borderRadius: '10px',
        padding: '16px',
        border: '1px solid #334155',
      }}
    >
      <p
        style={{
          color: '#94A3B8',
          fontSize: '12px',
          fontWeight: '500',
          margin: '0 0 12px',
        }}
      >
        Optional media
        <span style={{ color: '#475569', fontWeight: '400', marginLeft: '8px' }}>
          (shown before the action button)
        </span>
      </p>
      <p style={{ color: '#64748B', fontSize: '11px', lineHeight: 1.45, margin: '0 0 12px' }}>
        <strong style={{ color: '#94A3B8' }}>Images (PNG/JPG):</strong> full-width desktop banners work best at{' '}
        <strong style={{ color: '#CBD5E1' }}>1920×1080</strong> (16:9). For mobile-focused banners, consider{' '}
        <strong style={{ color: '#CBD5E1' }}>1280×720</strong> (16:9). Same ratio as Hero / marketing assets.
      </p>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => void selectNone()} style={tabStyle('none')}>
          None
        </button>
        <button
          type="button"
          onClick={() => setSelectedType('youtube')}
          style={tabStyle('youtube')}
        >
          ▶ YouTube
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedType('audio')
            fileInputRef.current?.click()
          }}
          style={tabStyle('audio')}
        >
          🎵 Audio (MP3)
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedType('video')
            fileInputRef.current?.click()
          }}
          style={tabStyle('video')}
        >
          🎬 Video (MP4)
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedType('image')
            fileInputRef.current?.click()
          }}
          style={tabStyle('image')}
        >
          🖼 Image (PNG/JPG)
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,.mp3,video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,image/png,image/jpeg,.jpg,.jpeg,.png"
        onChange={(e) => void handleFileUpload(e)}
        style={{ display: 'none' }}
      />

      {selectedType === 'youtube' ? (
        <div>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeInput}
            onChange={(e) => handleYouTubeChange(e.target.value)}
            style={{
              width: '100%',
              background: '#1E293B',
              border: `1px solid ${youtubeId ? '#10B981' : '#334155'}`,
              borderRadius: '8px',
              padding: '10px 14px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box' as const,
              marginBottom: '10px',
            }}
          />
          {youtubeId ? (
            <div>
              <img
                src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                alt="Preview"
                style={{
                  width: '100%',
                  maxWidth: '280px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                }}
              />
              <p style={{ color: '#10B981', fontSize: '11px', margin: '6px 0 0' }}>
                ✓ Valid YouTube link
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {uploading ? (
        <div style={{ marginBottom: '10px' }}>
          <div
            style={{
              background: '#1E293B',
              borderRadius: '4px',
              height: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: '#F59E0B',
                height: '100%',
                width: `${uploadProgress}%`,
                transition: 'width 0.3s',
              }}
            />
          </div>
          <p style={{ color: '#64748B', fontSize: '11px', margin: '4px 0 0' }}>Uploading...</p>
        </div>
      ) : null}

      {uploadError ? (
        <p style={{ color: '#EF4444', fontSize: '12px', margin: '0 0 8px' }}>Upload failed: {uploadError}</p>
      ) : null}

      {!uploading && previewUrl && selectedType !== 'youtube' ? (
        <div style={{ marginBottom: '8px' }}>
          {selectedType === 'image' ? (
            <div
              style={{
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #334155',
                maxWidth: '100%',
                aspectRatio: '16 / 9',
                background: '#0f172a',
              }}
            >
              <img
                src={previewUrl}
                alt="Uploaded banner preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ) : null}
          <div
            style={{
              background: '#1E293B',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: selectedType === 'image' ? '8px' : 0,
            }}
          >
            <span style={{ fontSize: '16px' }}>
              {selectedType === 'audio' ? '🎵' : selectedType === 'image' ? '🖼' : '🎬'}
            </span>
            <span
              style={{
                color: '#94A3B8',
                fontSize: '12px',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedType === 'audio'
                ? 'Audio file uploaded'
                : selectedType === 'image'
                  ? 'Image uploaded'
                  : 'Video file uploaded'}
            </span>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#F59E0B',
                fontSize: '11px',
                textDecoration: 'none',
              }}
            >
              Preview
            </a>
          </div>
        </div>
      ) : null}

      {selectedType || currentUrl ? (
        <button
          type="button"
          onClick={() => void removeMedia()}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#EF4444',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '4px 0',
            textDecoration: 'underline',
          }}
        >
          Remove media
        </button>
      ) : null}

      {!selectedType && !currentUrl ? (
        <p style={{ color: '#334155', fontSize: '12px', margin: 0, fontStyle: 'italic' }}>
          No media attached — text only lesson
        </p>
      ) : null}
    </div>
  )
}
