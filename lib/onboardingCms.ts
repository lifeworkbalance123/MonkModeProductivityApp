import { DEFAULT_ONBOARDING_STEPS, type OnboardingStepRow } from '@/lib/onboardingSteps'

export type OnboardingContentRow = {
  id: string
  step_key: string
  heading: string
  body: string
  cta_label: string
  highlight_text: string | null
  display_order?: number
  updated_at: string
}

export type OnboardingHabitRow = {
  id: string
  name: string
  icon: string
  display_order: number
  active: boolean
  created_at?: string
}

const CMS_STEP_KEYS = ['welcome', 'why', 'commitment', 'setup', 'ready'] as const
export type OnboardingStepKey = (typeof CMS_STEP_KEYS)[number]

function defaultStepForKind(kind: OnboardingStepRow['step_kind']): Omit<OnboardingStepRow, 'id' | 'created_at' | 'updated_at'> {
  const d = DEFAULT_ONBOARDING_STEPS.find((s) => s.step_kind === kind)
  if (!d) {
    return {
      step_order: 0,
      title: '',
      description: '',
      video_url: null,
      action_label: 'Next',
      step_kind: 'content',
    }
  }
  return { ...d }
}

function DEFAULT_HABITS_FALLBACK_LINES(): string[] {
  return ['🛏️ Make bed', '📵 No phone first hour', '📓 Morning journal', '🚿 Cold shower', '💪 Exercise', '📚 Read 20 minutes']
}

function isKnownCmsKey(key: string): key is OnboardingStepKey {
  return (CMS_STEP_KEYS as readonly string[]).includes(key)
}

function rowToWizardStep(
  row: OnboardingContentRow,
  stepOrder: number,
  habits: OnboardingHabitRow[],
): OnboardingStepRow {
  const t = new Date().toISOString()
  const habitLines =
    habits.length > 0
      ? habits
          .filter((h) => h.active)
          .sort((a, b) => a.display_order - b.display_order)
          .map((h) => `${h.icon} ${h.name}`)
      : DEFAULT_HABITS_FALLBACK_LINES()

  if (!isKnownCmsKey(row.step_key)) {
    return {
      id: `cms-${row.step_key}`,
      step_order: stepOrder,
      title: row.heading?.trim() || 'Step',
      description: (row.body ?? '').trim(),
      video_url: null,
      action_label: row.cta_label?.trim() || 'Next',
      step_kind: 'content',
      created_at: t,
      updated_at: row.updated_at ?? t,
    }
  }

  const key = row.step_key
  const step_kind: OnboardingStepRow['step_kind'] =
    key === 'setup'
      ? 'environment'
      : key === 'ready'
        ? 'ready'
        : key === 'welcome'
          ? 'welcome'
          : key === 'why'
            ? 'goal_choice'
            : key === 'commitment'
              ? 'conditional'
              : 'commitment'
  const base = defaultStepForKind(step_kind)

  const heading = row.heading?.trim() || base.title
  const body = (row.body ?? '').trim()
  const cta = row.cta_label?.trim() || base.action_label
  const highlight = (row.highlight_text ?? '').trim()

  let description = base.description ?? ''
  if (key === 'welcome') {
    description = body || (base.description ?? '')
  } else if (key === 'why') {
    description = body || (base.description ?? '')
    if (highlight) {
      description = description ? `${description}\n\n${highlight}` : highlight
    }
  } else if (key === 'commitment') {
    description = body || (base.description ?? '')
    if (highlight) {
      description = description ? `${description}\n\n${highlight}` : highlight
    }
  } else if (key === 'setup') {
    const envDefault = base.description ?? ''
    description = body || envDefault
    if (highlight) {
      description = `${description}\n\n---ENV---\n${highlight}`
    }
  } else if (key === 'ready') {
    const habitsBlock = [
      "We'll pre-load these starter habits for you:",
      ...habitLines,
      '',
      'You can edit these anytime in the Habits section.',
    ].join('\n')
    const core = body || (base.description ?? '')
    description = `${core}\n\n---WAKE---\nWhat time do you start your day?\n\n---HABITS---\n${habitsBlock}`
  }

  return {
    id: `cms-${key}`,
    step_order: stepOrder,
    title: heading,
    description,
    video_url: null,
    action_label: cta,
    step_kind,
    created_at: t,
    updated_at: row.updated_at ?? t,
  }
}

/** Legacy: when CMS has no rows, show the five default wizard steps (defaults merged in UI). */
function buildDefaultsFromEmptyCms(habits: OnboardingHabitRow[]): OnboardingStepRow[] {
  const map = {} as Record<string, OnboardingContentRow>
  const t = new Date().toISOString()
  return CMS_STEP_KEYS.map((key, i) => {
    const row =
      map[key] ??
      ({
        id: '',
        step_key: key,
        heading: '',
        body: '',
        cta_label: '',
        highlight_text: '',
        display_order: i + 1,
        updated_at: t,
      } as OnboardingContentRow)
    return rowToWizardStep(row, i, habits)
  })
}

/**
 * Build wizard rows from CMS + habits.
 * When `contentRows` is non-empty, order follows `display_order` and only those rows appear.
 * When empty, returns the original five-step default flow.
 */
export function buildOnboardingStepsFromCms(
  contentRows: OnboardingContentRow[],
  habits: OnboardingHabitRow[],
): OnboardingStepRow[] {
  if (!contentRows.length) {
    return buildDefaultsFromEmptyCms(habits)
  }

  const sorted = [...contentRows].sort((a, b) => {
    const ao = a.display_order ?? 0
    const bo = b.display_order ?? 0
    if (ao !== bo) return ao - bo
    return a.step_key.localeCompare(b.step_key)
  })

  return sorted.map((row, i) => rowToWizardStep(row, i, habits))
}
