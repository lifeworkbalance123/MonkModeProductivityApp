import { DEFAULT_ONBOARDING_STEPS, type OnboardingStepRow } from '@/lib/onboardingSteps'

export type OnboardingContentRow = {
  id: string
  step_key: string
  heading: string
  body: string
  cta_label: string
  highlight_text: string | null
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

/** Build wizard rows from CMS + habits; merges defaults when a step_key row is missing. */
export function buildOnboardingStepsFromCms(
  contentRows: OnboardingContentRow[],
  habits: OnboardingHabitRow[],
): OnboardingStepRow[] {
  const map = Object.fromEntries(contentRows.map((r) => [r.step_key, r])) as Record<string, OnboardingContentRow>
  const t = new Date().toISOString()
  const habitLines =
    habits.length > 0
      ? habits
          .filter((h) => h.active)
          .sort((a, b) => a.display_order - b.display_order)
          .map((h) => `${h.icon} ${h.name}`)
      : DEFAULT_HABITS_FALLBACK_LINES()

  return CMS_STEP_KEYS.map((key, i) => {
    const row = map[key]
    const step_kind: OnboardingStepRow['step_kind'] =
      key === 'setup' ? 'wake' : key === 'ready' ? 'ready' : key === 'welcome' ? 'welcome' : key === 'why' ? 'why' : 'commitment'
    const base = defaultStepForKind(step_kind)

    if (!row) {
      return {
        id: `cms-${key}`,
        step_order: i,
        title: base.title,
        description: base.description ?? '',
        video_url: base.video_url ?? null,
        action_label: base.action_label,
        step_kind,
        created_at: t,
        updated_at: t,
      }
    }

    const heading = row.heading?.trim() || base.title
    const body = (row.body ?? '').trim()
    const cta = row.cta_label?.trim() || base.action_label
    const highlight = (row.highlight_text ?? '').trim()

    let description = base.description ?? ''
    if (key === 'welcome') {
      description = body || (base.description ?? '')
    } else if (key === 'why') {
      const cardBody = highlight || parseWhyFallbackFromDefault(base.description ?? '')
      description = `${body}\n\n---CARD---\nAsk yourself:\n${cardBody}`
    } else if (key === 'commitment') {
      const pledge = highlight || parsePledgeFallback(base.description ?? '')
      description = `${body}\n\n---CHECK---\n${pledge}`
    } else if (key === 'setup') {
      const habitsBlock = [
        "We'll pre-load these starter habits for you:",
        ...habitLines,
        '',
        'You can edit these anytime in the Habits section.',
      ].join('\n')
      description = `${body}\n\n---WAKE---\nWhat time do you wake up?\n\n---HABITS---\n${habitsBlock}`
    } else if (key === 'ready') {
      description = body || (base.description ?? '')
    }

    return {
      id: `cms-${key}`,
      step_order: i,
      title: heading,
      description,
      video_url: null,
      action_label: cta,
      step_kind,
      created_at: t,
      updated_at: row.updated_at ?? t,
    }
  })
}

function DEFAULT_HABITS_FALLBACK_LINES(): string[] {
  return ['🛏️ Make bed', '📵 No phone first hour', '📓 Morning journal', '🚿 Cold shower', '💪 Exercise', '📚 Read 20 minutes']
}

function parseWhyFallbackFromDefault(desc: string): string {
  const parts = desc.split('---CARD---')
  const rest = (parts[1] ?? '').trim()
  const lines = rest.split('\n')
  return lines.slice(1).join('\n').trim() || rest
}

function parsePledgeFallback(desc: string): string {
  const parts = desc.split('---CHECK---')
  return (parts[1] ?? '').trim() || desc
}
