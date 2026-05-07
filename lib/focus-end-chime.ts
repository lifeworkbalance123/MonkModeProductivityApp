import { playChime } from '@/lib/deep-work-audio'
import { playTimerAlarm, type TimerAlarmPreset } from '@/lib/timer-alarm'

const CHIME_SRC = '/sounds/chime.mp3'

let chimeAudio: HTMLAudioElement | null = null

function getChimeAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  if (!chimeAudio) {
    try {
      chimeAudio = new Audio(CHIME_SRC)
      chimeAudio.preload = 'auto'
    } catch {
      return null
    }
  }
  return chimeAudio
}

/**
 * Plays `/sounds/chime.mp3` when sound alerts are enabled; falls back to Web Audio if the file
 * is missing or autoplay is blocked. Add `public/sounds/chime.mp3` for the MP3 path.
 */
export function playFocusEndChime(soundEnabled: boolean, fallbackAlarm: TimerAlarmPreset): void {
  if (!soundEnabled) return
  const el = getChimeAudio()
  if (!el) {
    playTimerAlarm(fallbackAlarm)
    return
  }
  el.currentTime = 0
  void el.play().catch(() => {
    playTimerAlarm(fallbackAlarm)
  })
}

/** Deep work sprint complete uses `playChime` today; keep that as MP3 fallback. */
export function playFocusEndChimeOrDeepChime(soundEnabled: boolean): void {
  if (!soundEnabled) return
  const el = getChimeAudio()
  if (!el) {
    playChime()
    return
  }
  el.currentTime = 0
  void el.play().catch(() => {
    playChime()
  })
}
