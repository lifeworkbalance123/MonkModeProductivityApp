'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type DistractionCategory =
  | 'general'
  | 'phone'
  | 'social'
  | 'noise'
  | 'thought'
  | 'other'

type DistractionLogRow = {
  id: string
  logged_at: string
  trigger_text: string | null
  category: string | null
  day_number: number | null
}

function startOfLocalDayIso(): string {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  return start.toISOString()
}

export default function DistractionLog({ dayNumber }: { dayNumber: number }) {
  const [todayCount, setTodayCount] = useState(0)
  const [showInput, setShowInput] = useState(false)
  const [trigger, setTrigger] = useState('')
  const [category, setCategory] = useState<DistractionCategory>('general')
  const [logging, setLogging] = useState(false)
  const [recentLogs, setRecentLogs] = useState<DistractionLogRow[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const loadTodayCount = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const from = startOfLocalDayIso()
    const { data, error } = await supabase
      .from('distraction_logs')
      .select('id, logged_at, trigger_text, category, day_number')
      .eq('user_id', user.id)
      .gte('logged_at', from)
      .order('logged_at', { ascending: false })

    if (error) {
      console.error('distraction_logs load:', error)
      return
    }

    const rows = (data ?? []) as DistractionLogRow[]
    setTodayCount(rows.length)
    setRecentLogs(rows.slice(0, 5))
  }, [])

  useEffect(() => {
    void loadTodayCount()
  }, [loadTodayCount])

  async function logDistraction() {
    setLogging(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('distraction_logs').insert({
        user_id: user.id,
        trigger_text: trigger.trim(),
        category,
        day_number: dayNumber,
        logged_at: new Date().toISOString(),
      })

      if (error) {
        console.error('distraction_logs insert:', error)
        return
      }

      setTrigger('')
      setShowInput(false)
      await loadTodayCount()
    } finally {
      setLogging(false)
    }
  }

  const categories: { value: DistractionCategory; label: string }[] = [
    { value: 'general', label: '⋯ General' },
    { value: 'phone', label: '📱 Phone' },
    { value: 'social', label: '💬 Social' },
    { value: 'noise', label: '🔊 Noise' },
    { value: 'thought', label: '💭 Thought' },
    { value: 'other', label: '⚡ Other' },
  ]

  return (
    <div
      style={{
        background: '#1E293B',
        borderRadius: '12px',
        padding: '16px 20px',
        border: '1px solid #334155',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div>
          <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '500', margin: '0 0 2px' }}>
            Distraction Log
          </h3>
          <p style={{ color: '#64748B', fontSize: '12px', margin: 0 }}>Today: {todayCount} logged</p>
        </div>

        <button
          type="button"
          onClick={() => setShowInput((s) => !s)}
          style={{
            background: '#EF4444',
            border: 'none',
            color: 'white',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
          }}
          title="Log a distraction"
        >
          +
        </button>
      </div>

      {showInput ? (
        <div
          style={{
            background: '#0F172A',
            borderRadius: '10px',
            padding: '14px',
            marginBottom: '12px',
          }}
        >
          <p style={{ color: '#94A3B8', fontSize: '13px', margin: '0 0 10px' }}>What distracted you?</p>

          <div
            style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              marginBottom: '10px',
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                style={{
                  background: category === cat.value ? '#F59E0B' : '#1E293B',
                  color: category === cat.value ? '#000' : '#94A3B8',
                  border: '1px solid #334155',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Optional: what triggered it?"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void logDistraction()
            }}
            style={{
              width: '100%',
              background: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 12px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '10px',
            }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => void logDistraction()}
              disabled={logging}
              style={{
                flex: 1,
                background: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                cursor: logging ? 'wait' : 'pointer',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              {logging ? 'Logging…' : 'Log distraction'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInput(false)
                setTrigger('')
              }}
              style={{
                background: '#1E293B',
                color: '#64748B',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {todayCount > 0 ? (
        <div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {Array.from({ length: Math.min(todayCount, 20) }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  background: '#EF4444',
                  opacity: 0.7,
                }}
              />
            ))}
            {todayCount > 20 ? (
              <span style={{ color: '#EF4444', fontSize: '11px' }}>+{todayCount - 20} more</span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setShowHistory((h) => !h)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              fontSize: '12px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {showHistory ? 'Hide' : 'View'} today&apos;s log
          </button>

          {showHistory ? (
            <div style={{ marginTop: '8px' }}>
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '6px 0',
                    borderBottom: '1px solid #1E293B',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ color: '#64748B' }}>
                    {new Date(log.logged_at).toLocaleTimeString('en-AU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span style={{ color: '#94A3B8', textTransform: 'capitalize' }}>
                    {log.category ?? 'general'}
                  </span>
                  {log.trigger_text ? (
                    <span style={{ color: '#64748B', fontStyle: 'italic' }}>— {log.trigger_text}</span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
