'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MonkData } from '@/lib/monk-types'
import { defaultMonkData } from '@/lib/monk-storage'
import {
  loadFullMonkData,
  persistFullMonkData,
} from '@/lib/dataService'
import { useDataServiceContext } from '@/hooks/use-data-service-context'
import { useToast } from '@/context/ToastContext'
import { supabase } from '@/lib/supabase'

const DEBOUNCE_MS = 450

function looksLikeSessionError(msg: string) {
  return /jwt|session|expired|invalid.*token|401/i.test(msg)
}

export function useMonkData() {
  const ctx = useDataServiceContext()
  const userId = ctx.userId ?? null
  const isPro = ctx.isPro
  const { showToast } = useToast()
  const prevUserIdRef = useRef<string | null | undefined>(undefined)

  const [data, setData] = useState<MonkData>(defaultMonkData)
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const skipSaveOnce = useRef(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dataRef = useRef(data)
  dataRef.current = data
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx

  const reload = useCallback(async () => {
    setLoadError(null)
    setReady(false)
    skipSaveOnce.current = true
    const c = ctxRef.current
    const { data: loaded, error } = await loadFullMonkData(c)
    setData(loaded)
    setLoadError(error)
    setReady(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    skipSaveOnce.current = true
    const userIdChanged = prevUserIdRef.current !== userId
    prevUserIdRef.current = userId

    if (userIdChanged) {
      setReady(false)
      setLoadError(null)
    }

    ;(async () => {
      const { data: loaded, error } = await loadFullMonkData(ctxRef.current)
      if (cancelled) return
      setData(loaded)
      setLoadError(error)
      setReady(true)
    })()

    return () => {
      cancelled = true
    }
  }, [userId, isPro])

  useEffect(() => {
    function onOnline() {
      void (async () => {
        const r = await persistFullMonkData(ctxRef.current, dataRef.current)
        if (r.ok && r.deferred) {
          showToast('Saved locally - will sync when online', 'warning')
          return
        }
        if (!r.ok && r.error) {
          showToast("Couldn't save changes. Please try again.", 'error')
        }
      })()
    }
    window.addEventListener('monk-online', onOnline)
    return () => window.removeEventListener('monk-online', onOnline)
  }, [showToast])

  useEffect(() => {
    if (!ready) return
    if (skipSaveOnce.current) {
      skipSaveOnce.current = false
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void (async () => {
        const result = await persistFullMonkData(
          ctxRef.current,
          dataRef.current,
        )
        if (result.ok) {
          if (result.deferred) {
            showToast('Saved locally - will sync when online', 'warning')
          }
          return
        }
        const err = result.error
        if (looksLikeSessionError(err)) {
          showToast(
            'Your session expired. Signing you in again...',
            'info',
          )
          const { data: ref } = await supabase.auth.refreshSession()
          if (!ref.session) {
            showToast('Your session expired. Please sign in again.', 'error')
            window.location.href =
              '/auth?message=' +
              encodeURIComponent(
                'Your session expired. Please sign in again.',
              )
            return
          }
          const retry = await persistFullMonkData(
            ctxRef.current,
            dataRef.current,
          )
          if (!retry.ok) {
            showToast("Couldn't save changes. Please try again.", 'error')
          }
        } else {
          showToast("Couldn't save changes. Please try again.", 'error')
        }
      })()
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [data, ready, userId, showToast])

  const update = useCallback((fn: (prev: MonkData) => MonkData) => {
    setData(fn)
  }, [])

  const flush = useCallback(async () => {
    return persistFullMonkData(ctxRef.current, dataRef.current)
  }, [])

  return {
    data,
    setData,
    update,
    ready,
    flush,
    dataContext: ctx,
    loadError,
    reload,
  }
}
