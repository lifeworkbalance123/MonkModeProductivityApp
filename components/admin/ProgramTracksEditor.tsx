'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'
import { DEFAULT_PROGRAM_TRACKS, type ProgramTrackConfig } from '@/lib/onboardingProgramFlow'

type ProgramTracksEditorProps = {
  /** When set, skip the initial GET and use this list (parent already fetched). */
  serverSnapshot?: ProgramTrackConfig[] | null
}

export function ProgramTracksEditor({ serverSnapshot }: ProgramTracksEditorProps = {}) {
  const { showToast } = useToast()
  const [tracks, setTracks] = useState<ProgramTrackConfig[]>(() =>
    serverSnapshot !== undefined && serverSnapshot?.length
      ? serverSnapshot
      : DEFAULT_PROGRAM_TRACKS,
  )
  const [loading, setLoading] = useState(() => serverSnapshot === undefined)
  const [saving, setSaving] = useState(false)

  const authHeader = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return null
    return { Authorization: `Bearer ${token}` } as Record<string, string>
  }, [])

  const load = useCallback(async () => {
    const headers = await authHeader()
    if (!headers) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/admin/program-tracks', { headers, cache: 'no-store' })
      const json = (await res.json()) as { tracks?: ProgramTrackConfig[]; error?: string }
      if (!res.ok) {
        showToast(json.error ?? 'Failed to load tracks', 'error')
        return
      }
      if (Array.isArray(json.tracks) && json.tracks.length) {
        setTracks(json.tracks)
      }
    } finally {
      setLoading(false)
    }
  }, [authHeader, showToast])

  useEffect(() => {
    if (serverSnapshot !== undefined) return
    void load()
  }, [serverSnapshot, load])

  useEffect(() => {
    if (serverSnapshot === undefined) return
    setTracks(
      serverSnapshot && serverSnapshot.length > 0 ? serverSnapshot : DEFAULT_PROGRAM_TRACKS,
    )
    setLoading(false)
  }, [serverSnapshot])

  function updateTrack(id: ProgramTrackConfig['id'], patch: Partial<ProgramTrackConfig>) {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  function moveTrack(id: ProgramTrackConfig['id'], dir: -1 | 1) {
    const i = tracks.findIndex((t) => t.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= tracks.length) return
    const next = [...tracks]
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
    setTracks(next.map((t, idx) => ({ ...t, sort_order: idx + 1 })))
  }

  async function save() {
    const headers = await authHeader()
    if (!headers) {
      showToast('Sign in required', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = tracks.map((t, idx) => ({
        ...t,
        sort_order: idx + 1,
      }))
      const res = await fetch('/api/admin/program-tracks', {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracks: payload }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        showToast(json.error ?? 'Save failed', 'error')
        return
      }
      showToast('Program tracks saved', 'success')
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border bg-card p-6">
      <div className="mb-4">
        <h2 className="text-sm font-medium text-foreground">Program tracks (onboarding cards)</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure the 3 track cards users see in onboarding: label, copy, price, order, and active state.
        </p>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading tracks...
        </p>
      ) : (
        <div className="space-y-4">
          {tracks.map((t, idx) => (
            <div key={t.id} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{t.id}</p>
                <div className="flex items-center gap-2">
                  <Button type="button" size="icon" variant="outline" disabled={idx === 0} onClick={() => moveTrack(t.id, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={idx === tracks.length - 1}
                    onClick={() => moveTrack(t.id, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Label</Label>
                  <Input value={t.label} onChange={(e) => updateTrack(t.id, { label: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Duration</Label>
                  <Input value={t.duration} onChange={(e) => updateTrack(t.id, { duration: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Intensity</Label>
                  <Input value={t.intensity} onChange={(e) => updateTrack(t.id, { intensity: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Price (cents)</Label>
                  <Input
                    type="number"
                    value={String(t.price_cents)}
                    onChange={(e) => updateTrack(t.id, { price_cents: Number.parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Benefit</Label>
                  <Input value={t.benefit} onChange={(e) => updateTrack(t.id, { benefit: e.target.value })} />
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
                  <input type="checkbox" checked={t.is_active} onChange={(e) => updateTrack(t.id, { is_active: e.target.checked })} />
                  Active in onboarding selection
                </label>
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <Button type="button" disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving...' : 'Save program tracks'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
