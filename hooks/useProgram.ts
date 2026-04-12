'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getEnrollment, type ProgramEnrollment } from '@/lib/programUtils'

export function useProgram() {
  const [enrollment, setEnrollment] = useState<ProgramEnrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setEnrollment(null)
        setEnrolled(false)
        return
      }

      const data = await getEnrollment(user.id)
      setEnrollment(data)
      setEnrolled(!!data)
    } catch (err) {
      console.error('useProgram error:', err)
      setEnrollment(null)
      setEnrolled(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { enrollment, loading, enrolled, refresh: load }
}
