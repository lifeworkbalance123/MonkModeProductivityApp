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
export type OnboardingStepKind = 'welcome' | 'why' | 'commitment' | 'wake' | 'ready' | 'content'

export function isOnboardingStepKind(v: string): v is OnboardingStepKind {
  return (
    v === 'welcome' ||
    v === 'why' ||
    v === 'commitment' ||
    v === 'wake' ||
    v === 'ready' ||
    v === 'content'
  )
}

/** Shipped default when the table has no rows (same flow as legacy hardcoded UI). */
export const DEFAULT_ONBOARDING_STEPS: Omit<
  OnboardingStepRow,
  'id' | 'created_at' | 'updated_at'
>[] = [
  {
    step_order: 0,
    title: 'Welcome to the 60-Day Monk Mode Program',
    description:
      'Over the next 60 days you will build the habits, focus, and discipline of a monk.\n\nEach day takes 5–10 minutes. The results last a lifetime.',
    video_url: null,
    action_label: "Let's go →",
    step_kind: 'welcome',
  },
  {
    step_order: 1,
    title: 'Before we start — why are you here?',
    description:
      'Most people who start a program like this quit by Day 5. The ones who finish have one thing in common: they know WHY they started. You don\'t need to tell us. But you need to know it.\n\n---CARD---\nAsk yourself:\n"Who do I want to be in 60 days? What would change in my life if I had the focus and discipline of a monk?"',
    video_url: null,
    action_label: 'I know my why →',
    step_kind: 'why',
  },
  {
    step_order: 2,
    title: 'The commitment',
    description:
      'This program works if you show up every day — even on the days you don\'t feel like it. Especially those days.\n\nThe commitment is simple: one lesson, one action, every day for 60 days.\n\n---CHECK---\nI commit to showing up every day for 60 days. I will complete the daily lesson and action — even on hard days.',
    video_url: null,
    action_label: 'I commit →',
    step_kind: 'commitment',
  },
  {
    step_order: 3,
    title: 'Quick setup',
    description:
      'One question to personalise your program.\n\n---WAKE---\nWhat time do you wake up?\n\n---HABITS---\nWe\'ll pre-load these starter habits for you:\n🛏️ Make bed\n📵 No phone first hour\n📓 Morning journal\n🚿 Cold shower\n💪 Exercise\n📚 Read 20 minutes\n\nYou can edit these anytime in the Habits section.',
    video_url: null,
    action_label: 'Looks good →',
    step_kind: 'wake',
  },
  {
    step_order: 4,
    title: "You're ready.",
    description:
      'Day 1 begins now. Your first lesson is waiting.\n\nRemember: the goal is not to be perfect. The goal is to show up every single day.',
    video_url: null,
    action_label: 'Begin Day 1 →',
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
