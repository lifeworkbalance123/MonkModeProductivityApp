/** Palette ids — CSS in `app/globals.css` (`data-color-theme` on `<html>`). */

export const THEME_IDS = ['stoic', 'zen', 'nomad', 'forge', 'silent'] as const

export type ColorThemeId = (typeof THEME_IDS)[number]

const LEGACY_THEME_MAP: Record<string, ColorThemeId> = {
  forge: 'stoic',
  sanctuary: 'nomad',
  sage: 'silent',
}

export function isColorThemeId(value: unknown): value is ColorThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value)
}

/** Map DB / localStorage values from older app versions onto current ids. */
export function normalizeColorThemeId(value: unknown): ColorThemeId {
  if (typeof value !== 'string' || !value.trim()) return DEFAULT_COLOR_THEME
  const v = value.trim()
  if (isColorThemeId(v)) return v
  const mapped = LEGACY_THEME_MAP[v]
  return mapped ?? DEFAULT_COLOR_THEME
}

export const DEFAULT_COLOR_THEME: ColorThemeId = 'stoic'

/** Accent swatch for settings cards (representative CTA hue per palette). */
export const THEME_ACCENT_SWATCH: Record<ColorThemeId, string> = {
  stoic: '#D4AF37',
  zen: '#8B8B8B',
  nomad: '#D4A373',
  forge: '#E85D04',
  silent: '#C5A059',
}

export function applyColorThemeToDocument(theme: ColorThemeId) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.colorTheme = theme
  if (theme === 'zen') {
    root.classList.remove('dark')
  } else {
    root.classList.add('dark')
  }
}

export const COLOR_THEME_STORAGE_KEY = 'monk-color-theme'
