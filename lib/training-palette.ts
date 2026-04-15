/**
 * Training UI uses the same three accents as program phases:
 * Sprint (indigo), Transform (violet), Mastery (gold).
 */

import type { PersonalTrainingCategory } from '@/lib/personal-training-resources'

export const TRAINING_MODE_COLORS = {
  sprint: '#5B6BA8',
  transform: '#8B7EC8',
  mastery: '#D4AF37',
} as const

/** Text/icon on top of a solid mode accent (gold needs dark text). */
export function trainingOnAccentForeground(accent: string): string {
  return accent === TRAINING_MODE_COLORS.mastery ? '#0a0a0a' : '#ffffff'
}

/** Curated / admin module category → accent (covers Foundations / Focus / Planning + more). */
export function trainingAccentFromCategory(category: string): string {
  const c = category.toLowerCase()
  if (/\b(plan|planning|time|schedule|calendar|goal)\b/.test(c)) return TRAINING_MODE_COLORS.mastery
  if (/\b(focus|deep|attention|energy|flow|pomodoro)\b/.test(c)) return TRAINING_MODE_COLORS.transform
  if (/\b(found|habit|routine|health|stoic|mind|body|sleep|journal)\b/.test(c)) return TRAINING_MODE_COLORS.sprint
  return TRAINING_MODE_COLORS.sprint
}

/** Thumbnail area behind play control (replaces old amber-only wash). */
export function trainingThumbnailBackdrop(accent: string): string {
  return [
    'linear-gradient(to bottom right,',
    `color-mix(in srgb, ${accent} 18%, var(--card)),`,
    `color-mix(in srgb, ${accent} 8%, var(--card)),`,
    'var(--background))',
  ].join(' ')
}

export function trainingAccentFromPersonalCategory(
  cat: PersonalTrainingCategory | undefined,
): string {
  switch (cat) {
    case 'Article':
      return TRAINING_MODE_COLORS.transform
    case 'Podcast':
      return TRAINING_MODE_COLORS.mastery
    case 'Video':
      return TRAINING_MODE_COLORS.sprint
    case 'Other':
      return TRAINING_MODE_COLORS.transform
    default:
      return TRAINING_MODE_COLORS.sprint
  }
}
