/** Palette ids — CSS in `app/globals.css` (`data-color-theme` on `<html>`). */

export const THEME_IDS = [
  'noir',
  'slate',
  'terrain',
  'bloom',
  'vapor',
  'harvest',
  'midnight',
] as const

export type ColorThemeId = (typeof THEME_IDS)[number]

/** Light palettes: `html` uses no `.dark` class (Tailwind `dark:` variants). */
export const LIGHT_COLOR_THEME_IDS: readonly ColorThemeId[] = ['bloom', 'harvest']

export function isLightColorTheme(id: string): boolean {
  return (LIGHT_COLOR_THEME_IDS as readonly string[]).includes(id)
}

/** Map DB / localStorage values from older app versions onto current ids. */
const LEGACY_THEME_MAP: Record<string, ColorThemeId> = {
  stoic: 'noir',
  zen: 'bloom',
  nomad: 'slate',
  forge: 'terrain',
  silent: 'midnight',
  rose: 'bloom',
  lavender: 'midnight',
  peach: 'harvest',
  sage: 'terrain',
  sanctuary: 'slate',
}

export function isColorThemeId(value: unknown): value is ColorThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value)
}

export function normalizeColorThemeId(value: unknown): ColorThemeId {
  if (typeof value !== 'string' || !value.trim()) return DEFAULT_COLOR_THEME
  const v = value.trim()
  if (isColorThemeId(v)) return v
  const mapped = LEGACY_THEME_MAP[v]
  return mapped ?? DEFAULT_COLOR_THEME
}

export const DEFAULT_COLOR_THEME: ColorThemeId = 'noir'

/** Accent swatch for settings / admin cards (solid; vapor uses a pink stop from its gradient). */
export const THEME_ACCENT_SWATCH: Record<ColorThemeId, string> = {
  noir: '#00D4FF',
  slate: '#D4AF37',
  terrain: '#E07A5F',
  bloom: '#FF8A7A',
  vapor: '#FF007F',
  harvest: '#F4D03F',
  midnight: '#9B59B6',
}

export function applyColorThemeToDocument(theme: ColorThemeId) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.colorTheme = theme
  if (isLightColorTheme(theme)) {
    root.classList.remove('dark')
  } else {
    root.classList.add('dark')
  }
}

export const COLOR_THEME_STORAGE_KEY = 'monk-color-theme'
