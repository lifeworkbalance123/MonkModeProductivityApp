/** Fixed palette ids — colors live in `app/globals.css` (data-color-theme). */
export const THEME_IDS = ['forge', 'sanctuary', 'sage'] as const

export type ColorThemeId = (typeof THEME_IDS)[number]

export function isColorThemeId(value: unknown): value is ColorThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value)
}

/** Accent swatch for previews (matches globals.css). */
export const THEME_ACCENT_SWATCH: Record<ColorThemeId, string> = {
  forge: '#E25822',
  sanctuary: '#2A9D8F',
  sage: '#C0A080',
}

export function applyColorThemeToDocument(theme: ColorThemeId) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.colorTheme = theme
}

export const COLOR_THEME_STORAGE_KEY = 'monk-color-theme'
