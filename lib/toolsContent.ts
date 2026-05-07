export type ToolSection =
  | 'Getting Started'
  | 'Daily Essentials'
  | 'Planning'
  | 'Focus & Analysis'
  | 'System'

export interface Tool {
  id: string
  name: string
  icon: string
  section: ToolSection
  purpose: string
  whenToUse: string[]
  howToUse: string[]
  example: string
  link?: string
}

export const SECTION_ORDER: ToolSection[] = [
  'Getting Started',
  'Daily Essentials',
  'Planning',
  'Focus & Analysis',
  'System',
]

/** Search matches name, purpose, bullets, and example (lowercased). */
export function toolMatchesSearch(tool: Tool, q: string): boolean {
  if (!q.trim()) return true
  const n = q.toLowerCase().trim()
  const hay = [
    tool.name,
    tool.purpose,
    tool.example,
    ...tool.whenToUse,
    ...tool.howToUse,
  ]
    .join(' ')
    .toLowerCase()
  return hay.includes(n)
}

export const toolsData: Tool[] = [
  {
    id: 'program-selection',
    name: 'Program Selection (Sprint, Monk Mode, Transform)',
    icon: '🎯',
    section: 'Getting Started',
    purpose:
      'Choose the guided track that matches your goal: short execution sprint, intense monk-mode focus, or long-form transformation.',
    whenToUse: [
      'When you first join or before you start a paid or trial program',
      'When you want to align day length and intensity with your deadline or lifestyle',
    ],
    howToUse: [
      'Open onboarding or the Join flow from the marketing site or app.',
      'Review Sprint (≈30 days), Monk Mode (≈21 days, higher intensity), and Transform (≈60 days).',
      'Pick the program that fits your horizon; complete intake and payment or trial as prompted.',
      'Your choice sets lesson content, milestones, and the label on your daily Begin button.',
    ],
    example:
      'You have a product launch in three weeks — you pick Monk Mode for a tight deep-work cadence.',
    link: '/join',
  },
  {
    id: 'onboarding-walkthrough',
    name: 'Onboarding Walkthrough',
    icon: '🧭',
    section: 'Getting Started',
    purpose:
      'Walk through commitment, habits, wake time, and program-specific steps so day one matches your real life.',
    whenToUse: [
      'Immediately after creating an account',
      'After switching programs if you go through intake again',
    ],
    howToUse: [
      'Follow each screen; answer prompts honestly (why, environment, wake time, etc.).',
      'Confirm habits or selections your coach path recommends.',
      'Finish auth and payment or trial when prompted.',
      'You land on the app with an active program and a dynamic Begin button.',
    ],
    example:
      'You set a 6:00 wake target and three starter habits so your first week feels achievable.',
    link: '/onboarding',
  },
  {
    id: 'begin-button',
    name: 'Begin (Dynamic Program Button)',
    icon: '🚀',
    section: 'Daily Essentials',
    purpose:
      'Launch your daily program session — the single most important action each day.',
    whenToUse: [
      'Every morning (or whenever you start your deep-work block)',
      'To continue your active program (Sprint, Monk Mode, or Transform)',
    ],
    howToUse: [
      'In the sidebar (desktop) or nav, find the first Daily item — it links to your lesson route.',
      'The label shows your active program name (e.g. "Sprint", "Monk Mode", "Transform") when enrolled.',
      'If no program is active yet, the label reads "Begin" and takes you into selection / onboarding.',
      'Tap or click to open today’s lesson, checklist, and related daily actions.',
    ],
    example:
      'You are on Day 12 of Transform. The button says "Transform". One click opens today’s lesson and flow.',
    link: '/today',
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: '📊',
    section: 'Daily Essentials',
    purpose:
      'See your week at a glance: gratitude, schedule, morning video, and program cards in one place.',
    whenToUse: [
      'When you want the “command center” view instead of the linear lesson',
      'To edit today’s planner slots, journal lines, or motivation video',
    ],
    howToUse: [
      'Open Dashboard from the sidebar under Daily.',
      'Use the date strip or week navigation to pick a day.',
      'Expand sections (e.g. morning motivation, schedule) as needed.',
      'Changes save through the app’s data layer; use Cloud sync if you use multiple devices.',
    ],
    example:
      'Tuesday morning you log gratitude, skim your time blocks, then hit Begin for the lesson.',
    link: '/dashboard',
  },
  {
    id: 'habits',
    name: 'Habits',
    icon: '✅',
    section: 'Daily Essentials',
    purpose: 'Track recurring behaviors with streaks and simple completion.',
    whenToUse: [
      'Daily check-off for non-negotiables (water, movement, reading)',
      'When building identity-based habits alongside your program',
    ],
    howToUse: [
      'Open Habits from the sidebar (Tracking).',
      'Add or edit habits; pick icons and names that mean something to you.',
      'Mark complete each day; watch weekly progress in related views.',
      'Pair with Dashboard or Today so habits and program day stay aligned.',
    ],
    example:
      'You check “Cold shower” and “10 min read” before opening Begin for the Transform lesson.',
    link: '/habits',
  },
  {
    id: 'goals',
    name: 'Goals',
    icon: '🎖️',
    section: 'Daily Essentials',
    purpose: 'Capture outcomes and milestones so daily work ties to bigger targets.',
    whenToUse: [
      'When starting a quarter or program phase',
      'When you need a north star beyond today’s lesson task',
    ],
    howToUse: [
      'Open Goals from the sidebar.',
      'Create or edit goal text; break into check-ins if the app supports sub-steps.',
      'Review regularly after weekly planner or analytics sessions.',
      'Use with Kanban or Time Schedule for execution.',
    ],
    example:
      'Goal: “Ship MVP by Day 30” — your daily Begin lesson reinforces one brick at a time.',
    link: '/goals',
  },
  {
    id: 'time-schedule',
    name: 'Time Schedule',
    icon: '🕐',
    section: 'Planning',
    purpose: 'Block your day with time slots and categories so deep work has a home.',
    whenToUse: [
      'When you batch calendar-style planning',
      'Before a heavy focus week to protect Monk Mode blocks',
    ],
    howToUse: [
      'Open Time Schedule under Planning.',
      'Pick a day; add or drag blocks (duration, label, category).',
      'Sync changes to the cloud if you use Cloud sync.',
      'Cross-check with Focus sessions so planned blocks become executed blocks.',
    ],
    example:
      'You block 8:00–10:00 “Deep work” every weekday so Begin + Focus align.',
    link: '/schedule',
  },
  {
    id: 'weekly-planner',
    name: 'Weekly Planner',
    icon: '📅',
    section: 'Planning',
    purpose: 'Plan the week holistically across days and priorities.',
    whenToUse: [
      'Sunday or Monday reset',
      'After a program milestone to rebalance the next arc',
    ],
    howToUse: [
      'Open Weekly Planner under Planning.',
      'Scan the week; move emphasis between habits, goals, and program days.',
      'Note review days or heavy lesson days from your program.',
      'Export mental model to Time Schedule or Kanban as needed.',
    ],
    example:
      'Week 3 of Sprint: you front-load client work Mon–Wed so Thu–Fri are lesson + focus.',
    link: '/planner',
  },
  {
    id: 'kanban',
    name: 'Kanban',
    icon: '📋',
    section: 'Planning',
    purpose: 'Visualize workflow stages and drag tasks from backlog to done.',
    whenToUse: [
      'When you manage many parallel tasks (Pro)',
      'When lesson “one big task” splits into sub-tasks',
    ],
    howToUse: [
      'Open Kanban (Pro) from Planning.',
      'Create columns that match your process (e.g. To do / Doing / Done).',
      'Drag cards; keep WIP limits mentally if you use Monk Mode.',
      'Link mentally to Goals and your program day theme.',
    ],
    example:
      '“Write outline” moves to Doing while Begin handles the lesson narrative for the day.',
    link: '/kanban',
  },
  {
    id: 'focus-deep-work',
    name: 'Focus & Deep Work',
    icon: '⏱️',
    section: 'Focus & Analysis',
    purpose:
      'Run Pomodoro or deep-work timers with audio, stats, and session discipline.',
    whenToUse: [
      'During scheduled deep-work blocks',
      'When the lesson asks for timed focus or you need anti-distraction structure',
    ],
    howToUse: [
      'Open Focus & Deep Work from Focus in the sidebar.',
      'Choose preset or custom duration; start the timer.',
      'Use audio or site settings configured in admin if applicable.',
      'Review session stats over time alongside Analytics.',
    ],
    example:
      'After Begin opens the lesson, you start a 50-minute deep block to finish the day’s build task.',
    link: '/focus',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: '📈',
    section: 'Focus & Analysis',
    purpose: 'See streaks, completion trends, and insight charts (Pro).',
    whenToUse: [
      'Weekly retrospective',
      'When motivation dips and you need evidence of progress',
    ],
    howToUse: [
      'Open Analytics (Pro) from Insights.',
      'Scan streaks, rates, and time ranges.',
      'Tie insights back to Habits and program day consistency.',
      'Adjust next week’s plan in Weekly Planner or Time Schedule.',
    ],
    example:
      'You notice Thursday drop-offs and add a lighter block before Transform lesson days.',
    link: '/analytics',
  },
  {
    id: 'video-library',
    name: 'Video Library',
    icon: '🎬',
    section: 'Focus & Analysis',
    purpose: 'Browse curated training and motivation videos outside the daily lesson.',
    whenToUse: [
      'When you want extra context or inspiration',
      'During onboarding or between program phases',
    ],
    howToUse: [
      'Open Video library under Learning.',
      'Pick a video; watch in-app or follow links as provided.',
      'Optional: note takeaways in Dashboard journal or Goals.',
    ],
    example:
      'You watch a focus technique clip on Friday to prep a heavy Monk Mode weekend.',
    link: '/videos',
  },
  {
    id: 'cloud-sync',
    name: 'Cloud Sync',
    icon: '☁️',
    section: 'System',
    purpose: 'Back up and sync MonkCubed data across devices (Pro / bonus entitlement).',
    whenToUse: [
      'When you use phone + desktop',
      'Before travel or reinstalling the app',
    ],
    howToUse: [
      'Open Cloud sync under System (unlock if required).',
      'Follow prompts to enable sync and resolve conflicts if shown.',
      'After changes on one device, open the other and allow sync to complete.',
    ],
    example:
      'You log habits on mobile; Dashboard on laptop shows the same week after sync.',
    link: '/sync',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: '⚙️',
    section: 'System',
    purpose: 'Account, appearance, program controls, and app preferences.',
    whenToUse: [
      'When changing theme, notifications, or profile',
      'To pause/resume program or adjust test tools (if available)',
    ],
    howToUse: [
      'Open Settings from the sidebar (System).',
      'Update profile, theme, or program-related toggles.',
      'Save; some changes may require a refresh.',
    ],
    example:
      'You switch color theme to reduce eye strain for evening deep work.',
    link: '/settings',
  },
  {
    id: 'log-out',
    name: 'Log out',
    icon: '🚪',
    section: 'System',
    purpose: 'End your session on this device securely.',
    whenToUse: [
      'On a shared computer',
      'When troubleshooting auth or switching accounts',
    ],
    howToUse: [
      'Open the avatar or account menu in the top bar, or use Log out in the sidebar footer.',
      'Click Log out.',
      'Confirm if a dialog appears; you return to the sign-in flow.',
    ],
    example:
      'You finish at a coworking space and log out so the next person sees only the landing page.',
  },
]
