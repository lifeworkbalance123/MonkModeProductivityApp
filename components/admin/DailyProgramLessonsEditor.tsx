'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'
import {
  PROGRAM_DURATIONS,
  PROGRAM_LABELS,
  type ProgramType,
} from '@/lib/programUtils'
import type { DailyProgramLessonRow } from '@/lib/dailyProgramLessons'
import { BonusTrackSectionControlled } from '@/components/admin/BonusTrackSection'

const PROGRAM_TYPES: ProgramType[] = [
  'sprint_standard',
  'sprint_monk',
  'transform',
  'mastery',
]

type Draft = {
  id?: string
  program_type: ProgramType
  program_day: number
  is_bonus: boolean
  phase: number
  title: string
  content_markdown: string
  audio_url: string
  video_url: string
  tip_topic: string
  /** Inline bonus track (primary rows only; stored on same DB row). */
  bonus_label: string
  bonus_title: string
  bonus_body: string
  bonus_audio_url: string
  bonus_video_url: string
}

function emptyDraft(programType: ProgramType, day: number, isBonus: boolean): Draft {
  return {
    program_type: programType,
    program_day: day,
    is_bonus: isBonus,
    phase: 1,
    title: '',
    content_markdown: '',
    audio_url: '',
    video_url: '',
    tip_topic: '',
    bonus_label: '',
    bonus_title: '',
    bonus_body: '',
    bonus_audio_url: '',
    bonus_video_url: '',
  }
}

function rowToDraft(row: DailyProgramLessonRow): Draft {
  const bonus = row.is_bonus ?? false
  return {
    id: row.id,
    program_type: row.program_type,
    program_day: row.program_day,
    is_bonus: bonus,
    phase: row.phase,
    title: row.title,
    content_markdown: row.content_markdown,
    audio_url: row.audio_url ?? '',
    video_url: row.video_url ?? '',
    tip_topic: row.tip_topic ?? '',
    bonus_label: row.bonus_label ?? '',
    bonus_title: row.bonus_title ?? '',
    bonus_body: row.bonus_body ?? '',
    bonus_audio_url: row.bonus_audio_url ?? '',
    bonus_video_url: row.bonus_video_url ?? '',
  }
}

export default function DailyProgramLessonsEditor() {
  const { showToast } = useToast()
  const [programType, setProgramType] = useState<ProgramType>('sprint_standard')
  const [rows, setRows] = useState<DailyProgramLessonRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(1)
  const [isBonus, setIsBonus] = useState(false)
  const [draft, setDraft] = useState<Draft>(() => emptyDraft('sprint_standard', 1, false))
  const [saving, setSaving] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  /** When true, do not overwrite draft from `rows` (avoids wiping unsaved uploads/edits after loadRows). */
  const draftDirtyRef = useRef(false)

  const maxDays = PROGRAM_DURATIONS[programType]

  const loadRows = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('daily_lessons')
      .select('*')
      .eq('program_type', programType)
      .order('program_day', { ascending: true })
      .order('is_bonus', { ascending: true })

    if (error) {
      showToast(error.message, 'error')
      setRows([])
    } else {
      setRows((data as DailyProgramLessonRow[]) ?? [])
    }
    setLoading(false)
  }, [programType, showToast])

  useEffect(() => {
    void loadRows()
  }, [loadRows])

  useEffect(() => {
    if (draftDirtyRef.current) return
    const found = rows.find((r) => r.program_day === selectedDay && !!(r.is_bonus ?? false) === isBonus)
    setDraft(found ? rowToDraft(found) : emptyDraft(programType, selectedDay, isBonus))
  }, [rows, selectedDay, programType, isBonus])

  const onProgramTypeChange = (next: ProgramType) => {
    draftDirtyRef.current = false
    setProgramType(next)
    setSelectedDay(1)
    setIsBonus(false)
  }

  const selectDay = (day: number) => {
    draftDirtyRef.current = false
    setSelectedDay(day)
  }

  const setBonusMode = (next: boolean) => {
    draftDirtyRef.current = false
    setIsBonus(next)
  }

  async function saveDraft() {
    if (!draft.title.trim() || !draft.content_markdown.trim()) {
      showToast('Title and lesson text (markdown) are required.', 'error')
      return
    }
    setSaving(true)
    const bonus = isBonus
    const day = draft.program_day
    const payload: Record<string, unknown> = {
      program_type: draft.program_type,
      program_day: day,
      is_bonus: bonus,
      parent_day_number: bonus ? day : null,
      phase: Math.max(1, Math.floor(draft.phase) || 1),
      title: draft.title.trim(),
      content_markdown: draft.content_markdown,
      audio_url: draft.audio_url.trim() || null,
      video_url: draft.video_url.trim() || null,
      tip_topic: draft.tip_topic.trim() || null,
    }
    if (!bonus) {
      payload.bonus_label = draft.bonus_label.trim() || null
      payload.bonus_title = draft.bonus_title.trim() || null
      payload.bonus_body = draft.bonus_body.trim() || null
      payload.bonus_audio_url = draft.bonus_audio_url.trim() || null
      payload.bonus_video_url = draft.bonus_video_url.trim() || null
    } else {
      payload.bonus_label = null
      payload.bonus_title = null
      payload.bonus_body = null
      payload.bonus_audio_url = null
      payload.bonus_video_url = null
    }
    const { error } = await supabase.from('daily_lessons').upsert(payload as never, {
      onConflict: 'program_type,program_day,is_bonus',
    })
    setSaving(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    draftDirtyRef.current = false
    showToast(
      (bonus ? 'Saved bonus for day ' : 'Saved day ') + draft.program_day,
      'success',
    )
    await loadRows()
  }

  async function deleteDay() {
    if (
      !window.confirm(
        isBonus
          ? `Remove the saved bonus content for day ${selectedDay}?`
          : `Remove the saved lesson for day ${selectedDay}?`,
      )
    )
      return
    setSaving(true)
    const { error } = await supabase
      .from('daily_lessons')
      .delete()
      .eq('program_type', programType)
      .eq('program_day', selectedDay)
      .eq('is_bonus', isBonus)
    setSaving(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    draftDirtyRef.current = false
    showToast('Removed', 'success')
    await loadRows()
    setDraft(emptyDraft(programType, selectedDay, isBonus))
  }

  async function onAudioFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAudio(true)
    try {
      const ext = file.name.split('.').pop() || 'mp3'
      const path = `lesson/daily-${programType}-${selectedDay}-${isBonus ? 'bonus' : 'primary'}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('lesson-media').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'audio/mpeg',
      })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('lesson-media').getPublicUrl(path)
      draftDirtyRef.current = true
      setDraft((d) => ({ ...d, audio_url: urlData.publicUrl }))
      showToast('Audio uploaded — click Save day to store the URL on this lesson.', 'success')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error')
    } finally {
      setUploadingAudio(false)
      e.target.value = ''
    }
  }

  const filledDays = new Set(rows.filter((r) => !(r.is_bonus ?? false)).map((r) => r.program_day))
  const bonusDays = new Set(rows.filter((r) => r.is_bonus ?? false).map((r) => r.program_day))

  return (
    <div>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', marginBottom: '16px', maxWidth: '720px' }}>
        One primary row per calendar day for each program track (30 / 21 / 56 / 90 days). Add an optional
        bonus track (label, title, markdown, MP3, video) on the primary day, or use the legacy separate
        bonus row via the checkbox. Optional audio and video URLs (hosted files or YouTube links). Use
        markdown for lesson bodies.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
          Program
          <select
            value={programType}
            onChange={(e) => onProgramTypeChange(e.target.value as ProgramType)}
            style={{
              minWidth: '220px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '14px',
            }}
          >
            {PROGRAM_TYPES.map((t) => (
              <option key={t} value={t}>
                {PROGRAM_LABELS[t]} ({PROGRAM_DURATIONS[t]} days)
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted-foreground)' }}>Loading…</p>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginBottom: '20px',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '4px',
            }}
          >
            {Array.from({ length: maxDays }, (_, i) => i + 1).map((day) => {
              const hasPrimary = filledDays.has(day)
              const hasBonus = bonusDays.has(day)
              const active = selectedDay === day
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  style={{
                    minWidth: '40px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${active ? 'var(--accent)' : hasBonus ? 'var(--ring)' : 'var(--border)'}`,
                    background: active ? 'var(--accent)' : hasPrimary ? 'var(--card)' : 'transparent',
                    color: active ? 'var(--accent-foreground)' : 'var(--foreground)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    opacity: hasPrimary ? 1 : 0.65,
                  }}
                  title={
                    hasPrimary && hasBonus
                      ? 'Primary + bonus saved'
                      : hasBonus
                        ? 'Bonus only'
                        : hasPrimary
                          ? 'Primary saved'
                          : 'Empty'
                  }
                >
                  {day}
                  {hasBonus ? <span style={{ fontSize: '9px', marginLeft: '2px', opacity: 0.85 }}>B</span> : null}
                </button>
              )
            })}
          </div>

          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px',
              background: 'var(--card)',
              maxWidth: '800px',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
              Day {selectedDay}
              {isBonus ? ' · Bonus' : ''} · {PROGRAM_LABELS[programType]}
            </h3>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                marginBottom: '12px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={isBonus}
                onChange={(e) => setBonusMode(e.target.checked)}
              />
              Bonus content for this day (extra tip/media alongside the primary lesson)
            </label>

            <div style={{ display: 'grid', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                Title
                <input
                  value={draft.title}
                  onChange={(e) => {
                    draftDirtyRef.current = true
                    setDraft((d) => ({ ...d, title: e.target.value }))
                  }}
                  style={inputStyle}
                  placeholder="Short headline"
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                Phase (display grouping)
                <input
                  type="number"
                  min={1}
                  value={draft.phase}
                  onChange={(e) => {
                    draftDirtyRef.current = true
                    setDraft((d) => ({ ...d, phase: Number(e.target.value) || 1 }))
                  }}
                  style={{ ...inputStyle, maxWidth: '120px' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                Tip topic
                <input
                  value={draft.tip_topic}
                  onChange={(e) => {
                    draftDirtyRef.current = true
                    setDraft((d) => ({ ...d, tip_topic: e.target.value }))
                  }}
                  style={inputStyle}
                  placeholder='e.g. "Hydration & focus"'
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                Lesson body (markdown)
                <textarea
                  value={draft.content_markdown}
                  onChange={(e) => {
                    draftDirtyRef.current = true
                    setDraft((d) => ({ ...d, content_markdown: e.target.value }))
                  }}
                  style={{ ...inputStyle, minHeight: '180px', fontFamily: 'ui-monospace, monospace', fontSize: '13px' }}
                  placeholder="Two-minute tip in markdown…"
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                Audio URL (optional)
                <input
                  value={draft.audio_url}
                  onChange={(e) => {
                    draftDirtyRef.current = true
                    setDraft((d) => ({ ...d, audio_url: e.target.value }))
                  }}
                  style={inputStyle}
                  placeholder="https://…"
                />
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input ref={fileRef} type="file" accept="audio/mpeg,audio/mp3,.mp3" style={{ display: 'none' }} onChange={(e) => void onAudioFile(e)} />
                <button
                  type="button"
                  disabled={uploadingAudio}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    fontSize: '13px',
                    cursor: uploadingAudio ? 'wait' : 'pointer',
                  }}
                >
                  {uploadingAudio ? 'Uploading…' : 'Upload MP3 to lesson-media'}
                </button>
                <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Sets public URL into the field above.</span>
              </div>
              {draft.audio_url.trim() ? (
                <div style={{ marginTop: '4px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', margin: '0 0 6px' }}>
                    Preview (saved after you click Save day)
                  </p>
                  <audio
                    controls
                    preload="metadata"
                    style={{ width: '100%', maxWidth: '420px', height: '36px' }}
                    src={draft.audio_url.trim()}
                  />
                </div>
              ) : null}

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                Video URL (optional)
                <input
                  value={draft.video_url}
                  onChange={(e) => {
                    draftDirtyRef.current = true
                    setDraft((d) => ({ ...d, video_url: e.target.value }))
                  }}
                  style={inputStyle}
                  placeholder="YouTube or hosted video URL"
                />
              </label>

              {!isBonus ? (
                <BonusTrackSectionControlled
                  values={{
                    bonus_label: draft.bonus_label,
                    bonus_title: draft.bonus_title,
                    bonus_body: draft.bonus_body,
                    bonus_audio_url: draft.bonus_audio_url,
                    bonus_video_url: draft.bonus_video_url,
                  }}
                  onChange={(partial) => {
                    draftDirtyRef.current = true
                    setDraft((d) => ({ ...d, ...partial }))
                  }}
                />
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveDraft()}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--accent)',
                  color: 'var(--accent-foreground)',
                  fontWeight: 600,
                  cursor: saving ? 'wait' : 'pointer',
                }}
              >
                {saving ? 'Saving…' : 'Save day'}
              </button>
              <button
                type="button"
                disabled={
                  saving ||
                  !rows.some(
                    (r) => r.program_day === selectedDay && !!(r.is_bonus ?? false) === isBonus,
                  )
                }
                onClick={() => void deleteDay()}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--destructive)',
                  cursor: saving ? 'wait' : 'pointer',
                }}
              >
                Delete this day
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
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
