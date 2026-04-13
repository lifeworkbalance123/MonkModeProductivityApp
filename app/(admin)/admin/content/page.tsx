'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'

type Tab = 'lessons' | 'onboarding' | 'habits'

const ONBOARDING_STEP_ORDER = ['welcome', 'why', 'commitment', 'setup', 'ready'] as const

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<Tab>('lessons')

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
      </div>

      {activeTab === 'lessons' ? <LessonsEditor /> : null}
      {activeTab === 'onboarding' ? <OnboardingEditor /> : null}
      {activeTab === 'habits' ? <HabitsEditor /> : null}
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

  const loadLessons = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('lessons').select('*').order('day_number', { ascending: true })
    if (error) {
      showToast(error.message, 'error')
      setLessons([])
    } else {
      setLessons((data as LessonRow[]) || [])
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => {
    void loadLessons()
  }, [loadLessons])

  async function saveLesson() {
    if (!editing) return
    setSaving(true)
    const { error } = await supabase
      .from('lessons')
      .upsert(
        {
          day_number: editing.day_number,
          phase: editing.phase,
          title: editing.title,
          lesson: editing.lesson,
          action: editing.action,
          action_label: editing.action_label,
          category: editing.category,
          tip: editing.tip || '',
          published: editing.published,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'day_number' },
      )
    setSaving(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    await loadLessons()
    setEditing(null)
  }

  function createNewLesson(day: number) {
    setEditing({
      day_number: day,
      phase: day <= 30 ? 'student' : 'monk',
      title: '',
      lesson: '',
      action: '',
      action_label: 'Done ✓',
      category: 'focus',
      tip: '',
      published: true,
    })
  }

  const allDays = Array.from({ length: 60 }, (_, i) => i + 1)
  const lessonsMap = Object.fromEntries(lessons.map((l) => [l.day_number, l])) as Record<number, LessonRow>

  const filtered = allDays.filter((day) => {
    const lesson = lessonsMap[day]
    if (filterPhase === 'student' && day > 30) return false
    if (filterPhase === 'monk' && (day < 31 || day > 60)) return false
    if (search.trim()) {
      if (!lesson) return false
      return lesson.title.toLowerCase().includes(search.trim().toLowerCase())
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
        </select>
        <span style={{ color: '#64748B', fontSize: '13px', marginLeft: 'auto' }}>
          {lessons.length}/60 days have content
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
        {loading ? (
          <p style={{ color: '#64748B', fontSize: '14px' }}>Loading lessons...</p>
        ) : (
          filtered.map((day) => {
            const lesson = lessonsMap[day]
            const hasContent = !!lesson
            return (
              <div
                key={day}
                role="button"
                tabIndex={0}
                onClick={() => (hasContent ? setEditing({ ...lesson }) : createNewLesson(day))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    hasContent ? setEditing({ ...lesson! }) : createNewLesson(day)
                  }
                }}
                style={{
                  background: '#1E293B',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  border: `1px solid ${hasContent ? '#334155' : '#1E293B'}`,
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
                  e.currentTarget.style.borderColor = hasContent ? '#334155' : '#1E293B'
                }}
              >
                <div
                  style={{
                    background: hasContent ? '#F59E0B' : '#334155',
                    color: hasContent ? '#000' : '#64748B',
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
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      color: hasContent ? 'white' : '#475569',
                      fontSize: '13px',
                      fontWeight: '500',
                      margin: '0 0 2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {hasContent ? lesson.title : 'No content yet — click to add'}
                  </p>
                  {hasContent ? (
                    <p style={{ color: '#64748B', fontSize: '11px', margin: 0, textTransform: 'capitalize' }}>
                      {lesson.category} · {lesson.published ? 'Published' : 'Draft'}
                    </p>
                  ) : null}
                </div>
                <span style={{ fontSize: '14px' }}>{hasContent ? (lesson.published ? '✅' : '📝') : '➕'}</span>
              </div>
            )
          })
        )}
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
}

function OnboardingEditor() {
  const { showToast } = useToast()
  const [steps, setSteps] = useState<OnboardingContentStep[]>([])
  const [editingStep, setEditingStep] = useState<OnboardingContentStep | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

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
        updated_at: new Date().toISOString(),
      })
      .eq('step_key', editingStep.step_key)
    setSaving(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
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
