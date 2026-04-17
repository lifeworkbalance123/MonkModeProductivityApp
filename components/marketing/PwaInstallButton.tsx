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

function detectAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

const triggerClassName =
  'inline-flex min-h-10 max-w-[7.5rem] shrink-0 touch-manipulation items-center justify-center gap-1 rounded-md border border-border bg-card px-2 text-[11px] font-semibold leading-tight text-foreground shadow-sm hover:bg-muted/80 sm:max-w-none sm:gap-1.5 sm:px-2.5 sm:text-xs'

export function PwaInstallButton({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsIOS(detectIOS())
    setIsAndroid(detectAndroid())

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
  const showAndroidManual = !showChromium && !showIOS && isAndroid

  if (!showChromium && !showIOS && !showAndroidManual) return null

  if (showChromium) {
    return (
      <button
        type="button"
        onClick={() => void runInstall()}
        className={cn(triggerClassName, className)}
        aria-label="Install monkcubed app"
      >
        <Download className="h-4 w-4 shrink-0 text-accent" aria-hidden />
        <span className="truncate">Install</span>
      </button>
    )
  }

  if (showIOS) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(triggerClassName, className)}
            aria-label="Add monkcubed to Home Screen"
          >
            <Download className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            <span className="truncate">Install</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" side="bottom" className="z-[100] w-72 text-sm">
          <p className="font-semibold text-foreground">Add to Home Screen</p>
          <p className="mt-2 text-muted-foreground">
            In <span className="font-medium text-foreground">Safari</span>, tap{' '}
            <span className="font-medium text-foreground">Share</span>, then{' '}
            <span className="font-medium text-foreground">Add to Home Screen</span>.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            On iPhone, if you use Chrome or another browser, open this page in Safari first — only Safari
            can add web apps to your home screen.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            The monkcubed app then opens like an installed app with the browser chrome hidden.
          </p>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(triggerClassName, className)}
          aria-label="Install monkcubed or add to home screen"
        >
          <Download className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <span className="truncate">Install</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" className="z-[100] w-72 text-sm">
        <p className="font-semibold text-foreground">Install or add to Home screen</p>
        <p className="mt-2 text-muted-foreground">
          In <span className="font-medium text-foreground">Chrome</span>, open the browser menu (three dots)
          and tap <span className="font-medium text-foreground">Install app</span> or{' '}
          <span className="font-medium text-foreground">Add to Home screen</span> (wording varies by
          version).
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          If you do not see that option, use Chrome (not an in-app browser), stay on this site for a few
          seconds, or try opening the homepage in a normal browser tab.
        </p>
      </PopoverContent>
    </Popover>
  )
}
