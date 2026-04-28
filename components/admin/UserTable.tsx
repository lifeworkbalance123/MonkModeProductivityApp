'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

export type AdminUserRow = {
  id: string
  email: string | null
  name: string | null
  program_type: string | null
  program_day: number | null
  phase: string | null
  status: string | null
  paused_at: string | null
  started_at: string | null
  last_log_date: string | null
  missed_days_count: number
  at_risk: boolean
  logs_last_7_days: number
  plan: string | null
}

const EMAIL_TYPES = [
  'welcome_day1',
  'welcome_day3',
  'welcome_day7',
  'at_risk_2days',
  'at_risk_4days',
  'milestone_21',
  'milestone_30',
  'milestone_40',
  'milestone_60',
  're_engagement_7days',
  're_engagement_14days',
] as const

function isMissingResendEnv(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('resend_api_key') || m.includes('email_from')
}

export default function UserTable() {
  const [rows, setRows] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 25
  const [search, setSearch] = useState('')
  const [searchApplied, setSearchApplied] = useState('')
  const [programType, setProgramType] = useState('all')
  const [status, setStatus] = useState('all')
  const [atRisk, setAtRisk] = useState(false)
  const [message, setMessage] = useState('')

  const [adjustOpen, setAdjustOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [refundOpen, setRefundOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [activeUser, setActiveUser] = useState<AdminUserRow | null>(null)
  const [adjustDay, setAdjustDay] = useState(1)
  const [adjustReason, setAdjustReason] = useState('')
  const [resetProgramType, setResetProgramType] = useState('60day')
  const [resetChangeProgram, setResetChangeProgram] = useState(false)
  const [resetTestMode, setResetTestMode] = useState(false)
  const [resetTestDay, setResetTestDay] = useState(1)
  const [emailType, setEmailType] = useState<string>(EMAIL_TYPES[0])
  const [working, setWorking] = useState(false)
  const [refundCents, setRefundCents] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [emailDisabledReason, setEmailDisabledReason] = useState<string | null>(null)
  /** False until `/api/admin/email-status` finishes when the email dialog is open. */
  const [emailEnvChecked, setEmailEnvChecked] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      setLoading(false)
      return
    }
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    })
    if (searchApplied.trim()) params.set('search', searchApplied.trim())
    if (programType !== 'all') params.set('programType', programType)
    if (status !== 'all') params.set('status', status)
    if (atRisk) params.set('atRisk', '1')

    const res = await fetch(`/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const json = (await res.json()) as {
      users?: AdminUserRow[]
      total?: number
      error?: string
    }
    if (!res.ok) {
      setMessage(json.error ?? 'Failed to load')
      setRows([])
    } else {
      setMessage('')
      setRows(json.users ?? [])
      setTotal(json.total ?? 0)
    }
    setLoading(false)
  }, [page, searchApplied, programType, status, atRisk])

  useEffect(() => {
    void load()
  }, [load])

  async function postAction(
    path: string,
    body: Record<string, unknown>,
    onOk: () => void,
  ) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token || !activeUser) return
    setWorking(true)
    setMessage('')
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    const json = (await res.json().catch(() => ({}))) as { error?: string }
    setWorking(false)
    if (!res.ok) {
      const msg = json.error ?? `Error ${res.status}`
      setMessage(msg)
      if (path.includes('/send-email') && isMissingResendEnv(msg)) {
        setEmailDisabledReason(
          'Email disabled: add RESEND_API_KEY and EMAIL_FROM to .env.local (see .env.example), then restart the dev server.',
        )
      }
      return
    }
    onOk()
    void load()
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    if (!emailOpen) {
      setEmailEnvChecked(false)
      return
    }
    let cancelled = false
    setEmailEnvChecked(false)
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        if (!cancelled) {
          setEmailEnvChecked(true)
          setEmailDisabledReason('Not signed in')
        }
        return
      }
      const res = await fetch('/api/admin/email-status', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      const json = (await res.json().catch(() => ({}))) as {
        configured?: boolean
        missing?: string[]
      }
      if (cancelled) return
      setEmailEnvChecked(true)
      if (!res.ok) {
        setEmailDisabledReason(
          `Could not verify email configuration (HTTP ${res.status}).`,
        )
        return
      }
      if (!json.configured) {
        const miss =
          json.missing && json.missing.length > 0
            ? json.missing.join(', ')
            : 'RESEND_API_KEY and EMAIL_FROM'
        setEmailDisabledReason(
          `Email disabled: add ${miss} to .env.local (see .env.example), then restart the dev server.`,
        )
      } else {
        setEmailDisabledReason(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [emailOpen])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Search</Label>
          <Input
            className="mt-1 h-9 w-[220px]"
            placeholder="Email or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1)
                setSearchApplied(search.trim())
              }
            }}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Program</Label>
          <Select value={programType} onValueChange={(v) => { setProgramType(v); setPage(1) }}>
            <SelectTrigger className="mt-1 h-9 w-[160px]">
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="60day">60-day</SelectItem>
              <SelectItem value="sprint_standard">Sprint (30)</SelectItem>
              <SelectItem value="sprint_monk">Monk Mode (21)</SelectItem>
              <SelectItem value="transform">Transform</SelectItem>
              <SelectItem value="mastery">Mastery</SelectItem>
              <SelectItem value="legacy">Legacy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger className="mt-1 h-9 w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={atRisk}
            onChange={(e) => {
              setAtRisk(e.target.checked)
              setPage(1)
            }}
          />
          At-risk only
        </label>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-9"
          onClick={() => {
            setPage(1)
            setSearchApplied(search.trim())
          }}
        >
          Apply
        </Button>
      </div>

      {message ? <p className="text-sm text-red-400">{message}</p> : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-border">
                  {[
                    'User',
                    'Program / Day',
                    'Phase',
                    'Status',
                    'Last active',
                    'Missed (7d roll)',
                    'Logs 7d',
                    'Actions',
                  ].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-b border-border">
                    <td className="px-3 py-2 text-muted-foreground">
                      <div className="font-medium text-foreground">{u.email ?? '—'}</div>
                      <div className="text-[11px]">{u.name ?? ''}</div>
                      {u.at_risk ? (
                        <span className="mt-1 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-400">
                          At risk
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      {u.program_type ?? '—'} · Day {u.program_day ?? '—'}
                    </td>
                    <td className="px-3 py-2 capitalize">{u.phase ?? '—'}</td>
                    <td className="px-3 py-2 capitalize">{u.status ?? '—'}</td>
                    <td className="px-3 py-2 text-[11px]">
                      {u.last_log_date
                        ? new Date(u.last_log_date).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-3 py-2">{u.missed_days_count}</td>
                    <td className="px-3 py-2">{u.logs_last_7_days}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" asChild>
                          <Link href={`/admin/users/${u.id}/logs`}>Logs</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2"
                          onClick={() => {
                            setActiveUser(u)
                            setAdjustDay(u.program_day ?? 1)
                            setAdjustOpen(true)
                          }}
                        >
                          Day
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2"
                          onClick={() => {
                            setActiveUser(u)
                            setResetProgramType(u.program_type ?? '60day')
                            setResetChangeProgram(false)
                            setResetTestMode(false)
                            setResetTestDay(1)
                            setResetOpen(true)
                          }}
                        >
                          Reset
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2"
          onClick={() => {
            setActiveUser(u)
            setRefundCents('')
            setRefundReason('')
            setRefundOpen(true)
          }}
                        >
                          Refund
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2"
                          onClick={() => {
                            setActiveUser(u)
                            setEmailDisabledReason(null)
                            setEmailOpen(true)
                          }}
                        >
                          Email
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {page} of {totalPages} ({total} users)
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust program day</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>New day</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={adjustDay}
                onChange={(e) => setAdjustDay(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
            </div>
            <Button
              disabled={working || !activeUser}
              onClick={() =>
                void postAction(
                  `/api/admin/users/${activeUser!.id}/adjust-day`,
                  { day: adjustDay, reason: adjustReason || undefined },
                  () => setAdjustOpen(false),
                )
              }
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset to Day 1</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Sets <strong>start date to today</strong>, <strong>day 1</strong>, clears completed days, and
            reactivates the program. Use this so a user can continue on a new track or retest from the
            beginning.
          </p>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={resetChangeProgram}
                onChange={(e) => setResetChangeProgram(e.target.checked)}
              />
              Change program track
            </label>
            {resetChangeProgram ? (
              <div>
                <Label>New program</Label>
                <Select value={resetProgramType} onValueChange={setResetProgramType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60day">60-day</SelectItem>
                    <SelectItem value="sprint_standard">Sprint (30)</SelectItem>
                    <SelectItem value="sprint_monk">Monk Mode (21)</SelectItem>
                    <SelectItem value="transform">Transform (56)</SelectItem>
                    <SelectItem value="mastery">Mastery (90)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={resetTestMode}
                onChange={(e) => setResetTestMode(e.target.checked)}
              />
              Enable test mode for this user (jump to a day without waiting)
            </label>
            {resetTestMode ? (
              <div>
                <Label>Test day (1–365)</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  className="mt-1"
                  value={resetTestDay}
                  onChange={(e) =>
                    setResetTestDay(Math.min(365, Math.max(1, Number(e.target.value) || 1)))
                  }
                />
              </div>
            ) : null}

            <Button
              variant="destructive"
              disabled={working || !activeUser}
              onClick={() => {
                if (
                  !window.confirm(
                    `Reset ${activeUser?.email ?? 'this user'} to Day 1 with today as start date?`,
                  )
                ) {
                  return
                }
                const body: Record<string, unknown> = {}
                if (resetChangeProgram) body.program_type = resetProgramType
                if (resetTestMode) {
                  body.test_mode = { enabled: true, day: resetTestDay }
                } else {
                  body.test_mode = { enabled: false }
                }
                void postAction(
                  `/api/admin/users/${activeUser!.id}/reset-program`,
                  body,
                  () => setResetOpen(false),
                )
              }}
            >
              Reset program
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Stripe refund</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Refunds the most recent successful charge for this user&apos;s Stripe customer. Partial amount
            optional (cents).
          </p>
          <div className="space-y-3">
            <div>
              <Label>Amount (cents, empty = full)</Label>
              <Input
                type="number"
                placeholder="e.g. 999"
                value={refundCents}
                onChange={(e) => setRefundCents(e.target.value)}
              />
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
            </div>
            <Button
              disabled={working || !activeUser}
              variant="destructive"
              onClick={() => {
                void postAction(
                  `/api/admin/users/${activeUser!.id}/refund`,
                  {
                    amountCents: refundCents ? Number(refundCents) : undefined,
                    reason: refundReason || undefined,
                  },
                  () => setRefundOpen(false),
                )
              }}
            >
              Refund
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send test lifecycle email</DialogTitle>
          </DialogHeader>
          {emailOpen && !emailEnvChecked ? (
            <p className="text-xs text-muted-foreground">Checking email configuration…</p>
          ) : null}
          {emailDisabledReason ? (
            <p className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {emailDisabledReason}
            </p>
          ) : null}
          <Select value={emailType} onValueChange={setEmailType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[280px]">
              {EMAIL_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={
              working || !activeUser || !emailEnvChecked || !!emailDisabledReason
            }
            onClick={() =>
              void postAction(
                `/api/admin/users/${activeUser!.id}/send-email`,
                { email_type: emailType },
                () => setEmailOpen(false),
              )
            }
          >
            {!emailEnvChecked
              ? 'Checking…'
              : emailDisabledReason
                ? 'Email disabled'
                : 'Send'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
