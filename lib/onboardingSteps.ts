/** Row from `public.onboarding_steps` (V2 program wizard). */
export type OnboardingStepRow = {
  id: string
  step_order: number
  title: string
  description: string | null
  video_url: string | null
  action_label: string
  step_kind: OnboardingStepKind
  created_at: string
  updated_at: string
}

/** Which UI template to render (beyond generic title/description/video). */
export type OnboardingStepKind =
  | 'welcome'
  | 'why'
  | 'commitment'
  | 'wake'
  | 'ready'
  | 'content'
  | 'goal_choice'
  | 'conditional'
  | 'environment'

export function isOnboardingStepKind(v: string): v is OnboardingStepKind {
  return (
    v === 'welcome' ||
    v === 'why' ||
    v === 'commitment' ||
    v === 'wake' ||
    v === 'ready' ||
    v === 'content' ||
    v === 'goal_choice' ||
    v === 'conditional' ||
    v === 'environment'
  )
}

/** Shipped default when CMS has no rows (monkcubed onboarding script). */
export const DEFAULT_ONBOARDING_STEPS: Omit<
  OnboardingStepRow,
  'id' | 'created_at' | 'updated_at'
>[] = [
  {
    step_order: 0,
    title: 'monkcubed',
    description:
      'monk³ = discipline × discipline × discipline. Three ways to train.\n\nWelcome to monkcubed. Discipline to the third power.',
    video_url: null,
    action_label: 'Choose your path',
    step_kind: 'welcome',
  },
  {
    step_order: 1,
    title: 'What is your primary goal?',
    description:
      'Sprint (21–60 days): complete a project.\nTransform (60 days): holistic habit change.\nMastery (90+ days): advanced discipline.',
    video_url: null,
    action_label: 'Continue',
    step_kind: 'goal_choice',
  },
  {
    step_order: 2,
    title: 'Your focus',
    description: '',
    video_url: null,
    action_label: 'Continue',
    step_kind: 'conditional',
  },
  {
    step_order: 3,
    title: 'Small frictions. Big results.',
    description:
      'Set up your environment.\n\n---ENV---\nPhone charges outside bedroom.\nDeleted 3 distracting apps.\nTold one person about monkcubed.',
    video_url: null,
    action_label: 'Continue',
    step_kind: 'environment',
  },
  {
    step_order: 4,
    title: 'Your journey begins tomorrow.',
    description:
      'Starter habits will appear in Habits after you begin. You can edit them anytime.',
    video_url: null,
    action_label: 'Lock in',
    step_kind: 'ready',
  },
]

export function parseWhyDescription(description: string | null): {
  intro: string
  cardTitle: string
  cardBody: string
} {
  if (!description) {
    return { intro: '', cardTitle: 'Ask yourself:', cardBody: '' }
  }
  const parts = description.split('---CARD---')
  const intro = (parts[0] ?? '').trim()
  const rest = (parts[1] ?? '').trim()
  const lines = rest.split('\n')
  const cardTitle = lines[0]?.trim() || 'Ask yourself:'
  const cardBody = lines.slice(1).join('\n').trim()
  return { intro, cardTitle, cardBody }
}

export function parseCommitmentDescription(description: string | null): {
  intro: string
  pledge: string
} {
  if (!description) return { intro: '', pledge: '' }
  const parts = description.split('---CHECK---')
  return {
    intro: (parts[0] ?? '').trim(),
    pledge: (parts[1] ?? '').trim(),
  }
}

export function parseWakeDescription(description: string | null): {
  intro: string
  wakeLabel: string
  habitsBlock: string
} {
  if (!description) {
    return {
      intro: '',
      wakeLabel: 'What time do you wake up?',
      habitsBlock: '',
    }
  }
  const [beforeWake, afterWake] = description.split('---WAKE---')
  const intro = (beforeWake ?? '').trim()
  const wakeSection = (afterWake ?? '').split('---HABITS---')
  const wakeLines = (wakeSection[0] ?? '').trim().split('\n')
  const wakeLabel = wakeLines[0]?.trim() || 'What time do you wake up?'
  const habitsBlock = (wakeSection[1] ?? '').trim()
  return { intro, wakeLabel, habitsBlock }
}

export function parseEnvironmentDescription(description: string | null): {
  intro: string
  items: string[]
} {
  if (!description) return { intro: '', items: [] }
  const [before, after] = description.split('---ENV---')
  const intro = (before ?? '').trim()
  const items = (after ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  return { intro, items }
}
