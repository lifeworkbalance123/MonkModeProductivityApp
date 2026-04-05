import { Platform } from 'react-native'
import type { Theme } from '@/context/ThemeContext'

/** Map persona font tokens to React Native fontFamily strings. */
export function getDisplayFontFamily(theme: Theme): string {
  switch (theme.fontDisplay) {
    case 'serif':
      return Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) ?? 'serif'
    case 'mono':
      return Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: 'monospace',
      }) ?? 'monospace'
    case 'slab':
      return Platform.select({
        ios: 'Georgia',
        android: 'serif',
        default: 'serif',
      }) ?? 'serif'
    case 'geometric':
      return Platform.select({
        ios: 'Avenir Next',
        android: 'sans-serif',
        default: 'sans-serif',
      }) ?? 'sans-serif'
    default:
      return Platform.select({ ios: 'System', default: 'sans-serif' }) ?? 'sans-serif'
  }
}

export function getBodyFontFamily(_theme: Theme): string {
  return Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }) ?? 'sans-serif'
}
