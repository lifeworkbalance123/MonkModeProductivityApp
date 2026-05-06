'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import AddVideoModal from '@/components/training/AddVideoModal'
import TrainingCard from '@/components/training/TrainingCard'
import VideoModal from '@/components/training/VideoModal'
import { AppPageChrome } from '@/components/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/context/ToastContext'
import { useUpgradeOffer } from '@/context/UpgradeOfferContext'
import { useDataServiceContext } from '@/hooks/use-data-service-context'
import { usePlan } from '@/hooks/usePlan'
import { supabase } from '@/lib/supabase'
import {
  deletePersonalTrainingResource,
  listPersonalTrainingResources,
  shouldSyncToCloud,
  upsertPersonalTrainingResource,
} from '@/lib/dataService'
import { youtubeEmbedFromUrl } from '@/lib/morning-video'
import {
  loadPersonalTrainingLocal,
  newPersonalResourceClientId,
  savePersonalTrainingLocal,
  type PersonalTrainingCategory,
  type PersonalTrainingResource,
} from '@/lib/personal-training-resources'
import { FREE_PERSONAL_TRAINING_LIBRARY_LIMIT } from '@/lib/plan-limits'
import { cn } from '@/lib/utils'
import {
  isCuratedYoutubeReady,
  type TrainingModule,
} from '@/lib/trainingContent'
import {
  TRAINING_MODE_COLORS,
  trainingAccentFromPersonalCategory,
  trainingOnAccentForeground,
  trainingThumbnailBackdrop,
} from '@/lib/training-palette'
import {
  BookOpen,
  Clock,
  FileText,
  Mic,
  Pencil,
  Play,
  Plus,
  Trash2,
  Video,
  CircleDot,
} from 'lucide-react'

const PERSONAL_CATEGORIES: PersonalTrainingCategory[] = [
  'Video',
  'Article',
  'Podcast',
  'Other',
]

function looksLikeDirectVideoFile(url: string): boolean {
  try {
    const p = new URL(url.trim())
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(p.pathname)
  } catch {
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url.trim())
  }
}

function categoryIcon(cat: PersonalTrainingCategory) {
  switch (cat) {
    case 'Video':
      return Video
    case 'Article':
      return FileText
    case 'Podcast':
      return Mic
    default:
      return CircleDot
  }
}

function TrainingModuleCard(props: {
  title: string
  duration: string
  typeLabel: 'video' | 'read'
  footer: ReactNode
  actions?: ReactNode
  /** When set, bottom-right badge shows category (personal library) instead of a timed duration. */
  personalCategory?: PersonalTrainingCategory
}) {
  const TypeIcon = props.personalCategory
    ? categoryIcon(props.personalCategory)
    : props.typeLabel === 'video'
      ? Video
      : FileText
  const typeBadgeLabel = props.personalCategory
    ? props.personalCategory
    : props.typeLabel === 'video'
      ? 'Video'
      : 'Article'
  const accent = props.personalCategory
    ? trainingAccentFromPersonalCategory(props.personalCategory)
    : props.typeLabel === 'video'
      ? TRAINING_MODE_COLORS.sprint
      : TRAINING_MODE_COLORS.transform
  const onAccentFg = trainingOnAccentForeground(accent)
  return (
    <Card
      className="overflow-hidden group transition-all border border-border relative hover:border-[color:var(--training-accent)]"
      style={{ ['--training-accent' as string]: accent }}
    >
      {props.actions ? (
        <div className="absolute top-2 right-2 z-10 flex gap-1">{props.actions}</div>
      ) : null}
      <div
        className="aspect-video relative overflow-hidden"
        style={{ background: trainingThumbnailBackdrop(accent) }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg"
            style={{ backgroundColor: `color-mix(in srgb, ${accent} 88%, transparent)` }}
          >
            <Play className="w-6 h-6 ml-0.5" style={{ color: onAccentFg }} />
          </div>
        </div>
        {!props.personalCategory ? (
          <div className="absolute bottom-3 right-3">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              <Clock className="w-3 h-3 mr-1" />
              {props.duration}
            </Badge>
          </div>
        ) : null}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            <TypeIcon className="w-3 h-3 mr-1" />
            {typeBadgeLabel}
          </Badge>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <h3
          className={cn(
            'font-semibold transition-colors group-hover:text-[color:var(--training-accent)]',
            props.actions && 'pr-14',
          )}
        >
          {props.title}
        </h3>
        {props.footer}
      </div>
    </Card>
  )
}

function MediaModalBody(props: { url: string; title: string; notes?: string }) {
  const embed = youtubeEmbedFromUrl(props.url)
  if (embed) {
    return (
      <div className="space-y-3">
        <div className="aspect-video w-full overflow-hidden rounded-md border bg-black">
          <iframe
            title={props.title}
            src={embed}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        {props.notes ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{props.notes}</p>
        ) : null}
      </div>
    )
  }
  if (looksLikeDirectVideoFile(props.url)) {
    return (
      <div className="space-y-3">
        <video src={props.url.trim()} controls className="w-full rounded-md border bg-black" />
        {props.notes ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{props.notes}</p>
        ) : null}
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        This link is not a recognised YouTube URL or direct video file. Open it in your browser
        instead.
      </p>
      {props.notes ? (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{props.notes}</p>
      ) : null}
      <Button variant="outline" asChild>
        <a href={props.url.trim()} target="_blank" rel="noopener noreferrer">
          Open resource
        </a>
      </Button>
    </div>
  )
}

export default function TrainingPage() {
  const { showToast } = useToast()
  const { openUpgrade } = useUpgradeOffer()
  const ctx = useDataServiceContext()
  const { isPro, isLoading: planLoading } = usePlan()
  const syncCloud = shouldSyncToCloud(ctx)

  const [personal, setPersonal] = useState<PersonalTrainingResource[]>([])
  const [personalReady, setPersonalReady] = useState(false)
  const [adminModules, setAdminModules] = useState<TrainingModule[]>([])

  const [articleModal, setArticleModal] = useState<TrainingModule | null>(null)
  const [videoModalModule, setVideoModalModule] = useState<TrainingModule | null>(null)
  const [addProVideoOpen, setAddProVideoOpen] = useState(false)

  const [resourceFormOpen, setResourceFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formCategory, setFormCategory] = useState<PersonalTrainingCategory>('Video')
  const [formSaving, setFormSaving] = useState(false)

  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerTitle, setViewerTitle] = useState('')
  const [viewerUrl, setViewerUrl] = useState('')
  const [viewerNotes, setViewerNotes] = useState('')

  const [deletePersonalId, setDeletePersonalId] = useState<string | null>(null)
  const [guidedProgramTrialExpired, setGuidedProgramTrialExpired] = useState(false)

  const reloadPersonal = useCallback(async () => {
    if (shouldSyncToCloud(ctx)) {
      const rows = await listPersonalTrainingResources(ctx)
      setPersonal(rows)
    } else {
      setPersonal(loadPersonalTrainingLocal())
    }
  }, [ctx])

  useEffect(() => {
    if (planLoading) return
    let cancelled = false
    void (async () => {
      await reloadPersonal()
      if (!cancelled) setPersonalReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [planLoading, reloadPersonal])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch('/api/program/access', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      })
      if (!res.ok || cancelled) return
      const j = (await res.json()) as { reason?: string }
      if (cancelled) return
      if (j.reason === 'trial_expired') setGuidedProgramTrialExpired(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    async function loadModules() {
      const { data, error } = await supabase
        .from('training_modules')
        .select('*')
        .eq('published', true)
        .order('display_order', { ascending: true })

      if (error) {
        showToast(error.message, 'error')
        setAdminModules([])
        return
      }

      const mapped = ((data as Array<Record<string, unknown>>) ?? []).map((m) => ({
        id: String(m.id ?? ''),
        title: String(m.title ?? ''),
        description: String(m.description ?? ''),
        youtubeUrl: String(m.youtube_url ?? ''),
        duration: String(m.duration ?? ''),
        type: (m.type === 'article' ? 'article' : 'video') as 'video' | 'article',
        isPro: Boolean(m.is_pro),
        category: String(m.category ?? ''),
      }))
      setAdminModules(mapped)
    }
    void loadModules()
  }, [showToast])

  const atPersonalLimit =
    !planLoading && !syncCloud && personal.length >= FREE_PERSONAL_TRAINING_LIBRARY_LIMIT

  function persistLocal(next: PersonalTrainingResource[]) {
    setPersonal(next)
    savePersonalTrainingLocal(next)
  }

  function openAddResource() {
    if (atPersonalLimit) {
      openUpgrade()
      return
    }
    setEditingId(null)
    setFormTitle('')
    setFormUrl('')
    setFormNotes('')
    setFormCategory('Video')
    setResourceFormOpen(true)
  }

  function openEditResource(r: PersonalTrainingResource) {
    setEditingId(r.id)
    setFormTitle(r.title)
    setFormUrl(r.url)
    setFormNotes(r.notes)
    setFormCategory(r.category)
    setResourceFormOpen(true)
  }

  async function saveResourceForm() {
    const title = formTitle.trim()
    const url = formUrl.trim()
    if (!title) {
      showToast('Please enter a title.', 'error')
      return
    }
    if (!url) {
      showToast('Please enter a URL.', 'error')
      return
    }

    if (!editingId && atPersonalLimit) {
      showToast('Personal library limit reached.', 'error')
      return
    }

    setFormSaving(true)
    try {
      if (syncCloud) {
        const id =
          editingId ?? newPersonalResourceClientId(true)
        const row: PersonalTrainingResource = {
          id,
          title,
          url,
          notes: formNotes.trim(),
          category: formCategory,
        }
        const { error } = await upsertPersonalTrainingResource(ctx, row)
        if (error) {
          showToast("Couldn't save resource. Please try again.", 'error')
          return
        }
        await reloadPersonal()
      } else {
        const id = editingId ?? newPersonalResourceClientId(false)
        const row: PersonalTrainingResource = {
          id,
          title,
          url,
          notes: formNotes.trim(),
          category: formCategory,
        }
        const next = editingId
          ? personal.map((p) => (p.id === editingId ? row : p))
          : [...personal, row]
        persistLocal(next)
      }
      setResourceFormOpen(false)
    } finally {
      setFormSaving(false)
    }
  }

  async function confirmDeletePersonal() {
    if (!deletePersonalId) return
    const id = deletePersonalId
    setDeletePersonalId(null)
    if (syncCloud) {
      await deletePersonalTrainingResource(ctx, id)
      await reloadPersonal()
    } else {
      persistLocal(personal.filter((p) => p.id !== id))
    }
  }

  function openPersonalViewer(r: PersonalTrainingResource) {
    setViewerTitle(r.title)
    setViewerUrl(r.url)
    setViewerNotes(r.notes)
    setViewerOpen(true)
  }

  function playCuratedModule(m: TrainingModule) {
    if (m.type === 'article') {
      setArticleModal(m)
      return
    }
    if (!isCuratedYoutubeReady(m.youtubeUrl)) {
      showToast('This video will be available once the team adds the real YouTube link in lib/trainingContent.ts.', 'error')
      return
    }
    setVideoModalModule(m)
  }

  function openProAddVideo() {
    if (atPersonalLimit) {
      openUpgrade()
      return
    }
    setAddProVideoOpen(true)
  }

  async function saveProLibraryVideo(video: {
    title: string
    description: string
    youtube_url: string
    duration: string
    category: string
    notes: string
  }) {
    if (!video.title?.trim()) {
      throw new Error('Please enter a title')
    }
    if (atPersonalLimit) {
      throw new Error('Personal library limit reached.')
    }

    const notesParts: string[] = []
    if (video.category && video.category !== 'Personal') {
      notesParts.push(`Topic: ${video.category}`)
    }
    if (video.description) notesParts.push(video.description)
    if (video.duration) notesParts.push(`Duration: ${video.duration}`)
    if (video.notes) notesParts.push(video.notes)
    const combinedNotes = notesParts.join('\n\n').trim()

    if (syncCloud) {
      const id = newPersonalResourceClientId(true)
      const row: PersonalTrainingResource = {
        id,
        title: video.title.trim(),
        url: video.youtube_url.trim(),
        notes: combinedNotes,
        category: 'Video',
      }
      const { error } = await upsertPersonalTrainingResource(ctx, row)
      if (error) throw new Error(error)
      await reloadPersonal()
    } else {
      const id = newPersonalResourceClientId(false)
      const row: PersonalTrainingResource = {
        id,
        title: video.title.trim(),
        url: video.youtube_url.trim(),
        notes: combinedNotes,
        category: 'Video',
      }
      persistLocal([...personal, row])
    }
  }

  return (
    <AppPageChrome>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        {guidedProgramTrialExpired ? (
          <div className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-foreground">
            Your guided program trial has ended.{' '}
            <Link href="/join?trial=expired" className="font-medium text-primary underline">
              Purchase to continue the program track
            </Link>
            .
          </div>
        ) : null}
        <section className="space-y-8">
          <div className="text-center space-y-1 max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-semibold">monkcubed training</h1>
            <p className="text-sm text-muted-foreground">Curated by the monkcubed team</p>
            <p className="text-xs text-muted-foreground">
              <Link href="/videos" className="text-accent underline-offset-4 hover:underline">
                Video library
              </Link>{' '}
              — team catalog you can update from the admin panel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminModules.map((m) => (
              <TrainingCard
                key={m.id}
                module={m}
                isPro={isPro}
                onPlay={playCuratedModule}
                onLockedClick={() => openUpgrade()}
              />
            ))}
          </div>
        </section>

        <section className="space-y-8 border-t border-border pt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">My Personal Library</h2>
              <p className="text-sm text-muted-foreground">
                Your own saved videos and resources
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {isPro ? (
                <Button className="gap-2" onClick={() => openProAddVideo()} disabled={!personalReady}>
                  <Plus className="w-4 h-4" />
                  Add YouTube video
                </Button>
              ) : null}
              <Button
                variant={isPro ? 'outline' : 'default'}
                className="gap-2"
                onClick={openAddResource}
                disabled={!personalReady}
              >
                <Plus className="w-4 h-4" />
                {isPro ? 'Add other link' : 'Add resource'}
              </Button>
            </div>
          </div>

          {!syncCloud ? (
            <p className="text-sm text-muted-foreground">
              {atPersonalLimit ? (
                <>
                  Upgrade to Pro for unlimited personal training resources.{' '}
                  <Link href="/pricing" className="text-accent underline-offset-4 hover:underline">
                    View pricing
                  </Link>
                </>
              ) : (
                <>
                  Free plan: up to {FREE_PERSONAL_TRAINING_LIBRARY_LIMIT} saved resources (stored on
                  this device).{' '}
                  <button
                    type="button"
                    className="text-accent underline-offset-4 hover:underline"
                    onClick={() => openUpgrade()}
                  >
                    Upgrade to Pro
                  </button>{' '}
                  for cloud sync and unlimited slots.
                </>
              )}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pro: your library syncs to your account across devices.
            </p>
          )}

          {!personalReady ? (
            <p className="text-sm text-muted-foreground">Loading your library…</p>
          ) : personal.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No personal resources yet. Add a YouTube link, article URL, or direct video file.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personal.map((r) => {
                const personalAccent = trainingAccentFromPersonalCategory(r.category)
                return (
                <TrainingModuleCard
                  key={r.id}
                  title={r.title}
                  duration=""
                  typeLabel={r.category === 'Video' ? 'video' : 'read'}
                  personalCategory={r.category}
                  actions={
                    <>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-background/90 shadow"
                        onClick={() => openEditResource(r)}
                        aria-label="Edit resource"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-background/90 shadow"
                        onClick={() => setDeletePersonalId(r.id)}
                        aria-label="Delete resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  }
                  footer={
                    <Button
                      className="w-full hover:opacity-90"
                      style={{
                        backgroundColor: personalAccent,
                        color: trainingOnAccentForeground(personalAccent),
                      }}
                      onClick={() => openPersonalViewer(r)}
                    >
                      {r.category === 'Video' ? 'Watch now' : 'Open'}
                    </Button>
                  }
                />
                )
              })}
            </div>
          )}
        </section>
      </div>

      <VideoModal
        isOpen={!!videoModalModule}
        onClose={() => setVideoModalModule(null)}
        title={videoModalModule?.title ?? ''}
        description={videoModalModule?.description ?? ''}
        youtubeUrl={videoModalModule?.youtubeUrl ?? ''}
        duration={videoModalModule?.duration ?? ''}
        category={videoModalModule?.category ?? ''}
      />

      <Dialog open={!!articleModal} onOpenChange={(o) => !o && setArticleModal(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{articleModal?.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {articleModal?.category} · {articleModal?.duration}
            </DialogDescription>
          </DialogHeader>
          {articleModal ? (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
                <BookOpen className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{articleModal.description}</p>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setArticleModal(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddVideoModal
        isOpen={addProVideoOpen}
        onClose={() => setAddProVideoOpen(false)}
        onSave={saveProLibraryVideo}
      />

      <Dialog open={resourceFormOpen} onOpenChange={setResourceFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit resource' : 'Add resource'}</DialogTitle>
            <DialogDescription>
              Paste a YouTube or direct video URL. Optional notes help you remember why you saved it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pt-title">Title</Label>
              <Input
                id="pt-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Cal Newport on deep work"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pt-url">YouTube or video URL</Label>
              <Input
                id="pt-url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pt-notes">Notes (optional)</Label>
              <Textarea
                id="pt-notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
                placeholder="Why this matters, timestamps, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formCategory}
                onValueChange={(v) => setFormCategory(v as PersonalTrainingCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERSONAL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResourceFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveResourceForm()} disabled={formSaving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewerTitle}</DialogTitle>
          </DialogHeader>
          <MediaModalBody url={viewerUrl} title={viewerTitle} notes={viewerNotes} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewerOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePersonalId} onOpenChange={(o) => !o && setDeletePersonalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this resource?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from your personal library. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDeletePersonal()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AppPageChrome>
  )
}
