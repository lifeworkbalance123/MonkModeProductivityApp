'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!user?.id) {
      router.replace('/dashboard')
      return
    }

    let cancelled = false

    ;(async () => {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return

      const row = data as { is_admin?: boolean } | null
      if (error || !row?.is_admin) {
        router.replace('/dashboard')
        return
      }

      setVerified(true)
    })()

    return () => {
      cancelled = true
    }
  }, [authLoading, user?.id, router])

  if (!verified) {
    return (
      <div className="min-h-screen bg-slate-50" aria-hidden />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      {children}
    </div>
  )
}
