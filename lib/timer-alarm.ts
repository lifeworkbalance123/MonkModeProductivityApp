/** Persisted together for Pomodoro + Deep Work */
export const TIMER_ALARM_LS_SOUND = 'timer-alarm-sound' as const
export const TIMER_ALARM_LS_NOTIFY = 'timer-alarm-notify' as const

export function getTimerAlarmSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(TIMER_ALARM_LS_SOUND) !== '0'
  } catch {
    return true
  }
}

export function setTimerAlarmSoundEnabled(on: boolean): void {
  try {
    window.localStorage.setItem(TIMER_ALARM_LS_SOUND, on ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function getTimerAlarmNotifyEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(TIMER_ALARM_LS_NOTIFY) === '1'
  } catch {
    return false
  }
}

export function setTimerAlarmNotifyEnabled(on: boolean): void {
  try {
    window.localStorage.setItem(TIMER_ALARM_LS_NOTIFY, on ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export type TimerAlarmPreset = 'pomodoro-work' | 'pomodoro-break' | 'deep-work-break'

function scheduleBeep(
  ctx: AudioContext,
  startSec: number,
  freqHz: number,
  durationSec: number,
  peakGain = 0.24,
) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.connect(g)
  g.connect(ctx.destination)
  const t0 = ctx.currentTime + startSec
  osc.frequency.setValueAtTime(freqHz, t0)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(peakGain, t0 + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durationSec)
  osc.start(t0)
  osc.stop(t0 + durationSec + 0.03)
}

/**
 * Short Web Audio alarm (no external files). Safe to call from timer completion handlers.
 */
export function playTimerAlarm(preset: TimerAlarmPreset) {
  let ctx: AudioContext
  try {
    ctx = new AudioContext()
  } catch {
    return
  }
  void ctx.resume().catch(() => {
    /* autoplay / suspended context — beeps may be silent */
  })
  const base = 0.06
  if (preset === 'pomodoro-work') {
    scheduleBeep(ctx, base, 880, 0.14)
    scheduleBeep(ctx, base + 0.3, 880, 0.14)
    scheduleBeep(ctx, base + 0.58, 988, 0.22, 0.28)
  } else if (preset === 'pomodoro-break') {
    scheduleBeep(ctx, base, 659, 0.12)
    scheduleBeep(ctx, base + 0.26, 784, 0.18, 0.26)
  } else {
    scheduleBeep(ctx, base, 523, 0.12)
    scheduleBeep(ctx, base + 0.26, 587, 0.12)
    scheduleBeep(ctx, base + 0.52, 659, 0.2, 0.27)
  }
  const ms = preset === 'pomodoro-work' ? 1400 : 1100
  window.setTimeout(() => {
    void ctx.close().catch(() => {})
  }, ms)
}

/** Very quiet tick for last seconds of focus (respect user mute by caller). */
export function playSoftTimerTick(secondsRemaining: number) {
  let ctx: AudioContext
  try {
    ctx = new AudioContext()
  } catch {
    return
  }
  void ctx.resume().catch(() => {})
  const freq = 520 + Math.min(10 - secondsRemaining, 9) * 18
  scheduleBeep(ctx, 0.04, freq, 0.05, 0.07)
  window.setTimeout(() => {
    void ctx.close().catch(() => {})
  }, 200)
}

/** Subtle affirming blip when starting or resuming focus. */
export function playFocusTransitionCue(kind: 'start' | 'pause') {
  let ctx: AudioContext
  try {
    ctx = new AudioContext()
  } catch {
    return
  }
  void ctx.resume().catch(() => {})
  if (kind === 'start') {
    scheduleBeep(ctx, 0.05, 660, 0.06, 0.08)
    scheduleBeep(ctx, 0.14, 880, 0.07, 0.09)
  } else {
    scheduleBeep(ctx, 0.05, 440, 0.08, 0.07)
  }
  window.setTimeout(() => {
    void ctx.close().catch(() => {})
  }, 400)
}

export function showTimerNotification(title: string, body: string, tag = 'monkcubed-timer') {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, tag })
  } catch {
    /* ignore */
  }
}

export async function requestTimerNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function pulseTimerVibration() {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate([160, 70, 160, 70, 200])
  } catch {
    /* ignore */
  }
}
