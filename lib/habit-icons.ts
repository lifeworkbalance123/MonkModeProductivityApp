/**
 * Emoji icons for habits (create picker + edit dialog + display fallback).
 */

/** Curated picker (10): shown when creating a habit and as the first row when editing. */
export const HABIT_ICON_PICKER_LIBRARY = [
  '🛏️',
  '🪥',
  '📔',
  '💪',
  '🧘',
  '📚',
  '📵',
  '💧',
  '✅',
  '⭐',
] as const

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
  '🪥',
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

/** Full list for the edit-habit dialog (picker library first, then presets + extras). */
export const HABIT_EMOJI_OPTIONS = dedupeOrder(
  [...HABIT_ICON_PICKER_LIBRARY],
  [...HABIT_ICON_PRESETS, ...EXTRA_EMOJI],
)

/**
 * Guess an emoji from the habit name when `icon` is empty (display only until the user saves).
 */
export function suggestHabitIconFromName(name: string): string | null {
  const n = name.toLowerCase().trim()
  if (!n) return null

  if (n.includes('brush') || n.includes('teeth') || n.includes('floss')) return '🪥'
  if (n.includes('gratitude')) return '📔'
  if (n.includes('journal')) return '📝'
  if (n.includes('meditat')) return '🧘'
  if (n.includes('gym') || n.includes('lift') || n.includes('weights')) return '💪'
  if (n.includes('read')) return '📚'
  if (n.includes('walk') && !n.includes('bed')) return '🚶'
  if (n.includes('run') || n.includes('jog')) return '🏃'
  if (n.includes('exercise') || n.includes('workout') || n.includes('cardio')) return '💪'
  if (n.includes('yoga') || n.includes('stretch')) return '🧘'
  if (n.includes('water') || n.includes('hydrat')) return '💧'
  if (n.includes('phone') || n.includes('screen') || n.includes('scroll')) return '📵'
  if (n.includes('shower') || n.includes('cold plunge')) return '🚿'
  if (n.includes('sleep') || n.includes('bedtime')) return '💤'
  if (n.includes('make bed') || (n.includes('bed') && !n.includes('time'))) return '🛏️'
  if (n.includes('meal') || n.includes('eat ') || n.includes('nutrition')) return '🥗'
  if (n.includes('study') || n.includes('learn')) return '📚'
  if (n.includes('work') || n.includes('deep work') || n.includes('focus block')) return '💼'
  if (n.includes('clean') || n.includes('tidy')) return '🧹'
  if (n.includes('music') || n.includes('practice')) return '🎵'
  if (n.includes('pray')) return '🙏'

  return null
}

export function getHabitDisplayIcon(habit: { name: string; icon?: string | null }): string | null {
  const raw = habit.icon?.trim()
  if (raw) return raw
  return suggestHabitIconFromName(habit.name)
}
