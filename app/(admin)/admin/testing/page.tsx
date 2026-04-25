'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

type ProgramType = 'sprint_standard' | 'sprint_monk' | 'transform'

async function authHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) return null
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function AdminTestingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<ProgramType>('sprint_standard')
  const [jumpDay, setJumpDay] = useState(1)

  const handleStartProgram = (programType: ProgramType) => {
    setError(null)
    setSuccess(null)
    console.log('Button clicked for:', programType)
    console.log('Router exists:', !!router)
    sessionStorage.setItem('admin_test_session', 'true')
    sessionStorage.setItem('admin_test_program', programType)
    localStorage.setItem('skipPayment', 'true')

    toast.success(`Starting ${programType} onboarding...`)
    const href = `/onboarding?${new URLSearchParams({
      program: programType,
      skipPayment: 'true',
    }).toString()}`
    router.push(href)
    console.log('Redirect attempted')
  }

  const handleJumpToDay = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const headers = await authHeaders()
      if (!headers) {
        throw new Error('Not logged in')
      }

      const res = await fetch('/api/admin/testing/jump-to-day', {
        method: 'POST',
        headers,
        body: JSON.stringify({ programDay: jumpDay }),
      })

      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to jump to day')
      }

      setSuccess(`Jumped to day ${jumpDay} successfully!`)
      // Take the tester directly to that day. `/today` reads `?day=` as viewingDay,
      // so even if program status caching lags, the page will show the requested day.
      router.push(`/today?day=${jumpDay}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to jump to day')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Admin Testing Tools</h1>

      {error ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {success}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">Start Program (No Payment)</h2>
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value as ProgramType)}
            className="mb-4 w-full rounded border p-2"
          >
            <option value="sprint_standard">Sprint (30 days)</option>
            <option value="sprint_monk">Monk Mode (21 days)</option>
            <option value="transform">Transform (60 days)</option>
          </select>
          <button
            type="button"
            onClick={() => handleStartProgram(selectedProgram)}
            disabled={loading}
            className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Start Program (No Payment)'}
          </button>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">Jump to Day</h2>
          <input
            type="number"
            min={1}
            max={60}
            value={jumpDay}
            onChange={(e) => setJumpDay(Number.parseInt(e.target.value, 10) || 1)}
            className="mb-4 w-full rounded border p-2"
          />
          <button
            type="button"
            onClick={() => void handleJumpToDay()}
            disabled={loading}
            className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Jumping...' : 'Jump to Day'}
          </button>
        </div>
      </div>
    </div>
  )
}
