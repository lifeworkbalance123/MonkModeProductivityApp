import { useEffect, useRef } from 'react'

const BRAND_SUFFIX = 'monkcubed'

/**
 * Updates the tab title while a timer is running so the countdown is visible when the tab is in the background.
 * Pass `isRunning` true for paused states too if you want the frozen time to remain in the title.
 * Restores the previous title when the timer stops or the component unmounts.
 */
export function useFaviconTimer(secondsLeft: number, isRunning: boolean) {
  const savedTitleRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return

    if (!isRunning) {
      if (savedTitleRef.current != null) {
        document.title = savedTitleRef.current
        savedTitleRef.current = null
      }
      return
    }

    if (savedTitleRef.current === null) {
      savedTitleRef.current = document.title
    }

    const minutes = Math.floor(secondsLeft / 60)
    const sec = secondsLeft % 60
    document.title = `⏱️ ${minutes}:${String(sec).padStart(2, '0')} – ${BRAND_SUFFIX}`
  }, [secondsLeft, isRunning])

  useEffect(() => {
    return () => {
      if (typeof document === 'undefined') return
      const saved = savedTitleRef.current
      if (saved != null) {
        document.title = saved
      }
    }
  }, [])
}
