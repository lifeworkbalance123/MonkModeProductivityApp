import confetti from 'canvas-confetti'

/** 90-minute focus preset (work phase length in seconds). */
export const POMODORO_LONG_WORK_SEC = 90 * 60

export function firePomodoroSessionConfetti(): void {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  void confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
}
