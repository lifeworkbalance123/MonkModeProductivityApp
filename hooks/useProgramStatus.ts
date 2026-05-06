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
  accountabilityPreference?: 'solo' | 'buddy' | 'coach' | null
}

export type ProgramAccessSummary = {
  canAccess: boolean
  programId: string | null
  paymentStatus: string | null
  trialEnd: string | null
  reason: string | null
}

export interface UseProgramStatusResult {
  activeProgram: ProgramStatusActiveProgram | null
  programs: ProgramStatusProgram[]
  buttonText: string
  hasActiveProgram: boolean
  /** Guided program trial/paid gate from `/api/programs/status` (aligned with `lib/programAccess`). */
  programAccess: ProgramAccessSummary | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useProgramStatus(enabled = true): UseProgramStatusResult {
  const [activeProgram, setActiveProgram] = useState<ProgramStatusActiveProgram | null>(null)
  const [programs, setPrograms] = useState<ProgramStatusProgram[]>([])
  const [buttonText, setButtonText] = useState('Begin')
  const [hasActiveProgram, setHasActiveProgram] = useState(false)
  const [programAccess, setProgramAccess] = useState<ProgramAccessSummary | null>(null)
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
      setProgramAccess(null)
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
      const json = (await res.json()) as Partial<UseProgramStatusResult> & {
        programAccess?: ProgramAccessSummary | null
      }

      setActiveProgram((json.activeProgram as ProgramStatusActiveProgram | null) ?? null)
      setPrograms(Array.isArray(json.programs) ? (json.programs as ProgramStatusProgram[]) : [])
      setButtonText(
        typeof json.buttonText === 'string' && json.buttonText.trim()
          ? json.buttonText
          : 'Begin',
      )
      setHasActiveProgram(json.hasActiveProgram === true)
      const pa = json.programAccess as ProgramAccessSummary | undefined
      setProgramAccess(
        pa && typeof pa.canAccess === 'boolean'
          ? {
              canAccess: pa.canAccess,
              programId: pa.programId ?? null,
              paymentStatus: pa.paymentStatus ?? null,
              trialEnd: pa.trialEnd ?? null,
              reason: pa.reason ?? null,
            }
          : null,
      )
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Could not load program status'))
      setButtonText('Begin')
      setHasActiveProgram(false)
      setProgramAccess(null)
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
      programAccess,
      loading,
      error,
      refetch,
    }),
    [activeProgram, programs, buttonText, hasActiveProgram, programAccess, loading, error, refetch],
  )
}

