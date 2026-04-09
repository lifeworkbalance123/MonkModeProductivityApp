'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { supabase } from '@/lib/supabase'

type ShareStats = {
  streakCount: number
  habitsCompleted: string
  topGoal: string
  referralCode: string
}

export default function SharePage() {
  const params = useParams<{ userId: string }>()
  const userId = String(params.userId ?? '')
  const { user } = useAuth()
  const { showToast } = useToast()
  const [stats, setStats] = useState<ShareStats | null>(null)

  useEffect(() => {
    if (!userId || !user?.id || user.id !== userId) return
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return
      const res = await fetch(`/api/share/stats?userId=${encodeURIComponent(userId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = (await res.json()) as ShareStats
      setStats(data)
    })()
  }, [user?.id, userId])

  const imageUrl = useMemo(() => {
    if (!stats) return ''
    const q = new URLSearchParams({
      userId,
      streakCount: String(stats.streakCount),
      habitsCompleted: stats.habitsCompleted,
      topGoal: stats.topGoal ?? '',
    })
    return `/api/share/generate-image?${q.toString()}`
  }, [stats, userId])

  async function saveImage() {
    if (!imageUrl) return
    const res = await fetch(imageUrl)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `monkmode-streak-${stats?.streakCount ?? 0}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const referralCode = stats?.referralCode ?? 'MONKMODE'
  const referralLink = `https://monkmodeapp.com/ref/${referralCode}`
  const twitterHref =
    'https://twitter.com/intent/tweet?text=' +
    encodeURIComponent(
      `I'm on a 🔥${stats?.streakCount ?? 0} day streak with @MonkMode — building unstoppable habits one day at a time. Join me free: monkmodeapp.com/ref/${referralCode}`,
    ) +
    '&url=' +
    encodeURIComponent('https://monkmodeapp.com')

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-2xl px-4 py-8 pt-24">
        <h1 className="text-2xl font-semibold">Share your streak</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your progress and invite friends to MonkMode.
        </p>

        <Card className="mt-5 p-4">
          {imageUrl ? (
            <img src={imageUrl} alt="Shareable streak image" className="w-full rounded-lg border border-border" />
          ) : (
            <div className="h-[360px] animate-pulse rounded-lg bg-secondary/50" />
          )}
          <div className="mt-4 space-y-2">
            <Button className="w-full bg-[#F59E0B] text-[#111827] hover:bg-[#F59E0B]/90" onClick={() => void saveImage()}>
              Save image
            </Button>
            <a href={twitterHref} target="_blank" rel="noreferrer">
              <Button variant="outline" className="w-full">
                Share on X
              </Button>
            </a>
            <Button
              variant="secondary"
              className="w-full"
              onClick={async () => {
                await navigator.clipboard.writeText(referralLink)
                showToast('Link copied! Share it to earn free Pro time.', 'success')
              }}
            >
              Copy referral link
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

