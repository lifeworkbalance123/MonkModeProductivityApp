'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type { TrainingVideo } from '@/lib/trainingVideos'

const emptyForm = {
  title: '',
  description: '',
  video_url: '',
  category: 'General',
  sort_order: '0',
}

export default function AdminVideosPage() {
  const { showToast } = useToast()
  const [videos, setVideos] = useState<TrainingVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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
    try {
      const res = await fetch('/api/videos')
      const json = (await res.json()) as { videos?: TrainingVideo[]; error?: string }
      if (!res.ok) {
        showToast(json.error ?? 'Failed to load videos', 'error')
        setVideos([])
        return
      }
      setVideos(json.videos ?? [])
    } catch {
      showToast('Could not reach the server', 'error')
      setVideos([])
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    void load()
  }, [load])

  function startEdit(v: TrainingVideo) {
    setEditingId(v.id)
    setForm({
      title: v.title,
      description: v.description ?? '',
      video_url: v.video_url,
      category: v.category,
      sort_order: String(v.sort_order ?? 0),
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
    const video_url = form.video_url.trim()
    const category = form.category.trim() || 'General'
    const description = form.description.trim()
    const sort_order = Number.parseInt(form.sort_order, 10)

    if (!title) {
      showToast('Title is required', 'error')
      return
    }
    if (!video_url) {
      showToast('Video URL is required', 'error')
      return
    }
    if (!Number.isFinite(sort_order)) {
      showToast('Sort order must be a number', 'error')
      return
    }

    setSaving(true)
    try {
      const isEdit = !!editingId
      const res = await fetch('/api/admin/videos', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? {
                id: editingId,
                title,
                video_url,
                category,
                description: description || null,
                sort_order,
              }
            : {
                title,
                video_url,
                category,
                description: description || null,
                sort_order,
              },
        ),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        showToast(json.error ?? 'Save failed', 'error')
        return
      }
      showToast(isEdit ? 'Video updated' : 'Video created', 'success')
      cancelEdit()
      await load()
    } finally {
      setSaving(false)
    }
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
      const res = await fetch(`/api/admin/videos?id=${encodeURIComponent(deleteId)}`, {
        method: 'DELETE',
        headers,
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        showToast(json.error ?? 'Delete failed', 'error')
        return
      }
      showToast('Video removed', 'success')
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
        <h1 className="text-xl font-semibold text-white">Training videos (catalog)</h1>
        <p className="mt-1 text-sm text-slate-400">
          Entries appear on the public{' '}
          <Link href="/videos" className="text-amber-400 underline hover:text-amber-300">
            /videos
          </Link>{' '}
          page. Use a YouTube watch or youtu.be URL for embed playback.
        </p>
      </div>

      <Card className="border-slate-700 bg-slate-900/40 p-6">
        <h2 className="mb-4 text-sm font-medium text-slate-200">
          {editingId ? 'Edit video' : 'Add video'}
        </h2>
        <form className="space-y-4" onSubmit={(e) => void submit(e)}>
          <div className="space-y-2">
            <Label htmlFor="ob-title" className="text-slate-300">
              Title
            </Label>
            <Input
              id="ob-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="border-slate-600 bg-slate-950 text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ob-url" className="text-slate-300">
              Video URL (YouTube or direct link)
            </Label>
            <Input
              id="ob-url"
              value={form.video_url}
              onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
              className="border-slate-600 bg-slate-950 text-white"
              placeholder="https://www.youtube.com/watch?v=…"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ob-desc" className="text-slate-300">
              Description
            </Label>
            <Textarea
              id="ob-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="resize-y border-slate-600 bg-slate-950 text-white"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ob-cat" className="text-slate-300">
                Category
              </Label>
              <Input
                id="ob-cat"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="border-slate-600 bg-slate-950 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ob-sort" className="text-slate-300">
                Sort order (lower first)
              </Label>
              <Input
                id="ob-sort"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                className="border-slate-600 bg-slate-950 text-white"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-amber-500 font-semibold text-slate-950 hover:bg-amber-400"
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
                  Create video
                </>
              )}
            </Button>
            {editingId ? (
              <Button type="button" variant="outline" className="border-slate-600" onClick={cancelEdit}>
                Cancel edit
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-200">Catalog ({videos.length})</h2>
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading…
          </p>
        ) : videos.length === 0 ? (
          <p className="text-sm text-slate-500">No rows yet. Add one above.</p>
        ) : (
          <ul className="space-y-2">
            {videos.map((v) => (
              <li
                key={v.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-white">{v.title}</p>
                  <p className="truncate text-xs text-slate-500">{v.video_url}</p>
                  <p className="text-xs text-slate-400">
                    {v.category} · order {v.sort_order}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-slate-600"
                    onClick={() => startEdit(v)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="bg-red-900/40 hover:bg-red-900/70"
                    onClick={() => setDeleteId(v.id)}
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
        <AlertDialogContent className="border-slate-700 bg-slate-900 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this video?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This removes it from the public catalog. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 bg-transparent">Cancel</AlertDialogCancel>
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
