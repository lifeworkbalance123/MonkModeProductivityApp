'use client'

import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useDataServiceContext } from '@/hooks/use-data-service-context'
import { usePlan } from '@/hooks/usePlan'
import { shouldSyncToCloud } from '@/lib/dataService'

const OBT_LS_KEY = 'monk_one_big_task_v2'

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

type OneBigTaskProps = {
  /** Program day when shown from /today; omit on Goals for `day_number` = null. */
  dayNumber?: number | null
}

export default function OneBigTask({ dayNumber }: OneBigTaskProps) {
  const ctx = useDataServiceContext()
  const { isLoading: planLoading } = usePlan()
  const syncCloud = !planLoading && shouldSyncToCloud(ctx)

  const [task, setTask] = useState('')
  const [saved, setSaved] = useState('')
  const [savedId, setSavedId] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const today = localDateKey()

  const loadTask = useCallback(async () => {
    setLoading(true)
    try {
      if (syncCloud) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('goals')
          .select('id,title,completed')
          .eq('user_id', user.id)
          .eq('is_one_big_task', true)
          .eq('date', today)
          .maybeSingle()

        if (error) {
          console.error('OBT load:', error)
          return
        }
        if (data) {
          setSavedId(data.id as string)
          setSaved((data.title as string) ?? '')
          setCompleted(!!data.completed)
        } else {
          setSavedId(null)
          setSaved('')
          setCompleted(false)
        }
        return
      }

      const local = readLocalOb()
      if (local && local.date === today) {
        setSaved(local.text)
        setCompleted(local.completed)
      } else {
        setSaved('')
        setCompleted(false)
      }
      setSavedId(null)
    } finally {
      setLoading(false)
    }
  }, [syncCloud, today])

  useEffect(() => {
    void loadTask()
  }, [loadTask])

  async function saveTask() {
    const t = task.trim()
    if (!t) return
    setSaving(true)
    try {
      if (syncCloud) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { error: delError } = await supabase
          .from('goals')
          .delete()
          .eq('user_id', user.id)
          .eq('is_one_big_task', true)
          .eq('date', today)

        if (delError) {
          console.error('OBT delete:', delError)
          return
        }

        const id = crypto.randomUUID()
        const { error: insError } = await supabase.from('goals').insert({
          id,
          user_id: user.id,
          title: t,
          is_one_big_task: true,
          priority: 5,
          completed: false,
          type: 'daily',
          date: today,
          day_number: dayNumber ?? null,
        })

        if (insError) {
          console.error('OBT insert:', insError)
          return
        }

        setSavedId(id)
        setSaved(t)
        setTask('')
        setEditing(false)
        return
      }

      writeLocalOb({ date: today, text: t, completed: false })
      setSaved(t)
      setTask('')
      setEditing(false)
      setCompleted(false)
    } finally {
      setSaving(false)
    }
  }

  async function toggleComplete() {
    if (syncCloud && savedId) {
      const { error } = await supabase
        .from('goals')
        .update({ completed: !completed })
        .eq('id', savedId)

      if (error) {
        console.error('OBT toggle:', error)
        return
      }
      setCompleted((c) => !c)
      return
    }

    if (!syncCloud && saved) {
      const next = !completed
      setCompleted(next)
      writeLocalOb({ date: today, text: saved, completed: next })
    }
  }

  if (loading) return null

  return (
    <div
      style={{
        background: '#1E293B',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #F59E0B44',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{ fontSize: '20px' }}>🎯</span>
        <div>
          <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: '0 0 2px' }}>
            One Big Task
          </h3>
          <p style={{ color: '#64748B', fontSize: '12px', margin: 0 }}>
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
              border: `2px solid ${completed ? '#F59E0B' : '#334155'}`,
              background: completed ? '#F59E0B' : 'transparent',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: completed ? '#000' : 'transparent',
              fontSize: '14px',
            }}
            aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
          >
            ✓
          </button>
          <span
            style={{
              color: completed ? '#64748B' : 'white',
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
              color: '#64748B',
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
              background: '#0F172A',
              border: '1px solid #F59E0B44',
              borderRadius: '10px',
              padding: '12px 16px',
              color: 'white',
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
                background: task.trim() ? '#F59E0B' : '#334155',
                color: task.trim() ? '#000' : '#64748B',
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
                  background: '#1E293B',
                  border: '1px solid #334155',
                  color: '#64748B',
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
