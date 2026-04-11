/**
 * Layer 1 — Admin-curated MonkMode training modules.
 * Update `youtubeUrl` here (no deploy needed beyond saving this file in dev;
 * production still ships whatever is in the repo at build time).
 */

export type AdminTrainingModuleType = 'video' | 'read'

export type AdminTrainingModule = {
  id: string
  title: string
  duration: string
  type: AdminTrainingModuleType
  /** YouTube watch or share URL; used for embed when type is `video`. */
  youtubeUrl: string
  description: string
}

export const adminTrainingModules: AdminTrainingModule[] = [
  {
    id: '1',
    title: 'Monk Mode Explained',
    duration: '15 min',
    type: 'video',
    youtubeUrl: 'YOUR_YOUTUBE_URL_HERE',
    description:
      'What monk mode is and how to apply it to your life for sustained focus and calm.',
  },
  {
    id: '2',
    title: 'The Pomodoro Technique',
    duration: '12 min',
    type: 'video',
    youtubeUrl: 'YOUR_YOUTUBE_URL_HERE',
    description:
      'Work in focused bursts with short breaks to stay sharp without burning out.',
  },
  {
    id: '3',
    title: 'Time Boxing Mastery',
    duration: '18 min',
    type: 'video',
    youtubeUrl: 'YOUR_YOUTUBE_URL_HERE',
    description:
      'Assign every hour a job so your day reflects your priorities, not your inbox.',
  },
  {
    id: '4',
    title: 'Building Atomic Habits',
    duration: '8 min',
    type: 'read',
    youtubeUrl: '',
    description:
      'Tiny repeatable actions stack into identity-level change—how to design yours.',
  },
  {
    id: '5',
    title: 'Deep Work Protocol',
    duration: '22 min',
    type: 'video',
    youtubeUrl: 'YOUR_YOUTUBE_URL_HERE',
    description:
      'Rules and rituals to protect uninterrupted blocks where your best work happens.',
  },
  {
    id: '6',
    title: 'Morning Routine Blueprint',
    duration: '15 min',
    type: 'video',
    youtubeUrl: 'YOUR_YOUTUBE_URL_HERE',
    description:
      'A repeatable start that primes energy, intention, and momentum before the world rushes in.',
  },
]
