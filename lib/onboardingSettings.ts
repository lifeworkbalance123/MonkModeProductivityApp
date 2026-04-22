import type { SelectedProgram } from '@/lib/onboardingProgramFlow'

export type ProgramHeaderOverride = {
  title?: string | null
  subtitle?: string | null
}

export type OnboardingSettingsRow = {
  id: string
  program_selection_title: string
  program_selection_subtitle: string
  program_headers: Partial<Record<SelectedProgram, ProgramHeaderOverride>>
}

/** Defaults when DB row is missing or columns null. */
export const DEFAULT_ONBOARDING_SELECTION_COPY = {
  program_selection_title: 'Choose your path',
  program_selection_subtitle: 'Select the program that fits your goals and schedule',
} as const

export function resolveProgramSelectionCopy(
  settings: OnboardingSettingsRow | null,
  selectedProgram: SelectedProgram | null,
): { title: string; subtitle: string } {
  const baseTitle =
    settings?.program_selection_title?.trim() ||
    DEFAULT_ONBOARDING_SELECTION_COPY.program_selection_title
  const baseSubtitle =
    settings?.program_selection_subtitle?.trim() ||
    DEFAULT_ONBOARDING_SELECTION_COPY.program_selection_subtitle

  if (!selectedProgram || !settings?.program_headers) {
    return { title: baseTitle, subtitle: baseSubtitle }
  }

  const ov = settings.program_headers[selectedProgram]
  const t = ov?.title?.trim()
  const s = ov?.subtitle?.trim()
  return {
    title: t || baseTitle,
    subtitle: s || baseSubtitle,
  }
}
