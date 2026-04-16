'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  const mq = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return mq || iosStandalone
}

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return true
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

export function PwaInstallButton({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsIOS(detectIOS())

    if (isStandaloneDisplay()) return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const runInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }, [deferredPrompt])

  if (!mounted || isStandaloneDisplay()) return null

  const showChromium = !!deferredPrompt
  const showIOS = isIOS && !showChromium

  if (!showChromium && !showIOS) return null

  if (showChromium) {
    return (
      <button
        type="button"
        onClick={() => void runInstall()}
        className={cn(
          'inline-flex min-h-10 shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted/80 sm:px-3',
          className,
        )}
        aria-label="Install monkcubed app"
      >
        <Download className="h-4 w-4 shrink-0 text-accent" aria-hidden />
        <span className="hidden sm:inline">Install app</span>
      </button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex min-h-10 shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted/80 sm:px-3',
            className,
          )}
          aria-label="Add monkcubed to Home Screen"
        >
          <Download className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <span className="hidden sm:inline">Add app</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" className="w-72 text-sm">
        <p className="font-semibold text-foreground">Add to Home Screen</p>
        <p className="mt-2 text-muted-foreground">
          In Safari, tap <span className="font-medium text-foreground">Share</span> in the toolbar, then{' '}
          <span className="font-medium text-foreground">Add to Home Screen</span>.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          monkcubed opens like an app with the address bar hidden.
        </p>
      </PopoverContent>
    </Popover>
  )
}
