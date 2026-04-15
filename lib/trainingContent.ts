/**
 * Admin-curated monkcubed training catalog.
 * Edit this file to add, remove, or update modules (ship via deploy / repo).
 */

export type TrainingModule = {
  id: string
  title: string
  description: string
  youtubeUrl: string
  duration: string
  type: 'video' | 'article'
  isPro: boolean
  category: string
  thumbnail?: string
}

export const adminTrainingModules: TrainingModule[] = [
  {
    id: 'monk-mode-explained',
    title: 'Transform explained',
    description:
      'What the Transform path is, why it works, ' +
      'and how to apply it to your daily ' +
      'life starting today.',
    youtubeUrl: 'https://www.youtube.com/watch?v=REPLACE_WITH_REAL_ID',
    duration: '15 min',
    type: 'video',
    isPro: false,
    category: 'Foundations',
  },
  {
    id: 'pomodoro-technique',
    title: 'The Pomodoro Technique',
    description:
      'Master 25-minute focused sessions ' +
      'to maximise productivity and beat ' +
      'procrastination for good.',
    youtubeUrl: 'https://www.youtube.com/watch?v=REPLACE_WITH_REAL_ID',
    duration: '12 min',
    type: 'video',
    isPro: false,
    category: 'Focus',
  },
  {
    id: 'time-boxing-mastery',
    title: 'Time Boxing Mastery',
    description:
      'Schedule every minute of your day ' +
      'with intention. The system used by ' +
      'Elon Musk and Bill Gates.',
    youtubeUrl: 'https://www.youtube.com/watch?v=REPLACE_WITH_REAL_ID',
    duration: '18 min',
    type: 'video',
    isPro: true,
    category: 'Planning',
  },
  {
    id: 'atomic-habits',
    title: 'Building Atomic Habits',
    description:
      'Small changes, remarkable results. ' +
      'The science behind habits that ' +
      'actually stick long term.',
    youtubeUrl: 'https://www.youtube.com/watch?v=REPLACE_WITH_REAL_ID',
    duration: '22 min',
    type: 'video',
    isPro: true,
    category: 'Habits',
  },
  {
    id: 'deep-work-protocol',
    title: 'Deep Work Protocol',
    description:
      "Cal Newport's framework for " +
      'producing your best work in ' +
      'distraction-free 90-minute sprints.',
    youtubeUrl: 'https://www.youtube.com/watch?v=REPLACE_WITH_REAL_ID',
    duration: '25 min',
    type: 'video',
    isPro: true,
    category: 'Focus',
  },
  {
    id: 'morning-routine',
    title: 'Morning Routine Blueprint',
    description:
      'Design a powerful morning routine ' +
      'that sets the tone for a focused, ' +
      'productive day every single day.',
    youtubeUrl: 'https://www.youtube.com/watch?v=REPLACE_WITH_REAL_ID',
    duration: '18 min',
    type: 'video',
    isPro: true,
    category: 'Routine',
  },
  {
    id: 'evening-reflection',
    title: 'Evening Reflection Practice',
    description:
      'How to review your day, celebrate ' +
      'wins, and prepare mentally for ' +
      'an even better tomorrow.',
    youtubeUrl: 'https://www.youtube.com/watch?v=REPLACE_WITH_REAL_ID',
    duration: '10 min',
    type: 'video',
    isPro: true,
    category: 'Routine',
  },
  {
    id: 'stoic-mindset',
    title: 'Stoic Mindset for High Performance',
    description:
      'Ancient philosophy meets modern ' +
      'productivity. How stoicism builds ' +
      'unshakeable mental discipline.',
    youtubeUrl: 'https://www.youtube.com/watch?v=REPLACE_WITH_REAL_ID',
    duration: '20 min',
    type: 'video',
    isPro: true,
    category: 'Mindset',
  },
]

/** True when the URL resolves to a real embeddable YouTube id (not a placeholder). */
export function isCuratedYoutubeReady(url: string): boolean {
  const id = getYouTubeId(url.trim())
  return !!id && id !== 'REPLACE_WITH_REAL_ID'
}

export function getYouTubeId(url: string): string | null {
  if (!url) return null

  const patterns = [
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtu\.be\/([^?\s]+)/,
    /youtube\.com\/embed\/([^?\s]+)/,
    /youtube\.com\/shorts\/([^?\s]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function getYouTubeThumbnail(url: string): string {
  const id = getYouTubeId(url)
  if (!id || id === 'REPLACE_WITH_REAL_ID') return ''
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`
}
