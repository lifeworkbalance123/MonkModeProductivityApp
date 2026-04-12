'use client'

import { useState } from 'react'
import { getYouTubeId } from '@/lib/trainingContent'

type AddVideoModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (video: {
    title: string
    description: string
    youtube_url: string
    duration: string
    category: string
    notes: string
  }) => Promise<void>
}

export default function AddVideoModal({ isOpen, onClose, onSave }: AddVideoModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [duration, setDuration] = useState('')
  const [category, setCategory] = useState('Personal')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')

  function handleUrlChange(url: string) {
    setYoutubeUrl(url)
    setError('')
    const id = getYouTubeId(url)
    if (id) {
      setPreview(`https://img.youtube.com/vi/${id}/mqdefault.jpg`)
    } else if (url.length > 10) {
      setError(
        'Invalid YouTube URL. Paste a valid YouTube link e.g. https://www.youtube.com/watch?v=xxxxx',
      )
      setPreview('')
    } else {
      setPreview('')
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }
    if (!getYouTubeId(youtubeUrl)) {
      setError('Please enter a valid YouTube URL')
      return
    }
    setSaving(true)
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        youtube_url: youtubeUrl.trim(),
        duration: duration.trim(),
        category,
        notes: notes.trim(),
      })
      setTitle('')
      setDescription('')
      setYoutubeUrl('')
      setDuration('')
      setCategory('Personal')
      setNotes('')
      setPreview('')
      setError('')
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const inputStyle = {
    width: '100%',
    background: '#0F172A',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '10px 14px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    color: '#94A3B8',
    fontSize: '12px',
    marginBottom: '6px',
    fontWeight: '500' as const,
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
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
          background: '#1E293B',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '540px',
          border: '1px solid #334155',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #334155',
          }}
        >
          <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: 0 }}>
            Add to personal library
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#334155',
              border: 'none',
              color: '#94A3B8',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>YouTube URL *</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              style={inputStyle}
            />
            {error ? (
              <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{error}</p>
            ) : null}
          </div>

          {preview ? (
            <div style={{ marginBottom: '16px' }}>
              <img
                src={preview}
                alt="Video thumbnail"
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #334155' }}
              />
              <p style={{ color: '#10B981', fontSize: '12px', marginTop: '6px' }}>
                ✓ Valid YouTube link detected
              </p>
            </div>
          ) : null}

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Title *</label>
            <input
              type="text"
              placeholder="e.g. My favourite motivation video"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Description (optional)</label>
            <textarea
              placeholder="What is this video about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div>
              <label style={labelStyle}>Duration (optional)</label>
              <input
                type="text"
                placeholder="e.g. 15 min"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {[
                  'Personal',
                  'Motivation',
                  'Focus',
                  'Habits',
                  'Mindset',
                  'Fitness',
                  'Business',
                  'Other',
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Personal notes (optional)</label>
            <textarea
              placeholder="Your key takeaways or reminders from this video..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: '#334155',
                color: '#E2E8F0',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              style={{
                flex: 1,
                background: '#F59E0B',
                color: '#000',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? 'Saving…' : 'Save to library'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
