'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { useToast } from '@/context/ToastContext'
import { enrollUser } from '@/lib/programUtils'
import { supabase } from '@/lib/supabase'

export default function ProgramOnboardingPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [busy, setBusy] = useState(false)

  async function startProgram() {
    setBusy(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/auth')
        return
      }
      const enrollment = await enrollUser(user.id)
      if (!enrollment) {
        showToast('Could not start the program. Check your connection and try again.', 'error')
        return
      }
      router.replace('/today')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-lg px-6 pb-16 pt-24 text-center">
        <h1 className="mb-3 text-2xl font-semibold tracking-tight">60-day MonkMode program</h1>
        <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
          One short lesson and one simple action each day. You can start today—your clock begins on
          enrollment.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void startProgram()}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Starting…
            </>
          ) : (
            'Begin Day 1 →'
          )}
        </button>
        <p className="mt-8 text-xs text-muted-foreground">
          <Link href="/dashboard" className="text-accent underline-offset-4 hover:underline">
            Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  )
}
