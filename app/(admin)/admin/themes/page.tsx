'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/context/ToastContext'
import { useThemePersonas, type ThemePersonaRow } from '@/hooks/useThemePersonas'
import { THEME_ACCENT_SWATCH, THEME_IDS, type ColorThemeId } from '@/lib/colorThemes'

type Draft = Record<ColorThemeId, { display_name: string; description: string }>

function toDraft(rows: ThemePersonaRow[]): Draft {
  const d = {} as Draft
  for (const id of THEME_IDS) {
    const r = rows.find((x) => x.id === id)
    d[id] = {
      display_name: r?.display_name ?? '',
      description: r?.description ?? '',
    }
  }
  return d
}

export default function AdminThemesPage() {
  const { showToast } = useToast()
  const { personas, loading, error, refresh } = useThemePersonas()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState<ColorThemeId | null>(null)

  useEffect(() => {
    if (!loading && personas.length) setDraft(toDraft(personas))
  }, [loading, personas])

  async function save(id: ColorThemeId) {
    if (!draft) return
    const row = draft[id]
    if (!row.display_name.trim()) {
      showToast('Display name is required.', 'error')
      return
    }
    setSaving(id)
    const { error: upErr } = await supabase
      .from('theme_personas')
      .update({
        display_name: row.display_name.trim(),
        description: row.description.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    setSaving(null)
    if (upErr) {
      showToast(upErr.message, 'error')
      return
    }
    showToast('Theme persona saved.', 'success')
    await refresh()
  }

  if (loading && !personas.length) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        Loading themes…
      </div>
    )
  }

  if (error && !personas.length) {
    return (
      <Card className="border-red-900/60 bg-red-950/30 p-6 text-sm text-red-200">
        <p className="font-medium">Could not load theme_personas</p>
        <p className="mt-2 text-red-300/90">{error}</p>
        <p className="mt-3 text-xs text-red-200/70">
          Run the Supabase migration that creates <code className="rounded bg-black/30 px-1">theme_personas</code>, then
          refresh.
        </p>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Theme personas</h1>
        <p className="mt-1 text-sm text-slate-400">
          Edit the display name and description for each fixed palette. Colors are defined in code (
          <code className="text-slate-300">app/globals.css</code>), not in the database.
        </p>
      </div>

      {!draft ? null : (
        <div className="space-y-6">
          {THEME_IDS.map((id) => (
            <Card key={id} className="border-slate-700 bg-slate-900/40 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="h-10 w-10 shrink-0 rounded-full border border-slate-600"
                  style={{ backgroundColor: THEME_ACCENT_SWATCH[id] }}
                  aria-hidden
                />
                <div>
                  <p className="font-mono text-xs text-slate-500">id (read-only)</p>
                  <p className="font-medium text-white">{id}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${id}`} className="text-slate-300">
                    Display name
                  </Label>
                  <Input
                    id={`name-${id}`}
                    value={draft[id].display_name}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev ? { ...prev, [id]: { ...prev[id], display_name: e.target.value } } : prev,
                      )
                    }
                    className="border-slate-600 bg-slate-950 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`desc-${id}`} className="text-slate-300">
                    Description
                  </Label>
                  <Textarea
                    id={`desc-${id}`}
                    rows={2}
                    value={draft[id].description}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev ? { ...prev, [id]: { ...prev[id], description: e.target.value } } : prev,
                      )
                    }
                    className="resize-y border-slate-600 bg-slate-950 text-white"
                  />
                </div>
                <Button
                  type="button"
                  className="bg-amber-500 font-semibold text-slate-950 hover:bg-amber-400"
                  disabled={saving !== null}
                  onClick={() => void save(id)}
                >
                  {saving === id ? 'Saving…' : 'Save persona'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
