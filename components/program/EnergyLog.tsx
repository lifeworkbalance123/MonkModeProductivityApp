'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PU } from '@/lib/program-ui-tokens'
import { getUserIdSafe } from '@/lib/supabaseAuthSafe'

export const ENERGY_TIME_SLOTS = [
  '06:00',
  '08:00',
  '10:00',
  '12:00',
  '14:00',
  '16:00',
  '18:00',
  '20:00',
] as const

export type EnergyTimeSlot = (typeof ENERGY_TIME_SLOTS)[number]

type EnergyLogRow = {
  id: string
  rating: number
  logged_at: string
  time_slot: string | null
  notes: string | null
  day_number: number | null
}

function startOfLocalDayIso(): string {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  return start.toISOString()
}

function getCurrentTimeSlot(): EnergyTimeSlot {
  const hour = new Date().getHours()
  const slotHours = [6, 8, 10, 12, 14, 16, 18, 20]
  let best = slotHours[0]!
  let bestDist = Math.abs(best - hour)
  for (const h of slotHours) {
    const d = Math.abs(h - hour)
    if (d < bestDist) {
      best = h
      bestDist = d
    }
  }
  return `${String(best).padStart(2, '0')}:00` as EnergyTimeSlot
}

function getEnergyColor(rating: number): string {
  if (rating >= 8) return PU.success
  if (rating >= 5) return PU.primary
  return PU.destructive
}

function getEnergyLabel(rating: number): string {
  if (rating >= 9) return 'Peak'
  if (rating >= 7) return 'High'
  if (rating >= 5) return 'Medium'
  if (rating >= 3) return 'Low'
  return 'Drained'
}

function dedupeLatestBySlot(rows: EnergyLogRow[]): EnergyLogRow[] {
  const bySlot = new Map<string, EnergyLogRow>()
  for (const r of rows) {
    const k = r.time_slot?.trim()
    if (!k) continue
    const prev = bySlot.get(k)
    if (!prev || new Date(r.logged_at).getTime() >= new Date(prev.logged_at).getTime()) {
      bySlot.set(k, r)
    }
  }
  return ENERGY_TIME_SLOTS.map((s) => bySlot.get(s)).filter((x): x is EnergyLogRow => !!x)
}

export default function EnergyLog({ dayNumber }: { dayNumber: number }) {
  const [todayLogs, setTodayLogs] = useState<EnergyLogRow[]>([])
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<EnergyTimeSlot>(() => getCurrentTimeSlot())
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const loadTodayLogs = useCallback(async () => {
    const userId = await getUserIdSafe()
    if (!userId) return

    const from = startOfLocalDayIso()
    const { data, error } = await supabase
      .from('energy_logs')
      .select('id, rating, logged_at, time_slot, notes, day_number')
      .eq('user_id', userId)
      .gte('logged_at', from)
      .order('logged_at', { ascending: false })

    if (error) {
      console.error('energy_logs load:', error)
      return
    }

    const rows = (data ?? []) as EnergyLogRow[]
    setTodayLogs(dedupeLatestBySlot(rows))
  }, [])

  useEffect(() => {
    void loadTodayLogs()
  }, [loadTodayLogs])

  async function saveEnergyLog() {
    if (selectedRating == null) return
    setSaving(true)
    try {
      const userId = await getUserIdSafe()
      if (!userId) return

      const from = startOfLocalDayIso()

      const { error: delError } = await supabase
        .from('energy_logs')
        .delete()
        .eq('user_id', userId)
        .eq('time_slot', selectedSlot)
        .gte('logged_at', from)

      if (delError) {
        console.error('energy_logs delete:', delError)
        return
      }

      const { error: insError } = await supabase.from('energy_logs').insert({
        user_id: userId,
        rating: selectedRating,
        time_slot: selectedSlot,
        notes: notes.trim(),
        day_number: dayNumber,
        logged_at: new Date().toISOString(),
      })

      if (insError) {
        console.error('energy_logs insert:', insError)
        return
      }

      setSelectedRating(null)
      setNotes('')
      setShowForm(false)
      await loadTodayLogs()
    } finally {
      setSaving(false)
    }
  }

  const avgRating =
    todayLogs.length > 0
      ? Math.round(todayLogs.reduce((sum, l) => sum + l.rating, 0) / todayLogs.length)
      : null

  return (
    <div
      style={{
        background: PU.card,
        borderRadius: '12px',
        padding: '16px 20px',
        border: `1px solid ${PU.border}`,
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <div>
          <h3 style={{ color: PU.fg, fontSize: '15px', fontWeight: '500', margin: '0 0 2px' }}>
            Energy Log
          </h3>
          {avgRating !== null ? (
            <p style={{ color: getEnergyColor(avgRating), fontSize: '12px', margin: 0 }}>
              Today avg: {avgRating}/10 — {getEnergyLabel(avgRating)}
            </p>
          ) : (
            <p style={{ color: PU.mutedFg, fontSize: '12px', margin: 0 }}>No readings yet today</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          style={{
            background: PU.success,
            border: 'none',
            color: PU.primaryFg,
            padding: '8px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          + Log energy
        </button>
      </div>

      {todayLogs.length > 0 ? (
        <div
          style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'flex-end',
            height: '48px',
            marginBottom: '14px',
          }}
        >
          {ENERGY_TIME_SLOTS.map((slot) => {
            const log = todayLogs.find((l) => l.time_slot === slot)
            const height = log ? (log.rating / 10) * 48 : 4
            return (
              <div
                key={slot}
                title={log ? `${slot}: ${log.rating}/10` : `${slot}: not logged`}
                style={{
                  flex: 1,
                  height: `${Math.max(4, height)}px`,
                  background: log ? getEnergyColor(log.rating) : PU.muted,
                  borderRadius: '3px',
                  transition: 'height 0.3s',
                }}
              />
            )
          })}
        </div>
      ) : null}

      {showForm ? (
        <div style={{ background: PU.bg, borderRadius: '10px', padding: '14px' }}>
          <p style={{ color: PU.mutedFg, fontSize: '12px', margin: '0 0 8px' }}>Time slot</p>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {ENERGY_TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                style={{
                  background: selectedSlot === slot ? PU.primary : PU.card,
                  color: selectedSlot === slot ? PU.primaryFg : PU.mutedFg,
                  border: `1px solid ${PU.border}`,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                {slot}
              </button>
            ))}
          </div>

          <p style={{ color: PU.mutedFg, fontSize: '12px', margin: '0 0 8px' }}>Energy rating (1–10)</p>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSelectedRating(n)}
                style={{
                  flex: 1,
                  background: selectedRating === n ? getEnergyColor(n) : PU.card,
                  color: selectedRating === n ? PU.primaryFg : PU.mutedFg,
                  border: `1px solid ${PU.border}`,
                  padding: '8px 0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: selectedRating === n ? '700' : '400',
                }}
              >
                {n}
              </button>
            ))}
          </div>

          {selectedRating != null ? (
            <p
              style={{
                color: getEnergyColor(selectedRating),
                fontSize: '13px',
                margin: '0 0 10px',
                textAlign: 'center',
              }}
            >
              {selectedRating}/10 — {getEnergyLabel(selectedRating)}
            </p>
          ) : null}

          <input
            type="text"
            placeholder="Optional note (e.g. after coffee, post lunch)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: '100%',
              background: PU.card,
              border: `1px solid ${PU.border}`,
              borderRadius: '8px',
              padding: '10px 12px',
              color: PU.fg,
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '10px',
            }}
          />

          <button
            type="button"
            onClick={() => void saveEnergyLog()}
            disabled={selectedRating == null || saving}
            style={{
              width: '100%',
              background: selectedRating != null ? PU.success : PU.muted,
              color: selectedRating != null ? PU.primaryFg : PU.mutedFg,
              border: 'none',
              borderRadius: '8px',
              padding: '10px',
              cursor: selectedRating == null || saving ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
