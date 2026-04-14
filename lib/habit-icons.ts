/**
 * Emoji icons for habits (settings + edit dialog).
 * Routines first (typical dashboard habits), then generic marks, then extra variety.
 */

/** Typical home / health / focus habits (matches common starter names). */
export const HABIT_ICON_ROUTINE = [
  '🛏️',
  '📵',
  '📔',
  '🚿',
  '💪',
  '📚',
] as const

/** Simple generic marks (pick one when the routine set does not fit). */
export const HABIT_ICON_GENERIC = [
  '⭐',
  '✨',
  '🎯',
  '🔔',
  '🧩',
  '📌',
  '💡',
  '🔹',
  '⭕',
  '🎨',
] as const

export const HABIT_ICON_PRESETS = [...HABIT_ICON_ROUTINE, ...HABIT_ICON_GENERIC] as const

const EXTRA_EMOJI = [
  '✅',
  '🔥',
  '💧',
  '🏃',
  '🧘',
  '💤',
  '🥗',
  '📝',
  '☀️',
  '🌙',
  '🙏',
  '🎵',
  '🧹',
  '💼',
  '🚶',
  '🌱',
  '❤️',
  '🧠',
  '⏰',
  '🚫',
] as const

function dedupeOrder(first: readonly string[], rest: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const e of first) {
    if (!seen.has(e)) {
      seen.add(e)
      out.push(e)
    }
  }
  for (const e of rest) {
    if (!seen.has(e)) {
      seen.add(e)
      out.push(e)
    }
  }
  return out
}

/** Full list for the edit-habit dialog (presets + extras, no duplicates). */
export const HABIT_EMOJI_OPTIONS = dedupeOrder(
  [...HABIT_ICON_PRESETS],
  [...EXTRA_EMOJI],
)
