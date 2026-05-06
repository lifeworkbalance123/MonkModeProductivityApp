'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { SelectedProgram } from '@/lib/onboardingProgramFlow'
import { isSelectedProgram } from '@/lib/onboardingProgramFlow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type GuidedProgramRow = {
  program_type: string | null
  payment_status: string | null
  trial_end: string | null
  status: string | null
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const userId = typeof params.userId === 'string' ? params.userId : ''

  const [selectedProgram, setSelectedProgram] = useState<SelectedProgram>('sprint_standard')
  const [extendDays, setExtendDays] = useState(3)
  const [extending, setExtending] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [guidedRows, setGuidedRows] = useState<GuidedProgramRow[]>([])

  const loadMeta = useCallback(async () => {
    if (!userId) return
    setLoadingMeta(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      setEmail(null)
      setGuidedRows([])
      setLoadingMeta(false)
      return
    }
    const headers = { Authorization: `Bearer ${token}` }
    const [logsRes, programsRes] = await Promise.all([
      fetch(`/api/admin/users/${encodeURIComponent(userId)}/logs`, {
        headers,
        cache: 'no-store',
      }),
      fetch(`/api/admin/users/${encodeURIComponent(userId)}/user-programs`, {
        headers,
        cache: 'no-store',
      }),
    ])
    const logsJson = (await logsRes.json()) as { email?: string | null }
    if (logsRes.ok) {
      setEmail(logsJson.email ?? null)
    } else {
      setEmail(null)
    }

    const programsJson = (await programsRes.json()) as {
      rows?: GuidedProgramRow[]
      error?: string
    }
    const rows = programsRes.ok && Array.isArray(programsJson.rows) ? programsJson.rows : []
    setGuidedRows(rows)

    const preferred =
      rows.find((r) => r.status === 'active' && r.program_type && isSelectedProgram(r.program_type))
        ?.program_type ??
      rows.find((r) => r.program_type && isSelectedProgram(r.program_type))?.program_type
    if (preferred && isSelectedProgram(preferred)) {
      setSelectedProgram(preferred)
    }

    setLoadingMeta(false)
  }, [userId])

  useEffect(() => {
    void loadMeta()
  }, [loadMeta])

  const handleExtendTrial = async () => {
    setExtending(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        alert('Sign in as admin to extend trials.')
        return
      }
      const res = await fetch('/api/admin/extend-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          programType: selectedProgram,
          extraDays: extendDays,
        }),
      })
      const payload = (await res.json().catch(() => ({}))) as { error?: string }
      if (res.ok) {
        alert('Trial extended successfully')
        void loadMeta()
      } else {
        alert(payload.error ?? `Error extending trial (${res.status})`)
      }
    } finally {
      setExtending(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">
          ← Users
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">User</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          {loadingMeta ? 'Loading…' : email ?? userId}
        </p>
      </div>

      <div className="max-w-md space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Extend guided program trial</h2>
          <p className="text-sm text-muted-foreground">
            Choose program track and calendar days to add, then submit.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/users/${encodeURIComponent(userId)}/logs`}>Daily logs</Link>
          </Button>
        </div>

        {!loadingMeta && guidedRows.length === 0 ? (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
            No <code className="text-xs">user_programs</code> row for this user. Extend trial only updates
            that table — complete onboarding or create enrollment first. Use the Users table{' '}
            <span className="font-medium">Trial</span> action only after a guided-program row exists.
          </p>
        ) : null}

        {!loadingMeta && guidedRows.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            user_programs:{' '}
            {guidedRows
              .map(
                (r) =>
                  `${r.program_type ?? '—'} (${r.status ?? '—'}${r.payment_status ? ` · ${r.payment_status}` : ''})`,
              )
              .join(' · ')}
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="extend-program">Program</Label>
          <Select
            value={selectedProgram}
            onValueChange={(v) => setSelectedProgram(v as SelectedProgram)}
          >
            <SelectTrigger id="extend-program">
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sprint_standard">Sprint</SelectItem>
              <SelectItem value="sprint_monk">Monk Mode</SelectItem>
              <SelectItem value="transform">Transform</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="extend-days">Extra days</Label>
          <Input
            id="extend-days"
            type="number"
            min={1}
            value={extendDays}
            onChange={(e) =>
              setExtendDays(Math.max(1, Number.parseInt(e.target.value, 10) || 1))
            }
          />
        </div>

        <Button type="button" onClick={() => void handleExtendTrial()} disabled={extending || !userId}>
          {extending ? 'Extending…' : 'Extend Trial'}
        </Button>
      </div>
    </div>
  )
}
