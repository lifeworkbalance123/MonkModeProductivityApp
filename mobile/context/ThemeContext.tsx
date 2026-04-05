import AsyncStorage from '@react-native-async-storage/async-storage'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type ThemeFontDisplay = 'serif' | 'mono' | 'slab' | 'geometric'

export type Theme = {
  id: string
  name: string
  persona: string
  base: string
  text: string
  accent: string
  cardBg: string
  borderColor: string
  fontDisplay: ThemeFontDisplay
  fontBody: string
  isDark: boolean
  tagline: string
}

export const THEMES: Theme[] = [
  {
    id: 'minimalist',
    name: 'Minimalist',
    persona: 'The Minimalist',
    base: '#F9F9F9',
    text: '#2D2D2D',
    accent: '#C0C0C0',
    cardBg: '#FFFFFF',
    borderColor: '#E0E0E0',
    isDark: false,
    fontDisplay: 'serif',
    fontBody: 'System',
    tagline: 'Invisible UI. Just you and your work.',
  },
  {
    id: 'architect',
    name: 'Architect',
    persona: 'The Architect',
    base: '#121212',
    text: '#F0F0F0',
    accent: '#2E5BFF',
    cardBg: '#1C1C1C',
    borderColor: '#2A2A2A',
    isDark: true,
    fontDisplay: 'mono',
    fontBody: 'System',
    tagline: 'Cold discipline. Every day is a mission.',
  },
  {
    id: 'flowseeker',
    name: 'Flow Seeker',
    persona: 'The Flow Seeker',
    base: '#FFF9F0',
    text: '#3E2723',
    accent: '#84A59D',
    cardBg: '#FFFFFF',
    borderColor: '#E8DDD4',
    isDark: false,
    fontDisplay: 'serif',
    fontBody: 'System',
    tagline: "Cycle with your energy. Flow, don't force.",
  },
  {
    id: 'resetter',
    name: 'Resetter',
    persona: 'The Resetter',
    base: '#EAE0D5',
    text: '#495057',
    accent: '#A85832',
    cardBg: '#F5EDE4',
    borderColor: '#D4C4B5',
    isDark: false,
    fontDisplay: 'slab',
    fontBody: 'System',
    tagline: 'Ground yourself. Reclaim your focus.',
  },
  {
    id: 'ascetic',
    name: 'Modern Ascetic',
    persona: 'The Modern Ascetic',
    base: '#FFFFFF',
    text: '#000000',
    accent: '#1A237E',
    cardBg: '#FAFAFA',
    borderColor: '#E8E8E8',
    isDark: false,
    fontDisplay: 'geometric',
    fontBody: 'System',
    tagline: 'No fluff. No distractions. Just clarity.',
  },
]

export const DEFAULT_THEME_ID = 'architect'

export function getThemeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!
}

const STORAGE_KEY = 'monkmode_theme'

type ThemeContextValue = {
  currentTheme: Theme
  setTheme: (id: string) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<string>(DEFAULT_THEME_ID)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY)
        if (cancelled) return
        if (saved && THEMES.some((t) => t.id === saved)) {
          setThemeIdState(saved)
        }
      } catch {
        /* keep default */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const setTheme = useCallback((id: string) => {
    const next = getThemeById(id)
    setThemeIdState(next.id)
    AsyncStorage.setItem(STORAGE_KEY, next.id).catch(() => {})
  }, [])

  const currentTheme = useMemo(() => getThemeById(themeId), [themeId])

  const value = useMemo<ThemeContextValue>(
    () => ({
      currentTheme,
      setTheme,
      isDark: currentTheme.isDark,
    }),
    [currentTheme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
