'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Joyride, EVENTS, STATUS, type EventData, type EventHandler, type Step } from 'react-joyride'
import { useAuth } from '@/context/AuthContext'
import {
  clearPendingFirstRunWalkthrough,
  hasPendingFirstRunWalkthrough,
  isFirstRunWalkthroughDone,
  markFirstRunWalkthroughDone,
} from '@/lib/onboardingState'

const DESKTOP_STEPS: Step[] = [
  {
    target: '.begin-button',
    title: 'Start your day',
    content: 'Click Begin to open today’s lesson and checklist.',
    placement: 'right',
  },
  {
    target: '.habits-nav',
    title: 'Track your habits',
    content: 'Log daily anchors like lemon water and cold shower.',
    placement: 'right',
  },
  {
    target: '.schedule-nav',
    title: 'Plan your time',
    content: 'Use Time schedule to block deep work, meetings, and breaks.',
    placement: 'right',
  },
  {
    target: '.goals-nav',
    title: 'Set goals',
    content: 'Define what you want to achieve over the next 30–60 days.',
    placement: 'right',
  },
]

const MOBILE_STEPS: Step[] = [
  {
    target: '.begin-button',
    title: 'Start your day',
    content: 'Tap Begin for today’s lesson. Other tools live under Menu.',
    placement: 'top',
  },
  {
    target: '#app-main-tour-anchor',
    title: 'Main workspace',
    content:
      'Open Menu for Habits, Time schedule, Goals, and the rest of your stack. You can replay tips anytime from the Tool Library.',
    placement: 'top',
  },
]

export function FirstRunWalkthrough() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [run, setRun] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])

  const blocked = useMemo(
    () =>
      !!pathname &&
      (pathname.startsWith('/onboarding') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/join')),
    [pathname],
  )

  useEffect(() => {
    if (!user?.id || blocked) return
    if (isFirstRunWalkthroughDone(user.id)) return
    if (!hasPendingFirstRunWalkthrough(user.id)) return

    const mobile = window.matchMedia('(max-width: 767px)').matches
    setSteps(mobile ? MOBILE_STEPS : DESKTOP_STEPS)

    const t1 = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('monk:expand-all-nav'))
      setRun(true)
    }, 1000)

    return () => {
      window.clearTimeout(t1)
    }
  }, [user?.id, blocked])

  const finishTour = useCallback(
    (userId: string) => {
      clearPendingFirstRunWalkthrough(userId)
      markFirstRunWalkthroughDone(userId)
      setRun(false)
    },
    [],
  )

  const onEvent: EventHandler = useCallback(
    (data: EventData) => {
      const userId = user?.id
      if (!userId) return

      if (data.type === EVENTS.TARGET_NOT_FOUND || data.type === EVENTS.ERROR) {
        finishTour(userId)
        return
      }

      if (data.type === EVENTS.TOUR_END) {
        finishTour(userId)
        return
      }

      if (data.type === EVENTS.TOUR_STATUS) {
        if (data.status === STATUS.SKIPPED || data.status === STATUS.FINISHED) {
          finishTour(userId)
        }
      }
    },
    [user?.id, finishTour],
  )

  if (!user?.id || steps.length === 0) return null

  return (
    <Joyride
      run={run}
      steps={steps}
      continuous
      scrollToFirstStep
      onEvent={onEvent}
      options={{
        showProgress: true,
        zIndex: 10060,
        spotlightPadding: 6,
        overlayColor: 'rgba(15, 23, 42, 0.72)',
        primaryColor: '#f59e0b',
        textColor: '#0f172a',
        backgroundColor: '#ffffff',
        arrowColor: '#ffffff',
        buttons: ['back', 'primary', 'skip'],
      }}
    />
  )
}
