'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/context/ToastContext'
import type { OnboardingStepKind, OnboardingStepRow } from '@/lib/onboardingSteps'

const KINDS: OnboardingStepKind[] = ['welcome', 'why', 'commitment', 'wake', 'ready', 'content']

const emptyForm = {
  title: '',
  description: '',
  video_url: '',
  action_label: 'Next',
  step_kind: 'content' as OnboardingStepKind,
  step_order: '0',
}

type CreateBody = {
  title: string
  description: string | null
  video_url: string | null
  action_label: string
  step_kind: OnboardingStepKind
}

/** Supabase/PostgREST when `onboarding_steps` was never migrated to this project. */
function looksLikeMissingOnboardingStepsTable(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('onboarding_steps') ||
    (m.includes('could not find') && m.includes('schema cache'))
  )
}

export default function AdminOnboardingPage() {
  const { showToast } = useToast()
  const [steps, setSteps] = useState<OnboardingStepRow[]>([])
  const [loading, setLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const authHeader = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return null
    return { Authorization: `Bearer ${token}` } as Record<string, string>
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setCatalogError(null)
    try {
      const res = await fetch('/api/onboarding/steps')
      const json = (await res.json()) as { steps?: OnboardingStepRow[]; error?: string }
      if (!res.ok) {
        setCatalogError(json.error ?? 'Failed to load steps')
        setSteps([])
        return
      }
      setSteps(json.steps ?? [])
    } catch {
      setCatalogError('Could not reach the server')
      setSteps([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function startEdit(s: OnboardingStepRow) {
    setEditingId(s.id)
    setForm({
      title: s.title,
      description: s.description ?? '',
      video_url: s.video_url ?? '',
      action_label: s.action_label,
      step_kind: s.step_kind,
      step_order: String(s.step_order),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const headers = await authHeader()
    if (!headers) {
      showToast('Sign in required', 'error')
      return
    }

    const title = form.title.trim()
    const action_label = form.action_label.trim() || 'Next'
    const description = form.description.trim() || null
    const video_url = form.video_url.trim() || null
    const step_order = Number.parseInt(form.step_order, 10)
    if (!title) {
      showToast('Title is required', 'error')
      return
    }
    if (editingId && !Number.isFinite(step_order)) {
      showToast('Sort order must be a number', 'error')
      return
    }

    setSaving(true)
    try {
      const isEdit = !!editingId
      const createPayload: CreateBody = {
        title,
        description,
        video_url,
        action_label,
        step_kind: form.step_kind,
      }
      const res = await fetch('/api/admin/onboarding-steps', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? {
                id: editingId,
                title,
                description,
                video_url,
                action_label,
                step_kind: form.step_kind,
                step_order,
              }
            : createPayload,
        ),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        const msg = json.error ?? 'Save failed'
        showToast(msg, 'error')
        if (msg && looksLikeMissingOnboardingStepsTable(msg)) setCatalogError(msg)
        return
      }
      showToast(isEdit ? 'Step updated' : 'Step created', 'success')
      cancelEdit()
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function moveStep(id: string, dir: -1 | 1) {
    const i = steps.findIndex((s) => s.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= steps.length) return
    const next = [...steps]
    const tmp = next[i]
    next[i] = next[j]!
    next[j] = tmp!
    const ordered_ids = next.map((s) => s.id)
    const headers = await authHeader()
    if (!headers) {
      showToast('Sign in required', 'error')
      return
    }
    const res = await fetch('/api/admin/onboarding-steps', {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ordered_ids }),
    })
    const json = (await res.json()) as { error?: string }
    if (!res.ok) {
      const msg = json.error ?? 'Reorder failed'
      showToast(msg, 'error')
      if (msg && looksLikeMissingOnboardingStepsTable(msg)) setCatalogError(msg)
      return
    }
    showToast('Order saved', 'success')
    await load()
  }

  async function confirmDelete() {
    if (!deleteId) return
    const headers = await authHeader()
    if (!headers) {
      showToast('Sign in required', 'error')
      setDeleteId(null)
      return
    }
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/onboarding-steps?id=${encodeURIComponent(deleteId)}`, {
        method: 'DELETE',
        headers,
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        const msg = json.error ?? 'Delete failed'
        showToast(msg, 'error')
        if (msg && looksLikeMissingOnboardingStepsTable(msg)) setCatalogError(msg)
        return
      }
      showToast('Step deleted', 'success')
      if (editingId === deleteId) cancelEdit()
      setDeleteId(null)
      await load()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Onboarding steps</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Controls the{' '}
          <Link href="/onboarding" className="text-accent underline hover:opacity-90">
            /onboarding
          </Link>{' '}
          wizard. Use <code className="text-foreground">step_kind</code> for special layouts; use{' '}
          <code className="text-foreground">content</code> for a simple title + body + button.
        </p>
      </div>

      {catalogError ? (
        <Card
          className={
            looksLikeMissingOnboardingStepsTable(catalogError)
              ? 'border-red-900/60 bg-red-950/30 p-6 text-sm text-red-200'
              : 'border-accent/50 bg-accent/15 p-6 text-sm text-foreground'
          }
        >
          <p className="font-medium text-white">
            {looksLikeMissingOnboardingStepsTable(catalogError)
              ? 'Database: onboarding_steps is missing on this Supabase project'
              : 'Could not load onboarding steps'}
          </p>
          <p className="mt-2 opacity-90">{catalogError}</p>
          {looksLikeMissingOnboardingStepsTable(catalogError) ? (
            <p className="mt-3 text-xs opacity-80">
              Run the migration{' '}
              <code className="rounded bg-black/30 px-1">supabase/migrations/20260419120000_onboarding_steps.sql</code>{' '}
              on production (SQL Editor or <code className="rounded bg-black/30 px-1">supabase db push</code>), then
              retry. Creates and edits will fail until the table exists.
            </p>
          ) : null}
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="border-border text-muted-foreground hover:bg-muted"
              disabled={loading}
              onClick={() => void load()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Retrying…
                </>
              ) : (
                'Retry steps load'
              )}
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="border-accent/40 bg-accent/10 p-4 text-xs text-foreground/90">
        <p className="font-medium text-accent">Description delimiters (why / commitment / wake)</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            <strong>why</strong>: intro text, then <code>---CARD---</code>, then card title (first line) + card body.
          </li>
          <li>
            <strong>commitment</strong>: intro, then <code>---CHECK---</code>, then checkbox label.
          </li>
          <li>
            <strong>wake</strong>: intro, <code>---WAKE---</code>, wake label (first line), <code>---HABITS---</code>,
            then habit lines.
          </li>
        </ul>
      </Card>

      <Card className="border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-medium text-foreground">{editingId ? 'Edit step' : 'Add step'}</h2>
        <form className="space-y-4" onSubmit={(e) => void submit(e)}>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Step kind</Label>
            <Select
              value={form.step_kind}
              onValueChange={(v) => setForm((f) => ({ ...f, step_kind: v as OnboardingStepKind }))}
            >
              <SelectTrigger className="border-border bg-background text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ob-t" className="text-muted-foreground">
              Title
            </Label>
            <Input
              id="ob-t"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="border-border bg-background text-foreground"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ob-d" className="text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="ob-d"
              rows={8}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="resize-y border-border bg-background font-mono text-sm text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ob-v" className="text-muted-foreground">
              Video URL (optional, YouTube)
            </Label>
            <Input
              id="ob-v"
              value={form.video_url}
              onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
              className="border-border bg-background text-foreground"
              placeholder="https://…"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ob-a" className="text-muted-foreground">
                Action label (button)
              </Label>
              <Input
                id="ob-a"
                value={form.action_label}
                onChange={(e) => setForm((f) => ({ ...f, action_label: e.target.value }))}
                className="border-border bg-background text-foreground"
              />
            </div>
            {editingId ? (
              <div className="space-y-2">
                <Label htmlFor="ob-o" className="text-muted-foreground">
                  Step order (numeric)
                </Label>
                <Input
                  id="ob-o"
                  type="number"
                  value={form.step_order}
                  onChange={(e) => setForm((f) => ({ ...f, step_order: e.target.value }))}
                  className="border-border bg-background text-foreground"
                />
              </div>
            ) : (
              <p className="self-end text-xs text-muted-foreground sm:pb-2">
                New steps are added at the end. Use ↑ ↓ in the list to reorder.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : editingId ? (
                'Save changes'
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" aria-hidden />
                  Create step
                </>
              )}
            </Button>
            {editingId ? (
              <Button type="button" variant="outline" className="border-border" onClick={cancelEdit}>
                <X className="mr-2 h-4 w-4" aria-hidden />
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium text-foreground">Steps ({steps.length})</h2>
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading…
          </p>
        ) : steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {catalogError
              ? looksLikeMissingOnboardingStepsTable(catalogError)
                ? 'Fix the database issue above, then retry.'
                : 'See the alert above, then retry.'
              : 'No rows. Run the migration seed or add a step above.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {steps.map((s, idx) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card/80 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    #{s.step_order} · {s.step_kind}
                  </p>
                  <p className="font-medium text-foreground">{s.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{s.description?.slice(0, 120) ?? '—'}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="border-border"
                    disabled={idx === 0}
                    onClick={() => void moveStep(s.id, -1)}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="border-border"
                    disabled={idx === steps.length - 1}
                    onClick={() => void moveStep(s.id, 1)}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-border"
                    onClick={() => startEdit(s)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="bg-red-900/40 hover:bg-red-900/70"
                    onClick={() => setDeleteId(s.id)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden />
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="border-border bg-card text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this step?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Users on /onboarding will no longer see it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border bg-transparent">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-500"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                void confirmDelete()
              }}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
