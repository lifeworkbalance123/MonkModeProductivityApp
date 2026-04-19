'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Play, Video } from 'lucide-react'
import VideoModal from '@/components/training/VideoModal'
import { AppPageChrome } from '@/components/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getYouTubeThumbnail } from '@/lib/trainingContent'
import type { TrainingVideo } from '@/lib/trainingVideos'
import { cn } from '@/lib/utils'

export default function VideosPage() {
  const [videos, setVideos] = useState<TrainingVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<TrainingVideo | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/videos')
      const json = (await res.json()) as { videos?: TrainingVideo[]; error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Could not load videos')
        setVideos([])
        return
      }
      setVideos(json.videos ?? [])
    } catch {
      setError('Network error')
      setVideos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <AppPageChrome>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold sm:text-3xl">Video library</h1>
          <p className="text-sm text-muted-foreground">
            Curated clips from the monkcubed team.{' '}
            <Link href="/training" className="text-accent underline-offset-4 hover:underline">
              Training hub
            </Link>{' '}
            also includes your personal saves.
          </p>
        </div>

        {error ? (
          <p className="text-center text-sm text-destructive">{error}</p>
        ) : null}

        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading videos…</p>
        ) : videos.length === 0 ? (
          <Card className="mx-auto max-w-lg p-8 text-center text-sm text-muted-foreground">
            No catalog videos yet. Admins can add entries under{' '}
            <Link href="/admin/videos" className="text-accent underline-offset-4 hover:underline">
              Admin → Videos
            </Link>
            .
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => {
              const thumb = getYouTubeThumbnail(v.video_url)
              return (
                <Card
                  key={v.id}
                  role="button"
                  tabIndex={0}
                  className="group relative cursor-pointer overflow-hidden transition-all hover:border-accent/50"
                  onClick={() => setActive(v)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setActive(v)
                    }
                  }}
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent/30 to-background">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/90 shadow-lg transition-transform group-hover:scale-110">
                        <Play className="ml-0.5 h-6 w-6 text-accent-foreground" />
                      </div>
                    </div>
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:opacity-95"
                      />
                    ) : null}
                    <div className="absolute left-3 top-3 flex items-center gap-2">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                        <Video className="mr-1 h-3 w-3" />
                        Video
                      </Badge>
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                        {v.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 p-4">
                    <h2 className={cn('font-semibold transition-colors group-hover:text-accent')}>{v.title}</h2>
                    {v.description ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{v.description}</p>
                    ) : null}
                    <Button type="button" size="sm" variant="outline" className="w-full">
                      Watch
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

        {active ? (
          <VideoModal
            isOpen
            onClose={() => setActive(null)}
            title={active.title}
            description={active.description ?? ''}
            youtubeUrl={active.video_url}
            duration=""
            category={active.category}
          />
        ) : null}
      </div>
    </AppPageChrome>
  )
}
