'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isColorThemeId, THEME_IDS, type ColorThemeId } from '@/lib/colorThemes'

export type ThemePersonaRow = {
  id: ColorThemeId
  display_name: string
  description: string | null
  updated_at?: string
}

function sortPersonas(rows: ThemePersonaRow[]): ThemePersonaRow[] {
  const order = new Map(THEME_IDS.map((id, i) => [id, i]))
  return [...rows].sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99))
}

export function useThemePersonas() {
  const [personas, setPersonas] = useState<ThemePersonaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: qErr } = await supabase
      .from('theme_personas')
      .select('id, display_name, description, updated_at')
      .in('id', [...THEME_IDS])
      .order('id')

    if (qErr) {
      setError(qErr.message)
      setPersonas([])
    } else {
      const rows = ((data ?? []) as ThemePersonaRow[]).filter((r) => isColorThemeId(r.id))
      setPersonas(sortPersonas(rows))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { personas, loading, error, refresh: load }
}
