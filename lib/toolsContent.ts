export type ToolSection =
  | 'Getting Started'
  | 'Daily Essentials'
  | 'Learning'
  | 'Planning'
  | 'Focus & Analysis'
  | 'System'

export interface Tool {
  id: string
  name: string
  icon: string
  section: ToolSection
  /** Short lead: what this tool does in plain language. */
  content: string
  /** One or two lines; each line is at most two sentences. */
  whenToUse: string[]
  /** One or two steps; each line is at most two sentences. */
  howToUse: string[]
  example: string
  link?: string
}

export const SECTION_ORDER: ToolSection[] = [
  'Getting Started',
  'Daily Essentials',
  'Learning',
  'Planning',
  'Focus & Analysis',
  'System',
]

export const pdfFooter =
  'MonkedCubed – Tool Library v1.0 | support@monkcubed.com'

export const setupGuide = {
  day1Tool: `Open MonkedCubed and sign in. Use the sidebar (or menu): Daily has Today and Dashboard; Planning has your calendar tools; Learning lists Training, Video library, and this Tool Library. Pin the app on your phone if you use it every morning. When to use: before your first lesson on day one.`,
  day1Program: `Tap Begin (or your program name on that button). Pick Sprint (~30 days), Monk Mode (~21, higher intensity), or Transform (~60). Complete prompts and trial or payment so lessons and the nav label match your track. When to use: once at the start, or when you change program.`,
  day1Settings: `Open Settings: set theme, notifications, and any wake or profile prompts. Turn on Cloud sync if you use phone and laptop (Pro or bonus). When to use: in the first session, then whenever your devices or routine change.`,
}

export const dayInLife = {
  firstTimeUser: `You open the app and see Begin. You skim this library (or the PDF), choose Transform, then open Today for day one. You tick two habits, peek at Dashboard for the week, and close knowing the single next action. When to use: trial week one.`,
  enrolledUser: `Day 23 of Transform: the nav shows Transform. You read the lesson, start a 50-minute Focus block from your Time Schedule, move one Kanban card to Done, and add one line of gratitude on Dashboard. When to use: mid-program rhythm days.`,
  generalUser: `You are between paid programs but keep the stack. Monday you balance the week in Weekly Planner; Tuesday–Thursday you run lessons from Training or generic Today, habits, and schedule; Friday you scan Analytics and tweak Goals. When to use: maintenance weeks without an active track.`,
}

/** Search matches name, content, bullets, and example (lowercased). */
export function toolMatchesSearch(tool: Tool, q: string): boolean {
  if (!q.trim()) return true
  const n = q.toLowerCase().trim()
  const hay = [
    tool.name,
    tool.content,
    tool.example,
    ...tool.whenToUse,
    ...tool.howToUse,
  ]
    .join(' ')
    .toLowerCase()
  return hay.includes(n)
}

export const tools: Tool[] = [
  {
    id: 'programs-onboarding',
    name: 'Programs & first-day setup',
    icon: '🎯',
    section: 'Getting Started',
    content:
      'Choose Sprint, Monk Mode, or Transform, then walk through intake so day one matches your life.',
    whenToUse: [
      'Right after sign-up, or when you switch tracks after a break.',
    ],
    howToUse: [
      'Use Join / Begin to pick a program length and intensity that fits your deadline.',
      'Answer onboarding honestly (habits, wake time, why). Finish trial or payment when prompted.',
    ],
    example:
      'You pick Monk Mode for a three-week launch push and set a realistic wake time.',
    link: '/join',
  },
  {
    id: 'begin-button',
    name: 'Begin (dynamic program button)',
    icon: '🚀',
    section: 'Daily Essentials',
    content:
      "Your daily program entry. The label shows your active program (e.g. Transform); tap to open today's lesson.",
    whenToUse: [
      'Every workday start, or whenever you begin your deep-work block.',
    ],
    howToUse: [
      'From Daily in the nav, tap the first item; it routes to Today / lesson flow.',
      'If no program yet, the label reads Begin and takes you into selection.',
    ],
    example:
      'Day 12 of Transform: the button says Transform — one tap opens today’s stack.',
    link: '/today',
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: '📊',
    section: 'Daily Essentials',
    content:
      'Your weekly command centre: gratitude, schedule snapshot, and progress cards in one view.',
    whenToUse: [
      'Morning reset or when you want the bird’s-eye view instead of the linear lesson.',
    ],
    howToUse: [
      'Open Dashboard from Daily; move through the week strip to plan or edit slots.',
      'Expand sections you need; pair with Begin so intention and execution stay linked.',
    ],
    example:
      'You log gratitude, skim time blocks, then hit Begin for the lesson.',
    link: '/dashboard',
  },
  {
    id: 'habits',
    name: 'Habits',
    icon: '✅',
    section: 'Daily Essentials',
    content:
      'Track daily anchors (water, phone away, cold shower, etc.) with simple check-offs.',
    whenToUse: [
      'End of morning routine or last thing before bed — whenever you batch identity habits.',
    ],
    howToUse: [
      'Open Habits from Tracking; add a few non-negotiables with names that motivate you.',
      'Tap the circle when done; glance weekly progress from Dashboard or Analytics.',
    ],
    example:
      'Cold shower and ten minutes reading checked before Transform lesson.',
    link: '/habits',
  },
  {
    id: 'goals',
    name: 'Goals',
    icon: '🎖️',
    section: 'Daily Essentials',
    content:
      'Set big outcomes and break them into steps you can review against real weeks.',
    whenToUse: [
      'Start of a program phase or quarter; after Analytics shows a drift.',
    ],
    howToUse: [
      'Open Goals; write one north-star outcome and list the next three moves.',
      'Review every Sunday with Weekly Planner so tasks stay honest.',
    ],
    example:
      '“Ship MVP by day 30” with three milestones tied to Kanban columns.',
    link: '/goals',
  },
  {
    id: 'training',
    name: 'Training (daily lesson hub)',
    icon: '📖',
    section: 'Learning',
    content:
      'Structured program lessons — read, listen, or follow the day’s discipline focus.',
    whenToUse: [
      'Same window as Begin when you want the lesson list instead of the Today shell.',
    ],
    howToUse: [
      'Open Training from Learning; pick today or catch up on a missed day.',
      'Complete the day’s prompt before stacking heavy Focus blocks when possible.',
    ],
    example:
      'You finish day fourteen audio on the train, then log habits at home.',
    link: '/training',
  },
  {
    id: 'video-library',
    name: 'Video library',
    icon: '🎬',
    section: 'Learning',
    content:
      'Extra clips on productivity and Stoic-style habits outside the core lesson.',
    whenToUse: [
      'When you need motivation between phases or a quick technique refresher.',
    ],
    howToUse: [
      'Open Video library; pick a topic; watch in one sitting to avoid tab sprawl.',
      'Note one takeaway in Dashboard or Goals if it changes your week.',
    ],
    example:
      'Friday afternoon you watch a focus clip before a heavy Monk Mode weekend.',
    link: '/videos',
  },
  {
    id: 'time-schedule',
    name: 'Time schedule',
    icon: '🕐',
    section: 'Planning',
    content:
      'Block deep work, meetings, and breaks so your calendar matches your intention.',
    whenToUse: [
      'Sunday night or Monday morning before the week runs you.',
    ],
    howToUse: [
      'Open Time schedule; add or edit blocks per day; keep deep work contiguous when you can.',
      'Cross-check with Focus so planned blocks become started sessions.',
    ],
    example:
      'You protect 08:00–10:00 weekdays for build work before meetings.',
    link: '/schedule',
  },
  {
    id: 'weekly-planner',
    name: 'Weekly planner',
    icon: '📅',
    section: 'Planning',
    content:
      'See the whole week at once: balance habits, lessons, and heavy focus days.',
    whenToUse: [
      'Weekly reset after Analytics or when a milestone shifts the next arc.',
    ],
    howToUse: [
      'Open Weekly planner; scan load across days; move emphasis before you burn out.',
      'Export the plan mentally into Time schedule or Kanban execution.',
    ],
    example:
      'Week three of Sprint: front-load client work Mon–Wed; Thu–Fri for lesson + focus.',
    link: '/planner',
  },
  {
    id: 'kanban',
    name: 'Kanban',
    icon: '📋',
    section: 'Planning',
    content:
      'Visualise tasks as cards; drag To do → Doing → Done for project subtasks.',
    whenToUse: [
      'When one lesson splits into several parallel tasks (Pro).',
    ],
    howToUse: [
      'Open Kanban; keep columns boring (To do / Doing / Done) so flow stays clear.',
      'Limit work in progress to match Monk Mode intensity.',
    ],
    example:
      '“Outline” in Doing while the lesson narrative covers the “why”.',
    link: '/kanban',
  },
  {
    id: 'focus-deep-work',
    name: 'Focus & deep work',
    icon: '⏱️',
    section: 'Focus & Analysis',
    content:
      'Timer with Pomodoro and ambient audio — start during a scheduled deep-work block.',
    whenToUse: [
      'Whenever you need a hard boundary against distraction.',
    ],
    howToUse: [
      'Open Focus; pick duration; start. Keep phone face-down if that is your rule.',
      'Stack short breaks between blocks; review totals later in Analytics.',
    ],
    example:
      'After the lesson, a fifty-minute block ships the day’s build task.',
    link: '/focus',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: '📈',
    section: 'Focus & Analysis',
    content:
      'Streaks, focus hours, and completion trends — use every Sunday for review.',
    whenToUse: [
      'Weekly retrospective or when motivation needs evidence.',
    ],
    howToUse: [
      'Open Analytics (Pro); scan ranges that match your program length.',
      'Pick one behaviour to fix next week; change one block in Time schedule.',
    ],
    example:
      'You spot Thursday drop-offs and lighten that afternoon before lesson days.',
    link: '/analytics',
  },
  {
    id: 'cloud-sync',
    name: 'Cloud sync',
    icon: '☁️',
    section: 'System',
    content:
      'Keep data consistent across phone and laptop; turn on once, then let it run.',
    whenToUse: [
      'Before relying on two devices, or before travel and reinstalls.',
    ],
    howToUse: [
      'Open Cloud sync; enable; wait for first sync to finish on each device.',
      'If a conflict appears, read the prompt and pick the newest intentional version.',
    ],
    example:
      'Habits on mobile appear the same evening on laptop Dashboard.',
    link: '/sync',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: '⚙️',
    section: 'System',
    content:
      'Theme, notifications, program pause, profile — most changes save immediately.',
    whenToUse: [
      'When switching devices, theme, or notification tolerance.',
    ],
    howToUse: [
      'Open Settings from System; adjust toggles; confirm any dialog.',
      'Return to Today if you paused a program so you know what is active.',
    ],
    example:
      'You dim the theme for evening sessions and silence non-urgent alerts.',
    link: '/settings',
  },
  {
    id: 'log-out',
    name: 'Log out',
    icon: '🚪',
    section: 'System',
    content:
      'End the session on this device — for shared machines or before handing your phone over.',
    whenToUse: [
      'Coworking desks, family iPads, or support calls that need a clean account.',
    ],
    howToUse: [
      'Use Log out in the sidebar footer or account menu; confirm if asked.',
      'Sign in again on your own device with your usual method.',
    ],
    example:
      'You leave a shared desk and log out so only the landing page remains.',
  },
]
