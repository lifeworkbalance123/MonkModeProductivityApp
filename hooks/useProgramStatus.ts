'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ProgramType } from '@/lib/programStatus'

export interface ProgramStatusProgram {
  program_type: ProgramType
  label: string
  duration: string
  price: string
  intensity: string
  benefit: string
  icon: string
  color: string
  totalDays: number
  isActive: boolean
  isLocked: boolean
  lockMessage: string | null
  activeProgress: { currentDay: number; totalDays: number } | null
}

export interface ProgramStatusActiveProgram {
  program_type: ProgramType
  label: string
  currentDay: number
  totalDays: number
}

export interface UseProgramStatusResult {
  activeProgram: ProgramStatusActiveProgram | null
  programs: ProgramStatusProgram[]
  buttonText: string
  hasActiveProgram: boolean
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useProgramStatus(enabled = true): UseProgramStatusResult {
  const [activeProgram, setActiveProgram] = useState<ProgramStatusActiveProgram | null>(null)
  const [programs, setPrograms] = useState<ProgramStatusProgram[]>([])
  const [buttonText, setButtonText] = useState('Begin')
  const [hasActiveProgram, setHasActiveProgram] = useState(false)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      setError(null)
      setActiveProgram(null)
      setPrograms([])
      setButtonText('Begin')
      setHasActiveProgram(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token

      const res = await fetch('/api/programs/status', {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const json = (await res.json()) as Partial<UseProgramStatusResult>

      setActiveProgram((json.activeProgram as ProgramStatusActiveProgram | null) ?? null)
      setPrograms(Array.isArray(json.programs) ? (json.programs as ProgramStatusProgram[]) : [])
      setButtonText(
        typeof json.buttonText === 'string' && json.buttonText.trim()
          ? json.buttonText
          : 'Begin',
      )
      setHasActiveProgram(json.hasActiveProgram === true)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Could not load program status'))
      setButtonText('Begin')
      setHasActiveProgram(false)
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return useMemo(
    () => ({
      activeProgram,
      programs,
      buttonText,
      hasActiveProgram,
      loading,
      error,
      refetch,
    }),
    [activeProgram, programs, buttonText, hasActiveProgram, loading, error, refetch],
  )
}

