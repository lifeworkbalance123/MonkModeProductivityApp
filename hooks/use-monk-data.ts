'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MonkData } from '@/lib/monk-types'
import { defaultMonkData, loadMonk, saveMonk } from '@/lib/monk-storage'

export function useMonkData() {
  const [data, setData] = useState<MonkData>(defaultMonkData)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setData(loadMonk())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    saveMonk(data)
  }, [data, ready])

  const update = useCallback((fn: (prev: MonkData) => MonkData) => {
    setData(fn)
  }, [])

  return { data, setData, update, ready }
}
