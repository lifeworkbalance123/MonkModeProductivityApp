'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type MediaType = 'youtube' | 'audio' | 'video' | 'image' | null

export type MediaChangePayload = {
  type: MediaType
  url: string
  storagePath: string
  companionType: 'image' | 'audio' | null
  companionUrl: string
  companionStoragePath: string
}

type Slot = { url: string; path: string }

type MediaUploaderProps = {
  currentType: MediaType
  currentUrl: string
  currentStoragePath: string
  companionType?: 'image' | 'audio' | null
  companionUrl?: string
  companionStoragePath?: string
  onMediaChange: (data: MediaChangePayload) => void
  context: 'lesson' | 'onboarding'
  contextId: string
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

function classifyUpload(file: File): MediaType | null {
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type === 'image/png' || file.type === 'image/jpeg') return 'image'
  if (file.type === 'image/jpg') return 'image'
  return null
}

function buildPayload(
  image: Slot | null,
  audio: Slot | null,
  embedKind: 'none' | 'youtube' | 'video',
  youtubeInput: string,
  video: Slot | null,
): MediaChangePayload {
  if (embedKind === 'youtube') {
    const id = getYouTubeId(youtubeInput)
    if (id) {
      return {
        type: 'youtube',
        url: youtubeInput,
        storagePath: '',
        companionType: null,
        companionUrl: '',
        companionStoragePath: '',
      }
    }
  }
  if (embedKind === 'video' && video) {
    return {
      type: 'video',
      url: video.url,
      storagePath: video.path,
      companionType: null,
      companionUrl: '',
      companionStoragePath: '',
    }
  }
  if (image && audio) {
    return {
      type: 'image',
      url: image.url,
      storagePath: image.path,
      companionType: 'audio',
      companionUrl: audio.url,
      companionStoragePath: audio.path,
    }
  }
  if (image) {
    return {
      type: 'image',
      url: image.url,
      storagePath: image.path,
      companionType: null,
      companionUrl: '',
      companionStoragePath: '',
    }
  }
  if (audio) {
    return {
      type: 'audio',
      url: audio.url,
      storagePath: audio.path,
      companionType: null,
      companionUrl: '',
      companionStoragePath: '',
    }
  }
  return {
    type: null,
    url: '',
    storagePath: '',
    companionType: null,
    companionUrl: '',
    companionStoragePath: '',
  }
}

export default function MediaUploader({
  currentType,
  currentUrl,
  currentStoragePath,
  companionType: companionTypeProp = null,
  companionUrl: companionUrlProp = '',
  companionStoragePath: companionStoragePathProp = '',
  onMediaChange,
  context,
  contextId,
}: MediaUploaderProps) {
  const [pairImage, setPairImage] = useState<Slot | null>(null)
  const [pairAudio, setPairAudio] = useState<Slot | null>(null)
  const [embedKind, setEmbedKind] = useState<'none' | 'youtube' | 'video'>('none')
  const [youtubeInput, setYoutubeInput] = useState('')
  const [videoSlot, setVideoSlot] = useState<Slot | null>(null)

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const removeFromStorage = useCallback(async (paths: (string | undefined | null)[]) => {
    const uniq = [...new Set(paths.filter((p): p is string => !!p && p.trim() !== ''))]
    if (uniq.length === 0) return
    await supabase.storage.from('lesson-media').remove(uniq)
  }, [])

  const emit = useCallback(
    (
      image: Slot | null,
      audio: Slot | null,
      kind: 'none' | 'youtube' | 'video',
      yt: string,
      video: Slot | null,
    ) => {
      onMediaChange(buildPayload(image, audio, kind, yt, video))
    },
    [onMediaChange],
  )

  useEffect(() => {
    setYoutubeInput('')
    setPairImage(null)
    setPairAudio(null)
    setVideoSlot(null)
    setEmbedKind('none')

    if (!currentType) return

    if (currentType === 'youtube') {
      setEmbedKind('youtube')
      setYoutubeInput(currentUrl)
      return
    }
    if (currentType === 'video') {
      setEmbedKind('video')
      if (currentUrl) {
        setVideoSlot({ url: currentUrl, path: currentStoragePath })
      }
      return
    }
    if (currentType === 'image') {
      setPairImage(currentUrl ? { url: currentUrl, path: currentStoragePath } : null)
      if (companionTypeProp === 'audio' && companionUrlProp) {
        setPairAudio({ url: companionUrlProp, path: companionStoragePathProp ?? '' })
      }
      return
    }
    if (currentType === 'audio') {
      setPairAudio(currentUrl ? { url: currentUrl, path: currentStoragePath } : null)
      if (companionTypeProp === 'image' && companionUrlProp) {
        setPairImage({ url: companionUrlProp, path: companionStoragePathProp ?? '' })
      }
    }
  }, [currentType, currentUrl, currentStoragePath, companionTypeProp, companionUrlProp, companionStoragePathProp])

  async function handleUploadToSlot(
    file: File,
    slot: 'image' | 'audio' | 'video',
    prevImage: Slot | null,
    prevAudio: Slot | null,
    prevVideo: Slot | null,
  ) {
    setUploading(true)
    setUploadError('')

    try {
      const mediaType = classifyUpload(file)
      if (!mediaType || (slot === 'image' && mediaType !== 'image')) {
        setUploadError(slot === 'image' ? 'Use PNG or JPG for the banner.' : 'Use MP3 for audio.')
        return
      }
      if (slot === 'audio' && mediaType !== 'audio') {
        setUploadError('Use MP3 for audio.')
        return
      }
      if (slot === 'video' && mediaType !== 'video') {
        setUploadError('Use MP4, MOV, or WebM for video.')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${context}-${contextId}-${Date.now()}.${fileExt}`
      const storagePath = `${context}/${fileName}`

      const pathToReplace =
        slot === 'image' ? prevImage?.path : slot === 'audio' ? prevAudio?.path : prevVideo?.path
      if (pathToReplace) {
        await removeFromStorage([pathToReplace])
      }

      const { error } = await supabase.storage.from('lesson-media').upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      })
      if (error) throw error

      const { data: urlData } = supabase.storage.from('lesson-media').getPublicUrl(storagePath)
      const publicUrl = urlData.publicUrl
      const nextSlot: Slot = { url: publicUrl, path: storagePath }

      let nextImage = prevImage
      let nextAudio = prevAudio
      let nextVideo: Slot | null = null

      if (slot === 'image') {
        nextImage = nextSlot
        nextAudio = prevAudio
        await removeFromStorage([prevVideo?.path].filter(Boolean) as string[])
      } else if (slot === 'audio') {
        nextAudio = nextSlot
        nextImage = prevImage
        await removeFromStorage([prevVideo?.path].filter(Boolean) as string[])
      } else {
        nextVideo = nextSlot
        nextImage = null
        nextAudio = null
        await removeFromStorage([prevImage?.path, prevAudio?.path].filter(Boolean) as string[])
      }

      if (slot === 'video') {
        setEmbedKind('video')
        setYoutubeInput('')
        setVideoSlot(nextVideo)
        setPairImage(null)
        setPairAudio(null)
        emit(null, null, 'video', '', nextVideo)
      } else {
        setEmbedKind('none')
        setYoutubeInput('')
        setVideoSlot(null)
        setPairImage(nextImage)
        setPairAudio(nextAudio)
        emit(nextImage, nextAudio, 'none', '', null)
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
    }
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    void handleUploadToSlot(file, 'image', pairImage, pairAudio, videoSlot)
  }

  function handleAudioFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    void handleUploadToSlot(file, 'audio', pairImage, pairAudio, videoSlot)
  }

  function handleVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    void handleUploadToSlot(file, 'video', pairImage, pairAudio, videoSlot)
  }

  async function selectEmbedNone() {
    await removeFromStorage([pairImage?.path, pairAudio?.path, videoSlot?.path])
    setPairImage(null)
    setPairAudio(null)
    setVideoSlot(null)
    setEmbedKind('none')
    setYoutubeInput('')
    emit(null, null, 'none', '', null)
  }

  async function selectYouTubeTab() {
    await removeFromStorage([pairImage?.path, pairAudio?.path, videoSlot?.path])
    setPairImage(null)
    setPairAudio(null)
    setVideoSlot(null)
    setEmbedKind('youtube')
    setYoutubeInput('')
    emit(null, null, 'none', '', null)
  }

  async function selectVideoTab() {
    await removeFromStorage([pairImage?.path, pairAudio?.path, videoSlot?.path])
    setPairImage(null)
    setPairAudio(null)
    setVideoSlot(null)
    setEmbedKind('video')
    setYoutubeInput('')
    imageInputRef.current && (imageInputRef.current.value = '')
    emit(null, null, 'video', '', null)
  }

  function handleYouTubeChange(url: string) {
    setYoutubeInput(url)
    const id = getYouTubeId(url)
    if (id) {
      void removeFromStorage([pairImage?.path, pairAudio?.path, videoSlot?.path])
      setPairImage(null)
      setPairAudio(null)
      setVideoSlot(null)
      setEmbedKind('youtube')
      emit(null, null, 'youtube', url, null)
    } else if (!url.trim()) {
      emit(null, null, 'none', '', null)
    }
  }

  async function removeImageSlot() {
    const p = pairImage?.path
    setPairImage(null)
    if (p) await removeFromStorage([p])
    emit(null, pairAudio, embedKind, youtubeInput, videoSlot)
  }

  async function removeAudioSlot() {
    const p = pairAudio?.path
    setPairAudio(null)
    if (p) await removeFromStorage([p])
    emit(pairImage, null, embedKind, youtubeInput, videoSlot)
  }

  async function removeAllMedia() {
    await removeFromStorage([pairImage?.path, pairAudio?.path, videoSlot?.path])
    setPairImage(null)
    setPairAudio(null)
    setVideoSlot(null)
    setEmbedKind('none')
    setYoutubeInput('')
    emit(null, null, 'none', '', null)
  }

  const tabStyle = (active: boolean) =>
    ({
      padding: '6px 14px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500' as const,
      background: active ? '#F59E0B' : '#0F172A',
      color: active ? '#000' : '#64748B',
      transition: 'all 0.15s',
    }) as const

  const showYoutubePanel = embedKind === 'youtube'
  const showVideoPanel = embedKind === 'video'
  const youtubeId = getYouTubeId(youtubeInput)

  const hasAnything = !!(pairImage || pairAudio || videoSlot || (embedKind === 'youtube' && youtubeId))

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

      <p style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', margin: '0 0 8px' }}>
        Banner + audio (optional pair)
      </p>
      <p style={{ color: '#64748B', fontSize: '11px', margin: '0 0 10px' }}>
        Add an image, a voice track, or both — the image appears above the audio player when both are set.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        <div
          style={{
            background: '#1E293B',
            borderRadius: '8px',
            padding: '12px',
            border: `1px solid ${pairImage ? '#F59E0B' : '#334155'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
            <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '600' }}>🖼 Banner image (PNG/JPG)</span>
            <button
              type="button"
              disabled={uploading || embedKind === 'youtube' || embedKind === 'video'}
              onClick={() => imageInputRef.current?.click()}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '11px',
                fontWeight: '600',
                cursor: uploading || embedKind === 'youtube' || embedKind === 'video' ? 'not-allowed' : 'pointer',
                background: '#334155',
                color: '#E2E8F0',
              }}
            >
              Upload
            </button>
          </div>
          {pairImage ? (
            <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155', aspectRatio: '16 / 9', maxHeight: '160px' }}>
              <img src={pairImage.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ) : (
            <p style={{ color: '#475569', fontSize: '11px', margin: 0 }}>No image</p>
          )}
          {pairImage ? (
            <button
              type="button"
              onClick={() => void removeImageSlot()}
              style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '11px', cursor: 'pointer', marginTop: '8px', padding: 0 }}
            >
              Remove image
            </button>
          ) : null}
        </div>

        <div
          style={{
            background: '#1E293B',
            borderRadius: '8px',
            padding: '12px',
            border: `1px solid ${pairAudio ? '#F59E0B' : '#334155'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '600' }}>🎵 Audio (MP3)</span>
            <button
              type="button"
              disabled={uploading || embedKind === 'youtube' || embedKind === 'video'}
              onClick={() => audioInputRef.current?.click()}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '11px',
                fontWeight: '600',
                cursor: uploading || embedKind === 'youtube' || embedKind === 'video' ? 'not-allowed' : 'pointer',
                background: '#334155',
                color: '#E2E8F0',
              }}
            >
              Upload
            </button>
          </div>
          {pairAudio ? (
            <p style={{ color: '#94A3B8', fontSize: '12px', margin: '8px 0 0' }}>✓ Audio file uploaded</p>
          ) : (
            <p style={{ color: '#475569', fontSize: '11px', margin: '8px 0 0' }}>No audio</p>
          )}
          {pairAudio ? (
            <button
              type="button"
              onClick={() => void removeAudioSlot()}
              style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '11px', cursor: 'pointer', marginTop: '8px', padding: 0 }}
            >
              Remove audio
            </button>
          ) : null}
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,.jpg,.jpeg,.png"
        onChange={(e) => void handleImageFile(e)}
        style={{ display: 'none' }}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,.mp3"
        onChange={(e) => void handleAudioFile(e)}
        style={{ display: 'none' }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        onChange={(e) => void handleVideoFile(e)}
        style={{ display: 'none' }}
      />

      <p style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', margin: '0 0 8px' }}>Or embed</p>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => void selectEmbedNone()} style={tabStyle(embedKind === 'none' && !pairImage && !pairAudio && !videoSlot)}>
          None
        </button>
        <button type="button" onClick={() => void selectYouTubeTab()} style={tabStyle(embedKind === 'youtube')}>
          ▶ YouTube
        </button>
        <button
          type="button"
          onClick={() => {
            void selectVideoTab()
            videoInputRef.current?.click()
          }}
          style={tabStyle(embedKind === 'video')}
        >
          🎬 Video (MP4)
        </button>
      </div>

      {showYoutubePanel ? (
        <div style={{ marginBottom: '12px' }}>
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
              <p style={{ color: '#10B981', fontSize: '11px', margin: '6px 0 0' }}>✓ Valid YouTube link</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {showVideoPanel && videoSlot ? (
        <div style={{ marginBottom: '12px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' }}>
          <video controls style={{ width: '100%', maxHeight: '220px', display: 'block' }} playsInline>
            <source src={videoSlot.url} type="video/mp4" />
          </video>
          <button
            type="button"
            onClick={() => void removeAllMedia()}
            style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '12px', cursor: 'pointer', padding: '8px' }}
          >
            Remove video
          </button>
        </div>
      ) : null}

      {uploading ? (
        <p style={{ color: '#64748B', fontSize: '11px', margin: '0 0 8px' }}>Uploading…</p>
      ) : null}

      {uploadError ? <p style={{ color: '#EF4444', fontSize: '12px', margin: '0 0 8px' }}>Upload failed: {uploadError}</p> : null}

      {hasAnything ? (
        <button
          type="button"
          onClick={() => void removeAllMedia()}
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
          Remove all media
        </button>
      ) : (
        <p style={{ color: '#334155', fontSize: '12px', margin: 0, fontStyle: 'italic' }}>No media attached — text only lesson</p>
      )}
    </div>
  )
}
