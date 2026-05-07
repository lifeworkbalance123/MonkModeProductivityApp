import { useEffect, useRef } from 'react'

export type LoopingFocusTrack = {
  url: string
  label?: string
} | null

/**
 * Loops `selectedTrack` in an HTMLAudioElement while `isRunning` is true; pauses and drops the
 * element when the track is cleared or the timer stops.
 */
export function useLoopingFocusTrack(selectedTrack: LoopingFocusTrack, isRunning: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const url = selectedTrack?.url?.trim()
    if (
      url &&
      isRunning &&
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
      const el = new Audio(url)
      el.loop = true
      el.volume = 0.35
      audioRef.current = el
      void el.play().catch(() => {
        /* autoplay / decode */
      })
      return () => {
        el.pause()
        el.src = ''
        if (audioRef.current === el) {
          audioRef.current = null
        }
      }
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    return undefined
  }, [selectedTrack?.url, isRunning])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [])
}
