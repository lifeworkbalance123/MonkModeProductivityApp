'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/context/ToastContext'
import type { SelectedProgram } from '@/lib/onboardingProgramFlow'
import {
  PROGRAM_OPTIONS,
  SELECTED_PROGRAM_LABEL,
} from '@/lib/onboardingProgramFlow'
import {
  DEFAULT_ONBOARDING_SELECTION_COPY,
  type ProgramHeaderOverride,
} from '@/lib/onboardingSettings'

type SettingsPayload = {
  program_selection_title: string
  program_selection_subtitle: string
  program_headers: Partial<Record<SelectedProgram, ProgramHeaderOverride>>
}

export function OnboardingProgramSelectionCard() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    program_selection_title: '',
    program_selection_subtitle: '',
  })
  const [perProgram, setPerProgram] = useState<
    Record<SelectedProgram, { title: string; subtitle: string }>
  >({
    sprint_standard: { title: '', subtitle: '' },
    sprint_monk: { title: '', subtitle: '' },
    transform: { title: '', subtitle: '' },
  })

  function updateSettings(patch: Partial<typeof settings>) {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  const authHeader = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return null
    return { Authorization: `Bearer ${token}` } as Record<string, string>
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const headers = await authHeader()
      if (!headers) {
        setLoading(false)
        return
      }
      const res = await fetch('/api/admin/onboarding/settings', { headers })
      const json = (await res.json()) as {
        settings?: SettingsPayload | null
        error?: string
      }
      if (!res.ok) {
        showToast(json.error ?? 'Could not load onboarding settings', 'error')
        return
      }
      const s = json.settings
      if (!s) {
        setSettings({
          program_selection_title: DEFAULT_ONBOARDING_SELECTION_COPY.program_selection_title,
          program_selection_subtitle: DEFAULT_ONBOARDING_SELECTION_COPY.program_selection_subtitle,
        })
        setPerProgram({
          sprint_standard: { title: '', subtitle: '' },
          sprint_monk: { title: '', subtitle: '' },
          transform: { title: '', subtitle: '' },
        })
        return
      }
      setSettings({
        program_selection_title: s.program_selection_title ?? '',
        program_selection_subtitle: s.program_selection_subtitle ?? '',
      })
      const next: Record<SelectedProgram, { title: string; subtitle: string }> = {
        sprint_standard: { title: '', subtitle: '' },
        sprint_monk: { title: '', subtitle: '' },
        transform: { title: '', subtitle: '' },
      }
      for (const id of ['sprint_standard', 'sprint_monk', 'transform'] as const) {
        const ov = s.program_headers?.[id]
        next[id] = {
          title: typeof ov?.title === 'string' ? ov.title.trim() : '',
          subtitle: typeof ov?.subtitle === 'string' ? ov.subtitle.trim() : '',
        }
      }
      setPerProgram(next)
    } catch {
      showToast('Could not reach the server', 'error')
    } finally {
      setLoading(false)
    }
  }, [authHeader, showToast])

  useEffect(() => {
    void load()
  }, [load])

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    const headers = await authHeader()
    if (!headers) {
      showToast('Sign in required', 'error')
      return
    }

    const program_headers: Partial<Record<SelectedProgram, ProgramHeaderOverride>> = {}
    for (const id of ['sprint_standard', 'sprint_monk', 'transform'] as const) {
      const t = perProgram[id]?.title?.trim()
      const st = perProgram[id]?.subtitle?.trim()
      if (t || st) {
        program_headers[id] = {
          title: t || null,
          subtitle: st || null,
        }
      }
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/onboarding/settings', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_selection_title: settings.program_selection_title.trim(),
          program_selection_subtitle: settings.program_selection_subtitle.trim(),
          program_headers,
        }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        showToast(json.error ?? 'Save failed', 'error')
        return
      }
      showToast('Saved', 'success')
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mb-8 rounded-lg border border-border p-4">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Program Selection Screen</h3>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading…
        </p>
      ) : (
        <form className="space-y-4" onSubmit={(e) => void saveSettings(e)}>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="obs-header-title">
              Header Title
            </label>
            <Input
              id="obs-header-title"
              type="text"
              value={settings.program_selection_title}
              onChange={(e) => updateSettings({ program_selection_title: e.target.value })}
              className="w-full rounded-md border border-input bg-background p-2 text-foreground"
              placeholder="Choose your path"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="obs-subheader">
              Subheader / Description
            </label>
            <Textarea
              id="obs-subheader"
              value={settings.program_selection_subtitle}
              onChange={(e) => updateSettings({ program_selection_subtitle: e.target.value })}
              className="min-h-[4.5rem] w-full resize-y rounded-md border border-input bg-background p-2 text-sm text-foreground"
              rows={2}
              placeholder="Select the program that fits your goals and schedule"
              required
            />
          </div>

          <details className="rounded-md border border-border bg-muted/20 p-3 text-sm">
            <summary className="cursor-pointer font-medium text-foreground">Optional per-program headline overrides</summary>
            <p className="mt-2 text-xs text-muted-foreground">
              When a user selects a track, these override the header title/subheader for that card only (leave blank to use
              the fields above).
            </p>
            <div className="mt-4 space-y-4">
              {PROGRAM_OPTIONS.map(({ value: id }) => (
                <div key={id} className="rounded-md border border-border bg-card/50 p-3">
                  <p className="mb-2 text-xs font-semibold text-foreground">{SELECTED_PROGRAM_LABEL[id]}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Title override</Label>
                      <Input
                        value={perProgram[id].title}
                        onChange={(e) =>
                          setPerProgram((p) => ({
                            ...p,
                            [id]: { ...p[id], title: e.target.value },
                          }))
                        }
                        className="mt-1 h-9 border-border bg-background text-sm"
                        placeholder="Same as header title"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Subheader override</Label>
                      <Input
                        value={perProgram[id].subtitle}
                        onChange={(e) =>
                          setPerProgram((p) => ({
                            ...p,
                            [id]: { ...p[id], subtitle: e.target.value },
                          }))
                        }
                        className="mt-1 h-9 border-border bg-background text-sm"
                        placeholder="Same as subheader"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>

          <Button
            type="submit"
            disabled={saving}
            className="bg-accent px-4 py-2 font-semibold text-accent-foreground hover:bg-accent/90"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </form>
      )}
    </Card>
  )
}
