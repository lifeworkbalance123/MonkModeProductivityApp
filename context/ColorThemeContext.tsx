'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import {
  applyColorThemeToDocument,
  COLOR_THEME_STORAGE_KEY,
  type ColorThemeId,
  isColorThemeId,
} from '@/lib/colorThemes'
import { useAuth } from '@/context/AuthContext'

type ColorThemeContextValue = {
  themeId: ColorThemeId
  setThemeId: (id: ColorThemeId) => Promise<void>
  /** Hydration + first load from DB */
  ready: boolean
}

const ColorThemeContext = createContext<ColorThemeContextValue | undefined>(undefined)

const DEFAULT_THEME: ColorThemeId = 'forge'

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const [themeId, setThemeIdState] = useState<ColorThemeId>(DEFAULT_THEME)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    applyColorThemeToDocument(themeId)
  }, [themeId])

  useEffect(() => {
    if (authLoading) return

    let cancelled = false

    async function load() {
      if (!user) {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(COLOR_THEME_STORAGE_KEY) : null
        const next = isColorThemeId(raw) ? raw : DEFAULT_THEME
        if (!cancelled) {
          setThemeIdState(next)
          applyColorThemeToDocument(next)
          setReady(true)
        }
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('theme_preference')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return

      const pref = (data as { theme_preference?: string } | null)?.theme_preference
      const next = isColorThemeId(pref) ? pref : DEFAULT_THEME
      setThemeIdState(next)
      applyColorThemeToDocument(next)
      try {
        localStorage.setItem(COLOR_THEME_STORAGE_KEY, next)
      } catch {
        /* ignore */
      }
      if (error) console.warn('ColorThemeProvider: theme_preference', error)
      setReady(true)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [authLoading, user])

  const setThemeId = useCallback(
    async (id: ColorThemeId) => {
      setThemeIdState(id)
      applyColorThemeToDocument(id)
      try {
        localStorage.setItem(COLOR_THEME_STORAGE_KEY, id)
      } catch {
        /* ignore */
      }
      if (user) {
        const { error } = await supabase.from('users').update({ theme_preference: id }).eq('id', user.id)
        if (error) console.error('ColorThemeProvider: save theme', error)
      }
    },
    [user],
  )

  const value = useMemo(
    () => ({
      themeId,
      setThemeId,
      ready,
    }),
    [themeId, setThemeId, ready],
  )

  return <ColorThemeContext.Provider value={value}>{children}</ColorThemeContext.Provider>
}

export function useColorTheme() {
  const ctx = useContext(ColorThemeContext)
  if (!ctx) throw new Error('useColorTheme must be used within ColorThemeProvider')
  return ctx
}
