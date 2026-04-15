'use client'

import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'
import { PU } from '@/lib/program-ui-tokens'

const OBT_LS_KEY = 'monk_one_big_task_v2'

/** Checkbox state for API-backed rows (no `completed` column on `user_big_task`). */
function completedStorageKey(userId: string, date: string) {
  return `monk_obt_completed:${userId}:${date}`
}

type LocalOb = { date: string; text: string; completed: boolean }

function localDateKey(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

function readLocalOb(): LocalOb | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(OBT_LS_KEY)
    if (!raw) return null
    const o = JSON.parse(raw) as LocalOb
    if (!o || typeof o !== 'object' || typeof o.text !== 'string') return null
    return {
      date: typeof o.date === 'string' ? o.date : '',
      text: o.text,
      completed: !!o.completed,
    }
  } catch {
    return null
  }
}

function writeLocalOb(payload: LocalOb) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(OBT_LS_KEY, JSON.stringify(payload))
  } catch {
    /* quota */
  }
}

function readApiCompleted(userId: string, date: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(completedStorageKey(userId, date)) === '1'
  } catch {
    return false
  }
}

function writeApiCompleted(userId: string, date: string, done: boolean) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(completedStorageKey(userId, date), done ? '1' : '0')
  } catch {
    /* quota */
  }
}

function clearApiCompleted(userId: string, date: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(completedStorageKey(userId, date))
  } catch {
    /* ignore */
  }
}

type OneBigTaskProps = {
  /** Program day when shown from /today (informational only for this flow). */
  dayNumber?: number | null
}

type ApiTaskRow = {
  task_text: string
  date: string
  updated_at: string
}

export default function OneBigTask(_props: OneBigTaskProps) {
  const { showToast } = useToast()
  const [task, setTask] = useState('')
  const [saved, setSaved] = useState('')
  const [apiUserId, setApiUserId] = useState<string | null>(null)
  const [useApi, setUseApi] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const today = localDateKey()

  const loadTask = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      const uid = session?.user?.id ?? null

      if (token && uid) {
        const res = await fetch(`/api/big-task?date=${encodeURIComponent(today)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = (await res.json()) as { task?: ApiTaskRow | null; error?: string }

        if (!res.ok) {
          console.error('OBT load:', json.error)
          if (res.status !== 401) {
            showToast(json.error ?? 'Could not load One Big Task', 'error')
          }
          setUseApi(false)
          setApiUserId(null)
          const local = readLocalOb()
          if (local && local.date === today) {
            setSaved(local.text)
            setCompleted(local.completed)
          } else {
            setSaved('')
            setCompleted(false)
          }
          return
        }

        setUseApi(true)
        setApiUserId(uid)
        const row = json.task
        if (row?.task_text) {
          setSaved(row.task_text)
          setCompleted(readApiCompleted(uid, today))
        } else {
          setSaved('')
          setCompleted(false)
        }
        return
      }

      setUseApi(false)
      setApiUserId(null)
      const local = readLocalOb()
      if (local && local.date === today) {
        setSaved(local.text)
        setCompleted(local.completed)
      } else {
        setSaved('')
        setCompleted(false)
      }
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => {
    void loadTask()
  }, [loadTask])

  async function saveTask() {
    const t = task.trim()
    if (!t) return
    setSaving(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      const uid = session?.user?.id

      if (token && uid) {
        const res = await fetch('/api/big-task', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ task_text: t, date: today }),
        })
        const json = (await res.json()) as { task?: ApiTaskRow; error?: string }

        if (!res.ok) {
          showToast(json.error ?? 'Could not save task', 'error')
          return
        }

        clearApiCompleted(uid, today)
        setUseApi(true)
        setApiUserId(uid)
        setSaved(t)
        setCompleted(false)
        setTask('')
        setEditing(false)
        showToast('One Big Task saved', 'success')
        return
      }

      writeLocalOb({ date: today, text: t, completed: false })
      setSaved(t)
      setTask('')
      setEditing(false)
      setCompleted(false)
      showToast('Saved on this device', 'success')
    } finally {
      setSaving(false)
    }
  }

  async function toggleComplete() {
    if (useApi && apiUserId) {
      const next = !completed
      writeApiCompleted(apiUserId, today, next)
      setCompleted(next)
      return
    }

    if (!useApi && saved) {
      const next = !completed
      setCompleted(next)
      writeLocalOb({ date: today, text: saved, completed: next })
    }
  }

  if (loading) return null

  return (
    <div
      style={{
        background: PU.card,
        borderRadius: '16px',
        padding: '20px',
        border: `1px solid color-mix(in srgb, ${PU.primary} 28%, transparent)`,
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{ fontSize: '20px' }}>🎯</span>
        <div>
          <h3 style={{ color: PU.fg, fontSize: '15px', fontWeight: '600', margin: '0 0 2px' }}>
            One Big Task
          </h3>
          <p style={{ color: PU.mutedFg, fontSize: '12px', margin: 0 }}>
            If you only did ONE thing today…
          </p>
        </div>
      </div>

      {saved && !editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => void toggleComplete()}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: `2px solid ${completed ? PU.primary : PU.border}`,
              background: completed ? PU.primary : 'transparent',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: completed ? PU.primaryFg : 'transparent',
              fontSize: '14px',
            }}
            aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
          >
            ✓
          </button>
          <span
            style={{
              color: completed ? PU.mutedFg : PU.fg,
              fontSize: '16px',
              fontWeight: '500',
              textDecoration: completed ? 'line-through' : 'none',
              flex: 1,
            }}
          >
            {saved}
          </span>
          <button
            type="button"
            onClick={() => {
              setTask(saved)
              setEditing(true)
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: PU.mutedFg,
              cursor: 'pointer',
              fontSize: '12px',
              padding: '4px 8px',
            }}
          >
            Edit
          </button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="What is the ONE thing that would make today a win?"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void saveTask()
            }}
            autoFocus={editing}
            style={{
              width: '100%',
              background: PU.bg,
              border: `1px solid color-mix(in srgb, ${PU.primary} 28%, transparent)`,
              borderRadius: '10px',
              padding: '12px 16px',
              color: PU.fg,
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '10px',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => void saveTask()}
              disabled={!task.trim() || saving}
              style={{
                flex: 1,
                background: task.trim() ? PU.primary : PU.muted,
                color: task.trim() ? PU.primaryFg : PU.mutedFg,
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                cursor: !task.trim() || saving ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              {saving ? 'Saving…' : 'Set task'}
            </button>
            {editing ? (
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setTask('')
                }}
                style={{
                  background: PU.card,
                  border: `1px solid ${PU.border}`,
                  color: PU.mutedFg,
                  borderRadius: '8px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
