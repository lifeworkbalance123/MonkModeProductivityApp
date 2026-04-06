'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MonkData } from '@/lib/monk-types'
import { defaultMonkData } from '@/lib/monk-storage'
import {
  loadFullMonkData,
  persistFullMonkData,
} from '@/lib/dataService'
import { useDataServiceContext } from '@/hooks/use-data-service-context'

const DEBOUNCE_MS = 450

export function useMonkData() {
  const ctx = useDataServiceContext()
  const ctxKey = `${ctx.userId ?? 'anon'}:${ctx.isPro ? '1' : '0'}`

  const [data, setData] = useState<MonkData>(defaultMonkData)
  const [ready, setReady] = useState(false)
  const skipSaveOnce = useRef(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dataRef = useRef(data)
  dataRef.current = data
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx

  useEffect(() => {
    let cancelled = false
    skipSaveOnce.current = true
    setReady(false)
    const c = ctxRef.current

    ;(async () => {
      const loaded = await loadFullMonkData(c)
      if (cancelled) return
      setData(loaded)
      setReady(true)
    })()

    return () => {
      cancelled = true
    }
  }, [ctxKey])

  useEffect(() => {
    if (!ready) return
    if (skipSaveOnce.current) {
      skipSaveOnce.current = false
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void persistFullMonkData(ctxRef.current, dataRef.current)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [data, ready, ctxKey])

  const update = useCallback((fn: (prev: MonkData) => MonkData) => {
    setData(fn)
  }, [])

  const flush = useCallback(async () => {
    await persistFullMonkData(ctxRef.current, dataRef.current)
  }, [])

  return { data, setData, update, ready, flush, dataContext: ctx }
}
