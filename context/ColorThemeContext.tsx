'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import {
  applyColorThemeToDocument,
  COLOR_THEME_STORAGE_KEY,
  DEFAULT_COLOR_THEME,
  normalizeColorThemeId,
  type ColorThemeId,
} from '@/lib/colorThemes'
import { useAuth } from '@/context/AuthContext'

type ColorThemeContextValue = {
  themeId: ColorThemeId
  setThemeId: (id: ColorThemeId) => Promise<void>
  /** Hydration + first load from DB */
  ready: boolean
}

const ColorThemeContext = createContext<ColorThemeContextValue | undefined>(undefined)

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const [themeId, setThemeIdState] = useState<ColorThemeId>(DEFAULT_COLOR_THEME)
  const [ready, setReady] = useState(false)
  // If the user changes theme before the DB preference loads, do not clobber it
  // when the async load finishes (this causes a “revert after ~N seconds”).
  const userOverrideRef = useRef(false)

  useEffect(() => {
    applyColorThemeToDocument(themeId)
  }, [themeId])

  useEffect(() => {
    if (authLoading) return

    let cancelled = false

    async function load() {
      if (!user) {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(COLOR_THEME_STORAGE_KEY) : null
        const next = normalizeColorThemeId(raw)
        if (!cancelled) {
          setThemeIdState(next)
          applyColorThemeToDocument(next)
          setReady(true)
        }
        return
      }

      // Apply localStorage immediately for signed-in users too (fast + consistent),
      // then reconcile with DB preference once loaded.
      const localRaw =
        typeof window !== 'undefined'
          ? localStorage.getItem(COLOR_THEME_STORAGE_KEY)
          : null
      const localNext = normalizeColorThemeId(localRaw)
      if (!cancelled && localNext && localNext !== themeId) {
        setThemeIdState(localNext)
        applyColorThemeToDocument(localNext)
      }

      const { data, error } = await supabase
        .from('users')
        .select('theme_preference')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return

      const pref = (data as { theme_preference?: string } | null)?.theme_preference
      const dbNext = normalizeColorThemeId(pref)

      // If the user has already changed the theme in this session, keep their choice.
      if (userOverrideRef.current) {
        if (error) console.warn('ColorThemeProvider: theme_preference', error)
        setReady(true)
        return
      }

      // If the DB has no preference yet, prefer the local value (and try to persist it).
      const next =
        !pref || dbNext === DEFAULT_COLOR_THEME
          ? localNext
          : dbNext

      setThemeIdState(next)
      applyColorThemeToDocument(next)
      try {
        localStorage.setItem(COLOR_THEME_STORAGE_KEY, next)
      } catch {
        /* ignore */
      }
      // If DB preference is missing, best-effort persist from local choice.
      if (!pref && next && next !== dbNext) {
        try {
          await supabase.from('users').update({ theme_preference: next }).eq('id', user.id)
        } catch {
          /* ignore */
        }
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
      userOverrideRef.current = true
      setThemeIdState(id)
      applyColorThemeToDocument(id)
      try {
        localStorage.setItem(COLOR_THEME_STORAGE_KEY, id)
      } catch {
        /* ignore */
      }
      if (user) {
        const { error } = await supabase.from('users').update({ theme_preference: id }).eq('id', user.id)
        // Avoid triggering Next.js "Console Error" overlay for a non-fatal preference save.
        // Some Supabase errors serialize to `{}` in devtools, so prefer a readable message.
        if (error) {
          const msg =
            typeof (error as unknown as { message?: unknown }).message === 'string'
              ? (error as unknown as { message: string }).message
              : 'unknown error'
          console.warn('ColorThemeProvider: save theme', msg)
        }
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
