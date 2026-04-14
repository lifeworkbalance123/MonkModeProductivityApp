'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'
import MediaUploader, { type MediaType } from '@/components/admin/MediaUploader'

type Tab = 'lessons' | 'onboarding' | 'habits' | 'training'

const ONBOARDING_STEP_ORDER = ['welcome', 'why', 'commitment', 'setup', 'ready'] as const

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<Tab>('lessons')

  useEffect(() => {
    void fetch('/api/admin/setup-storage', { method: 'POST' }).catch(() => {})
  }, [])

  const tabStyle = (tab: Tab) =>
    ({
      padding: '8px 20px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500' as const,
      background: activeTab === tab ? '#F59E0B' : '#1E293B',
      color: activeTab === tab ? '#000' : '#94A3B8',
      transition: 'all 0.15s',
    }) as const

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '600', margin: '0 0 4px' }}>Content Manager</h1>
        <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
          Edit lessons, onboarding steps, and default habits without touching any code.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <button type="button" style={tabStyle('lessons')} onClick={() => setActiveTab('lessons')}>
          Daily Lessons
        </button>
        <button type="button" style={tabStyle('onboarding')} onClick={() => setActiveTab('onboarding')}>
          Onboarding Steps
        </button>
        <button type="button" style={tabStyle('habits')} onClick={() => setActiveTab('habits')}>
          Default Habits
        </button>
        <button type="button" style={tabStyle('training')} onClick={() => setActiveTab('training')}>
          🎬 Training Videos
        </button>
      </div>

      {activeTab === 'lessons' ? <LessonsEditor /> : null}
      {activeTab === 'onboarding' ? <OnboardingEditor /> : null}
      {activeTab === 'habits' ? <HabitsEditor /> : null}
      {activeTab === 'training' ? <TrainingVideosEditor /> : null}
    </div>
  )
}

type LessonRow = {
  id?: string
  day_number: number
  phase: string
  title: string
  lesson: string
  action: string
  action_label: string
  category: string
  tip: string
  published: boolean
  media_type?: string | null
  media_url?: string | null
  media_storage_path?: string | null
  is_bonus?: boolean
  parent_day_number?: number | null
}

function LessonsEditor() {
  const { showToast } = useToast()
  const [lessons, setLessons] = useState<LessonRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<LessonRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [filterPhase, setFilterPhase] = useState('all')
  const [search, setSearch] = useState('')
  const [maxDay, setMaxDay] = useState(60)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')
  const editSessionKeyRef = useRef<string>('')

  const loadLessons = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('lessons').select('*').order('day_number', { ascending: true })
    if (error) {
      showToast(error.message, 'error')
      setLessons([])
    } else {
      const rows = (data as LessonRow[]) || []
      rows.sort((a, b) => {
        if (a.day_number !== b.day_number) return a.day_number - b.day_number
        return (a.is_bonus ? 1 : 0) - (b.is_bonus ? 1 : 0)
      })
      setLessons(rows)
      const maxFromDb = rows.reduce((m, r) => Math.max(m, r.day_number), 0)
      if (maxFromDb > 0) {
        setMaxDay((prev) => Math.min(120, Math.max(prev, maxFromDb)))
      }
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => {
    void loadLessons()
  }, [loadLessons])

  const lessonPayload = useCallback((row: LessonRow) => {
    const isBonus = !!row.is_bonus
    return {
      day_number: row.day_number,
      phase: row.phase,
      title: row.title,
      lesson: row.lesson,
      action: row.action,
      action_label: row.action_label,
      category: row.category,
      tip: row.tip || '',
      published: row.published,
      media_type: row.media_type || null,
      media_url: row.media_url || null,
      media_storage_path: row.media_storage_path || null,
      is_bonus: isBonus,
      parent_day_number: isBonus ? (row.parent_day_number ?? row.day_number) : null,
      updated_at: new Date().toISOString(),
    }
  }, [])

  const performSave = useCallback(
    async (lessonData: LessonRow) => {
      if (!lessonData?.title || !lessonData?.lesson || !lessonData?.action) {
        return
      }

      const dataString = JSON.stringify(lessonPayload(lessonData))
      if (dataString === lastSavedRef.current) {
        return
      }

      setAutoSaveStatus('saving')

      try {
        const { error } = await supabase
          .from('lessons')
          .upsert(lessonPayload(lessonData), { onConflict: 'day_number,is_bonus' })

        if (error) throw error

        lastSavedRef.current = dataString
        setAutoSaveStatus('saved')
        setTimeout(() => setAutoSaveStatus('idle'), 3000)
      } catch {
        setAutoSaveStatus('error')
      }
    },
    [lessonPayload],
  )

  useEffect(() => {
    if (!editing) {
      editSessionKeyRef.current = ''
      return
    }
    const sessionKey = `${editing.day_number}-${editing.is_bonus ? 'b' : 'p'}-${editing.id ?? 'new'}`
    if (sessionKey === editSessionKeyRef.current) return
    editSessionKeyRef.current = sessionKey
    const complete = !!(editing.title && editing.lesson && editing.action)
    lastSavedRef.current = complete ? JSON.stringify(lessonPayload(editing)) : ''
  }, [editing, lessonPayload])

  useEffect(() => {
    if (!editing) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      void performSave(editing)
    }, 30000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [editing, performSave])

  useEffect(() => {
    function handleBlur() {
      if (editing) void performSave(editing)
    }

    function handleVisibility() {
      if (document.hidden && editing) void performSave(editing)
    }

    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [editing, performSave])

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      const dataString = editing ? JSON.stringify(lessonPayload(editing)) : ''
      if (editing && dataString !== lastSavedRef.current) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [editing, lessonPayload])

  async function saveLesson() {
    if (!editing) return
    setSaving(true)
    const { error } = await supabase
      .from('lessons')
      .upsert(lessonPayload(editing), { onConflict: 'day_number,is_bonus' })
    setSaving(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    lastSavedRef.current = JSON.stringify(lessonPayload(editing))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    await loadLessons()
    setEditing(null)
  }

  function createNewLesson(day: number) {
    setEditing({
      day_number: day,
      phase: day <= 30 ? 'student' : day <= 60 ? 'monk' : 'master',
      title: '',
      lesson: '',
      action: '',
      action_label: 'Done ✓',
      category: 'focus',
      tip: '',
      published: true,
      is_bonus: false,
      parent_day_number: null,
      media_type: null,
      media_url: '',
      media_storage_path: '',
    })
  }

  async function createBonusLesson(dayNumber: number) {
    setEditing({
      day_number: dayNumber,
      phase: dayNumber <= 30 ? 'student' : dayNumber <= 60 ? 'monk' : 'master',
      title: '',
      lesson: '',
      action: '',
      action_label: 'Done ✓',
      category: 'focus',
      tip: '',
      published: true,
      is_bonus: true,
      parent_day_number: dayNumber,
      media_type: null,
      media_url: '',
      media_storage_path: '',
    })
  }

  const allDays = Array.from({ length: maxDay }, (_, i) => i + 1)

  const lessonsMap: Record<string, { primary: LessonRow | null; bonus: LessonRow | null }> = {}
  lessons.forEach((l) => {
    const day = l.day_number.toString()
    if (!lessonsMap[day]) {
      lessonsMap[day] = { primary: null, bonus: null }
    }
    if (l.is_bonus) {
      lessonsMap[day].bonus = l
    } else {
      lessonsMap[day].primary = l
    }
  })

  const filtered = allDays.filter((day) => {
    const slot = lessonsMap[day.toString()]
    const primary = slot?.primary
    if (filterPhase === 'student' && day > 30) return false
    if (filterPhase === 'monk' && (day < 31 || day > 60)) return false
    if (filterPhase === 'master' && (day < 61 || day > maxDay)) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const inPrimary = !!(primary?.title && primary.title.toLowerCase().includes(q))
      const inBonus = !!(slot?.bonus?.title && slot.bonus.title.toLowerCase().includes(q))
      if (!inPrimary && !inBonus) return false
    }
    return true
  })

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
    fontWeight: '500' as const,
    marginBottom: '6px',
  }

  if (editing !== null) {
    return (
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: '0 0 4px' }}>
              Day {editing.day_number} — {editing.title || 'New lesson'}
            </h2>
            <p style={{ color: '#64748B', fontSize: '13px', margin: 0, textTransform: 'capitalize' }}>
              {editing.phase} phase · {editing.category}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              {autoSaveStatus === 'saving' ? (
                <span style={{ color: '#64748B' }}>⏳ Auto-saving...</span>
              ) : null}
              {autoSaveStatus === 'saved' ? (
                <span style={{ color: '#10B981' }}>✓ Auto-saved</span>
              ) : null}
              {autoSaveStatus === 'error' ? (
                <span style={{ color: '#EF4444' }}>✗ Auto-save failed</span>
              ) : null}
              {autoSaveStatus === 'idle' && editing ? (
                <span style={{ color: '#475569' }}>Auto-saves on tab switch</span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setEditing(null)}
              style={{
                background: '#1E293B',
                border: '1px solid #334155',
                color: '#94A3B8',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              ← Back to list
            </button>
          </div>
        </div>

        <div style={{ background: '#1E293B', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
          {editing.is_bonus ? (
            <div
              style={{
                background: '#2E1065',
                border: '1px solid #7C3AED',
                borderRadius: '8px',
                padding: '10px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '14px' }}>✨</span>
              <span style={{ color: '#C4B5FD', fontSize: '13px' }}>
                Bonus lesson for Day {editing.day_number} — this is optional content shown as a second tab on the
                Today page
              </span>
            </div>
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Phase</label>
              <select
                value={editing.phase}
                onChange={(e) => setEditing({ ...editing, phase: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="student">Student (Days 1-30)</option>
                <option value="monk">Monk (Days 31-60)</option>
                <option value="master">Master (Days 61-90)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {['environment', 'focus', 'physical', 'mindset', 'social', 'routine', 'reflection'].map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Lesson title *</label>
            <input
              type="text"
              placeholder="e.g. Your environment is your destiny"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Lesson content * (2-3 min read)</label>
            <textarea
              rows={10}
              placeholder="Write the lesson here. Use line breaks for paragraphs."
              value={editing.lesson}
              onChange={(e) => setEditing({ ...editing, lesson: e.target.value })}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }}
            />
            <p style={{ color: '#475569', fontSize: '11px', margin: '4px 0 0' }}>
              {editing.lesson.split(/\s+/).filter(Boolean).length} words (aim for 100-250)
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <MediaUploader
              key={`${editing.day_number}-${editing.is_bonus ? 'bonus' : 'primary'}`}
              currentType={(editing.media_type as MediaType) ?? null}
              currentUrl={editing.media_url ?? ''}
              currentStoragePath={editing.media_storage_path ?? ''}
              onMediaChange={(data) =>
                setEditing({
                  ...editing,
                  media_type: data.type,
                  media_url: data.url,
                  media_storage_path: data.storagePath,
                })
              }
              context="lesson"
              contextId={editing.day_number?.toString() ?? '0'}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Today&apos;s action *</label>
            <textarea
              rows={2}
              placeholder="e.g. Move your phone to another room before bed tonight."
              value={editing.action}
              onChange={(e) => setEditing({ ...editing, action: e.target.value })}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Action button label *</label>
            <input
              type="text"
              placeholder="e.g. Phone is moved ✓"
              value={editing.action_label}
              onChange={(e) => setEditing({ ...editing, action_label: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Post-completion tip (optional)</label>
            <textarea
              rows={2}
              placeholder="Shown after the user completes the action."
              value={editing.tip}
              onChange={(e) => setEditing({ ...editing, tip: e.target.value })}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <input
              type="checkbox"
              id="published"
              checked={editing.published}
              onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="published" style={{ color: '#CBD5E1', fontSize: '14px', cursor: 'pointer' }}>
              Published (visible to users)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => void saveLesson()}
              disabled={saving || !editing.title || !editing.lesson || !editing.action}
              style={{
                background: editing.title && editing.lesson && editing.action ? '#F59E0B' : '#334155',
                color: editing.title && editing.lesson && editing.action ? '#000' : '#64748B',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 28px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : `Save Day ${editing.day_number}`}
            </button>
            {saved ? (
              <span style={{ color: '#10B981', fontSize: '13px' }}>✓ Saved successfully</span>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Search lesson titles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 14px',
            color: 'white',
            fontSize: '13px',
            outline: 'none',
            width: '220px',
          }}
        />
        <select
          value={filterPhase}
          onChange={(e) => setFilterPhase(e.target.value)}
          style={{
            background: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 14px',
            color: 'white',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <option value="all">All phases</option>
          <option value="student">Student (1-30)</option>
          <option value="monk">Monk (31-60)</option>
          <option value="master">Master (61+)</option>
        </select>
        <span style={{ color: '#64748B', fontSize: '13px', marginLeft: 'auto' }}>
          {lessons.filter((l) => !l.is_bonus).length}/{maxDay} days have content
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
        {loading ? (
          <p style={{ color: '#64748B', fontSize: '14px' }}>Loading lessons...</p>
        ) : (
          filtered.map((day) => {
            const slot = lessonsMap[day.toString()] ?? { primary: null, bonus: null }
            const primary = slot.primary
            const bonus = slot.bonus
            const hasContent = !!primary
            const hasBonusContent = !!bonus
            const displayLesson = primary ?? bonus
            const hasAny = !!displayLesson

            function openRowEditor() {
              if (primary) {
                setEditing({
                  ...primary,
                  media_type: primary.media_type ?? null,
                  media_url: primary.media_url ?? '',
                  media_storage_path: primary.media_storage_path ?? '',
                  is_bonus: !!primary.is_bonus,
                  parent_day_number: primary.parent_day_number ?? null,
                })
              } else if (bonus) {
                setEditing({
                  ...bonus,
                  media_type: bonus.media_type ?? null,
                  media_url: bonus.media_url ?? '',
                  media_storage_path: bonus.media_storage_path ?? '',
                  is_bonus: true,
                  parent_day_number: bonus.parent_day_number ?? day,
                })
              } else {
                createNewLesson(day)
              }
            }

            return (
              <div
                key={day}
                role="button"
                tabIndex={0}
                onClick={() => openRowEditor()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openRowEditor()
                  }
                }}
                style={{
                  background: '#1E293B',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  border: `1px solid ${hasAny ? '#334155' : '#1E293B'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'border-color 0.15s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#F59E0B'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = hasAny ? '#334155' : '#1E293B'
                }}
              >
                <div
                  style={{
                    background: hasAny ? '#F59E0B' : '#334155',
                    color: hasAny ? '#000' : '#64748B',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    minWidth: '44px',
                    textAlign: 'center',
                    flexShrink: 0,
                  }}
                >
                  Day {day}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      color: hasAny ? 'white' : '#475569',
                      fontSize: '13px',
                      fontWeight: '500',
                      margin: '0 0 2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {hasAny ? (displayLesson?.title ?? '') : 'No content yet — click to add'}
                  </p>
                  {hasAny && displayLesson ? (
                    <p style={{ color: '#64748B', fontSize: '11px', margin: 0, textTransform: 'capitalize' }}>
                      {displayLesson.category} · {displayLesson.published ? 'Published' : 'Draft'}
                    </p>
                  ) : null}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {hasContent && !hasBonusContent ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        createBonusLesson(day)
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#8B5CF6',
                        fontSize: '10px',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        flexShrink: 0,
                      }}
                      title="Add bonus lesson for this day"
                    >
                      + Bonus
                    </button>
                  ) : null}
                  {hasBonusContent && bonus ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditing({
                          ...bonus,
                          media_type: bonus.media_type ?? null,
                          media_url: bonus.media_url ?? '',
                          media_storage_path: bonus.media_storage_path ?? '',
                          is_bonus: true,
                          parent_day_number: bonus.parent_day_number ?? day,
                        })
                      }}
                      style={{
                        background: '#4C1D95',
                        color: '#C4B5FD',
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        flexShrink: 0,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      title="Edit bonus lesson"
                    >
                      + Bonus
                    </button>
                  ) : null}
                  <span style={{ fontSize: '14px' }}>
                    {hasAny && displayLesson ? (displayLesson.published ? '✅' : '📝') : '➕'}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div
        style={{
          textAlign: 'center',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #334155',
        }}
      >
        <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '10px' }}>
          Program length: {maxDay} days
          {maxDay === 60 ? (
            <span style={{ color: '#475569', marginLeft: '8px' }}>(Standard program)</span>
          ) : null}
          {maxDay === 90 ? (
            <span style={{ color: '#8B5CF6', marginLeft: '8px' }}>(Master extension included)</span>
          ) : null}
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {maxDay < 90 ? (
            <button
              type="button"
              onClick={() => setMaxDay(90)}
              style={{
                background: '#1E293B',
                border: '1px solid #8B5CF6',
                color: '#8B5CF6',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              + Add Days 61-90 (Master Phase)
            </button>
          ) : null}
          {maxDay < 120 ? (
            <button
              type="button"
              onClick={() => setMaxDay((prev) => prev + 10)}
              style={{
                background: '#1E293B',
                border: '1px solid #334155',
                color: '#94A3B8',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              + Add 10 more days
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

type OnboardingContentStep = {
  step_key: string
  heading: string
  body: string
  cta_label: string
  highlight_text: string | null
  media_type?: string | null
  media_url?: string | null
  media_storage_path?: string | null
}

function onboardingStepSerialize(s: OnboardingContentStep) {
  return JSON.stringify({
    step_key: s.step_key,
    heading: s.heading,
    body: s.body,
    cta_label: s.cta_label,
    highlight_text: s.highlight_text ?? '',
    media_type: s.media_type ?? null,
    media_url: s.media_url ?? '',
    media_storage_path: s.media_storage_path ?? '',
  })
}

function OnboardingEditor() {
  const { showToast } = useToast()
  const [steps, setSteps] = useState<OnboardingContentStep[]>([])
  const [editingStep, setEditingStep] = useState<OnboardingContentStep | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')
  const onboardSessionKeyRef = useRef<string>('')

  const STEP_LABELS: Record<string, string> = {
    welcome: '1. Welcome screen',
    why: '2. Why are you here?',
    commitment: '3. The commitment',
    setup: '4. Quick setup',
    ready: '5. Ready to begin',
  }

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('onboarding_content').select('*')
    if (error) {
      showToast(error.message, 'error')
      setSteps([])
    } else {
      const rows = (data || []) as OnboardingContentStep[]
      rows.sort(
        (a, b) =>
          ONBOARDING_STEP_ORDER.indexOf(a.step_key as (typeof ONBOARDING_STEP_ORDER)[number]) -
          ONBOARDING_STEP_ORDER.indexOf(b.step_key as (typeof ONBOARDING_STEP_ORDER)[number]),
      )
      setSteps(rows)
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => {
    void load()
  }, [load])

  const performOnboardingSave = useCallback(async (step: OnboardingContentStep) => {
    const dataString = onboardingStepSerialize(step)
    if (dataString === lastSavedRef.current) {
      return
    }

    setAutoSaveStatus('saving')

    try {
      const { error } = await supabase
        .from('onboarding_content')
        .update({
          heading: step.heading,
          body: step.body,
          cta_label: step.cta_label,
          highlight_text: step.highlight_text || '',
          media_type: step.media_type || null,
          media_url: step.media_url || null,
          media_storage_path: step.media_storage_path || null,
          updated_at: new Date().toISOString(),
        })
        .eq('step_key', step.step_key)

      if (error) throw error

      lastSavedRef.current = dataString
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus('idle'), 3000)
    } catch {
      setAutoSaveStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!editingStep) {
      onboardSessionKeyRef.current = ''
      return
    }
    const key = editingStep.step_key
    if (key === onboardSessionKeyRef.current) return
    onboardSessionKeyRef.current = key
    lastSavedRef.current = onboardingStepSerialize(editingStep)
  }, [editingStep])

  useEffect(() => {
    if (!editingStep) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      void performOnboardingSave(editingStep)
    }, 30000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [editingStep, performOnboardingSave])

  useEffect(() => {
    function handleBlur() {
      if (editingStep) void performOnboardingSave(editingStep)
    }

    function handleVisibility() {
      if (document.hidden && editingStep) void performOnboardingSave(editingStep)
    }

    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [editingStep, performOnboardingSave])

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      const dataString = editingStep ? onboardingStepSerialize(editingStep) : ''
      if (editingStep && dataString !== lastSavedRef.current) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [editingStep])

  async function saveStep() {
    if (!editingStep) return
    setSaving(true)
    const { error } = await supabase
      .from('onboarding_content')
      .update({
        heading: editingStep.heading,
        body: editingStep.body,
        cta_label: editingStep.cta_label,
        highlight_text: editingStep.highlight_text || '',
        media_type: editingStep.media_type || null,
        media_url: editingStep.media_url || null,
        media_storage_path: editingStep.media_storage_path || null,
        updated_at: new Date().toISOString(),
      })
      .eq('step_key', editingStep.step_key)
    setSaving(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    lastSavedRef.current = onboardingStepSerialize(editingStep)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    await load()
    setEditingStep(null)
  }

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
    fontWeight: '500' as const,
    marginBottom: '6px',
  }

  if (editingStep) {
    return (
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: 0 }}>
            Edit: {STEP_LABELS[editingStep.step_key] ?? editingStep.step_key}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              {autoSaveStatus === 'saving' ? (
                <span style={{ color: '#64748B' }}>⏳ Auto-saving...</span>
              ) : null}
              {autoSaveStatus === 'saved' ? (
                <span style={{ color: '#10B981' }}>✓ Auto-saved</span>
              ) : null}
              {autoSaveStatus === 'error' ? (
                <span style={{ color: '#EF4444' }}>✗ Auto-save failed</span>
              ) : null}
              {autoSaveStatus === 'idle' && editingStep ? (
                <span style={{ color: '#475569' }}>Auto-saves on tab switch</span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setEditingStep(null)}
              style={{
                background: '#1E293B',
                border: '1px solid #334155',
                color: '#94A3B8',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              ← Back
            </button>
          </div>
        </div>

        <div style={{ background: '#1E293B', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Heading</label>
            <input
              type="text"
              value={editingStep.heading}
              onChange={(e) => setEditingStep({ ...editingStep, heading: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Body text (use line breaks for paragraphs)</label>
            <textarea
              rows={6}
              value={editingStep.body}
              onChange={(e) => setEditingStep({ ...editingStep, body: e.target.value })}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <MediaUploader
              key={editingStep.step_key}
              currentType={(editingStep.media_type as MediaType) ?? null}
              currentUrl={editingStep.media_url ?? ''}
              currentStoragePath={editingStep.media_storage_path ?? ''}
              onMediaChange={(data) =>
                setEditingStep({
                  ...editingStep,
                  media_type: data.type,
                  media_url: data.url,
                  media_storage_path: data.storagePath,
                })
              }
              context="onboarding"
              contextId={editingStep.step_key}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Highlight card text (amber card — leave empty to hide)</label>
            <textarea
              rows={3}
              placeholder="e.g. Who do I want to be in 60 days?"
              value={editingStep.highlight_text ?? ''}
              onChange={(e) => setEditingStep({ ...editingStep, highlight_text: e.target.value })}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Button label</label>
            <input
              type="text"
              value={editingStep.cta_label}
              onChange={(e) => setEditingStep({ ...editingStep, cta_label: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => void saveStep()}
              disabled={saving}
              style={{
                background: '#F59E0B',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 28px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save step'}
            </button>
            {saved ? <span style={{ color: '#10B981', fontSize: '13px' }}>✓ Saved</span> : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>
        Click any step to edit. Changes apply for users loading /onboarding.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <p style={{ color: '#64748B' }}>Loading...</p>
        ) : (
          steps.map((step) => (
            <div
              key={step.step_key}
              role="button"
              tabIndex={0}
              onClick={() => setEditingStep({ ...step })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setEditingStep({ ...step })
                }
              }}
              style={{
                background: '#1E293B',
                borderRadius: '10px',
                padding: '16px 20px',
                border: '1px solid #334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'border-color 0.15s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#F59E0B'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#334155'
              }}
            >
              <div>
                <p style={{ color: 'white', fontSize: '14px', fontWeight: '500', margin: '0 0 4px' }}>
                  {STEP_LABELS[step.step_key] ?? step.step_key}
                </p>
                <p
                  style={{
                    color: '#64748B',
                    fontSize: '12px',
                    margin: 0,
                    maxWidth: '500px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {step.heading}
                </p>
              </div>
              <span style={{ color: '#F59E0B', fontSize: '13px' }}>Edit →</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

type OnboardingHabitAdmin = { id: string; name: string; icon: string; active: boolean; display_order: number }

type TrainingModuleAdmin = {
  id: string
  title: string
  description: string
  youtube_url: string
  duration: string
  type: string
  is_pro: boolean
  category: string
  display_order: number
  published: boolean
}

function TrainingVideosEditor() {
  const { showToast } = useToast()
  const [modules, setModules] = useState<TrainingModuleAdmin[]>([])
  const [editing, setEditing] = useState<TrainingModuleAdmin | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const fallbackFromConfig: TrainingModuleAdmin[] = [
    {
      id: 'monk-mode-explained',
      title: 'Monk Mode Explained',
      description: 'What monk mode is, why it works, and how to apply it to your daily life starting today.',
      youtube_url: '',
      duration: '15 min',
      type: 'video',
      is_pro: false,
      category: 'Foundations',
      display_order: 1,
      published: true,
    },
    {
      id: 'pomodoro-technique',
      title: 'The Pomodoro Technique',
      description: 'Master 25-minute focused sessions to maximise productivity and beat procrastination.',
      youtube_url: '',
      duration: '12 min',
      type: 'video',
      is_pro: false,
      category: 'Focus',
      display_order: 2,
      published: true,
    },
    {
      id: 'time-boxing-mastery',
      title: 'Time Boxing Mastery',
      description: 'Schedule every minute of your day with intention.',
      youtube_url: '',
      duration: '18 min',
      type: 'video',
      is_pro: true,
      category: 'Planning',
      display_order: 3,
      published: true,
    },
    {
      id: 'atomic-habits',
      title: 'Building Atomic Habits',
      description: 'Small changes, remarkable results. The science behind habits that stick.',
      youtube_url: '',
      duration: '22 min',
      type: 'video',
      is_pro: true,
      category: 'Habits',
      display_order: 4,
      published: true,
    },
    {
      id: 'deep-work-protocol',
      title: 'Deep Work Protocol',
      description: 'Cal Newport\'s framework for producing your best work in distraction-free sprints.',
      youtube_url: '',
      duration: '25 min',
      type: 'video',
      is_pro: true,
      category: 'Focus',
      display_order: 5,
      published: true,
    },
    {
      id: 'morning-routine',
      title: 'Morning Routine Blueprint',
      description: 'Design a powerful morning routine that sets the tone for a focused day.',
      youtube_url: '',
      duration: '18 min',
      type: 'video',
      is_pro: true,
      category: 'Routine',
      display_order: 6,
      published: true,
    },
    {
      id: 'evening-reflection',
      title: 'Evening Reflection Practice',
      description: 'How to review your day and prepare for an even better tomorrow.',
      youtube_url: '',
      duration: '10 min',
      type: 'video',
      is_pro: true,
      category: 'Routine',
      display_order: 7,
      published: true,
    },
    {
      id: 'stoic-mindset',
      title: 'Stoic Mindset for High Performance',
      description: 'Ancient philosophy meets modern productivity.',
      youtube_url: '',
      duration: '20 min',
      type: 'video',
      is_pro: true,
      category: 'Mindset',
      display_order: 8,
      published: true,
    },
  ]

  useEffect(() => {
    void loadModules()
  }, [])

  async function loadModules() {
    setLoading(true)
    const { data, error } = await supabase
      .from('training_modules')
      .select('*')
      .order('display_order', { ascending: true })
    if (error) {
      showToast(error.message, 'error')
      setModules(fallbackFromConfig)
    } else {
      const rows = (data as TrainingModuleAdmin[] | null) ?? []
      setModules(rows.length > 0 ? rows : fallbackFromConfig)
    }
    setLoading(false)
  }

  async function saveModule() {
    if (!editing) return
    setSaving(true)
    const { error } = await supabase
      .from('training_modules')
      .upsert(
        {
          id: editing.id,
          title: editing.title,
          description: editing.description,
          youtube_url: editing.youtube_url,
          duration: editing.duration,
          type: editing.type,
          is_pro: editing.is_pro,
          category: editing.category,
          display_order: editing.display_order,
          published: editing.published,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )

    setSaving(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    await loadModules()
    setEditing(null)
  }

  function getYouTubeId(url: string) {
    if (!url) return null
    const patterns = [/youtube\.com\/watch\?v=([^&\s]+)/, /youtu\.be\/([^?\s]+)/, /youtube\.com\/embed\/([^?\s]+)/]
    for (const p of patterns) {
      const match = url.match(p)
      if (match) return match[1]
    }
    return null
  }

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
    fontWeight: '500' as const,
    marginBottom: '6px',
  }

  if (editing) {
    const videoId = getYouTubeId(editing.youtube_url)
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: 0 }}>Edit: {editing.title}</h2>
          <button
            type="button"
            onClick={() => setEditing(null)}
            style={{
              background: '#1E293B',
              border: '1px solid #334155',
              color: '#94A3B8',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            ← Back to list
          </button>
        </div>

        <div style={{ background: '#1E293B', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>YouTube URL * (paste full YouTube link here)</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={editing.youtube_url}
              onChange={(e) => setEditing({ ...editing, youtube_url: e.target.value })}
              style={{ ...inputStyle, borderColor: videoId ? '#10B981' : '#334155' }}
            />
            {videoId ? (
              <div style={{ marginTop: '10px' }}>
                <img
                  src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                  alt="Video thumbnail"
                  style={{ width: '100%', maxWidth: '320px', borderRadius: '8px', border: '1px solid #334155' }}
                />
                <p style={{ color: '#10B981', fontSize: '12px', marginTop: '6px' }}>
                  ✓ Valid YouTube link — thumbnail preview above
                </p>
              </div>
            ) : null}
            {editing.youtube_url && !videoId ? (
              <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>
                ✗ Could not detect YouTube ID — check the URL format
              </p>
            ) : null}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Title *</label>
            <input
              type="text"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              rows={3}
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Duration</label>
              <input
                type="text"
                placeholder="e.g. 15 min"
                value={editing.duration}
                onChange={(e) => setEditing({ ...editing, duration: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {['Foundations', 'Focus', 'Planning', 'Habits', 'Mindset', 'Routine', 'Physical', 'Other'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#CBD5E1', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={editing.is_pro}
                onChange={(e) => setEditing({ ...editing, is_pro: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              Pro only (locked for free users)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#CBD5E1', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={editing.published}
                onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              Published (visible to users)
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => void saveModule()}
              disabled={saving || !editing.title}
              style={{
                background: editing.title ? '#F59E0B' : '#334155',
                color: editing.title ? '#000' : '#64748B',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 28px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save module'}
            </button>
            {saved ? (
              <span style={{ color: '#10B981', fontSize: '13px' }}>✓ Saved — changes are live immediately</span>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p style={{ color: '#64748B', fontSize: '14px', margin: '0 0 20px', lineHeight: '1.6' }}>
        Click any module to add or update its YouTube URL. Changes are live immediately — no code changes needed.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <p style={{ color: '#64748B' }}>Loading modules...</p>
        ) : (
          modules.map((module) => {
            const hasVideo = !!module.youtube_url
            const videoId = getYouTubeId(module.youtube_url)
            return (
              <div
                key={module.id}
                onClick={() => setEditing({ ...module })}
                style={{
                  background: '#1E293B',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  border: `1px solid ${hasVideo ? '#334155' : '#EF444422'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'border-color 0.15s',
                }}
                onMouseOver={(e) => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = '#F59E0B'
                }}
                onMouseOut={(e) => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = hasVideo ? '#334155' : '#EF444422'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '40px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {videoId ? (
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                      alt={module.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '20px' }}>🎬</span>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ color: 'white', fontSize: '14px', fontWeight: '500', margin: '0 0 3px' }}>{module.title}</p>
                  <p style={{ color: '#64748B', fontSize: '12px', margin: 0 }}>
                    {module.category} · {module.duration} · {module.is_pro ? 'Pro' : 'Free'} ·{' '}
                    {module.published ? 'Published' : 'Draft'}
                  </p>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {hasVideo ? (
                    <span
                      style={{
                        background: '#065F46',
                        color: '#10B981',
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      ✓ Video linked
                    </span>
                  ) : (
                    <span
                      style={{
                        background: '#450A0A',
                        color: '#EF4444',
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      No video yet
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function HabitsEditor() {
  const { showToast } = useToast()
  const [habits, setHabits] = useState<OnboardingHabitAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('✅')
  const [adding, setAdding] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadHabits = useCallback(async () => {
    const { data, error } = await supabase.from('onboarding_habits').select('*').order('display_order', { ascending: true })
    if (error) {
      showToast(error.message, 'error')
      setHabits([])
    } else {
      setHabits((data as OnboardingHabitAdmin[]) || [])
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => {
    void loadHabits()
  }, [loadHabits])

  async function addHabit() {
    if (!newName.trim()) return
    setAdding(true)
    const { error } = await supabase.from('onboarding_habits').insert({
      name: newName.trim(),
      icon: newIcon,
      display_order: habits.length + 1,
      active: true,
    })
    setAdding(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    setNewName('')
    setNewIcon('✅')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    await loadHabits()
  }

  async function toggleHabit(id: string, active: boolean) {
    const { error } = await supabase.from('onboarding_habits').update({ active: !active }).eq('id', id)
    if (error) showToast(error.message, 'error')
    await loadHabits()
  }

  async function deleteHabit(id: string) {
    const { error } = await supabase.from('onboarding_habits').delete().eq('id', id)
    if (error) showToast(error.message, 'error')
    await loadHabits()
  }

  const inputStyle = {
    background: '#0F172A',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '10px 14px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <p style={{ color: '#64748B', fontSize: '14px', margin: '0 0 20px' }}>
        These habits are added to new users when they complete onboarding (if they have no habits yet).
      </p>
      <div style={{ marginBottom: '24px' }}>
        {loading ? (
          <p style={{ color: '#64748B' }}>Loading...</p>
        ) : (
          habits.map((habit) => (
            <div
              key={habit.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: '#1E293B',
                borderRadius: '8px',
                border: '1px solid #334155',
                marginBottom: '8px',
                opacity: habit.active ? 1 : 0.5,
              }}
            >
              <span style={{ fontSize: '18px' }}>{habit.icon}</span>
              <span style={{ color: habit.active ? 'white' : '#64748B', fontSize: '14px', flex: 1 }}>{habit.name}</span>
              <button
                type="button"
                onClick={() => void toggleHabit(habit.id, habit.active)}
                style={{
                  background: 'transparent',
                  border: '1px solid #334155',
                  color: habit.active ? '#10B981' : '#64748B',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                {habit.active ? 'Active' : 'Inactive'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete "${habit.name}"?`)) void deleteHabit(habit.id)
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#EF4444',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '4px',
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
      <div style={{ background: '#1E293B', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
        <p style={{ color: '#94A3B8', fontSize: '13px', fontWeight: '500', margin: '0 0 12px' }}>Add a new default habit</p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Icon"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            style={{ ...inputStyle, width: '70px', textAlign: 'center', fontSize: '20px' }}
          />
          <input
            type="text"
            placeholder="Habit name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void addHabit()
            }}
            style={{ ...inputStyle, flex: '1', minWidth: '120px' }}
          />
          <button
            type="button"
            onClick={() => void addHabit()}
            disabled={!newName.trim() || adding}
            style={{
              background: newName.trim() ? '#F59E0B' : '#334155',
              color: newName.trim() ? '#000' : '#64748B',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              cursor: newName.trim() ? 'pointer' : 'not-allowed',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
            }}
          >
            {adding ? 'Adding...' : 'Add habit'}
          </button>
        </div>
        {saved ? (
          <p style={{ color: '#10B981', fontSize: '12px', margin: 0 }}>✓ Habit added successfully</p>
        ) : null}
      </div>
    </div>
  )
}
