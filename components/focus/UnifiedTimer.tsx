'use client'

import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PomodoroTimerCard } from '@/components/focus/pomodoro-timer-card'
import type { PomodoroIntentControl } from '@/components/focus/pomodoro-timer-card'
import {
  DeepWorkModeCard,
  type DeepWorkAmbientId,
} from '@/components/focus/deep-work-mode-card'
import { IntentLock } from '@/components/focus/IntentLock'
import {
  AudioSettingsPanel,
  type FocusTimerAlarmSettings,
  type FocusTimerSurface,
} from '@/components/focus/AudioSettingsPanel'
import { useDataServiceContext } from '@/hooks/use-data-service-context'
import { usePlan } from '@/hooks/usePlan'
import type { LoopingFocusTrack } from '@/hooks/useLoopingFocusTrack'
import { supabase } from '@/lib/supabase'
import {
  fetchDeepWorkCmsPublic,
  filterLoadedActiveTracks,
  type DeepWorkCmsState,
} from '@/lib/deep-work-site-settings'
import type { DeepWorkSession } from '@/lib/deep-work-sessions'

type Props = {
  setSessions: Dispatch<SetStateAction<DeepWorkSession[]>>
  alarm: FocusTimerAlarmSettings
}

export function UnifiedTimer({ setSessions, alarm }: Props) {
  const ctx = useDataServiceContext()
  const { isPro } = usePlan()
  const [surface, setSurface] = useState<FocusTimerSurface>('pomodoro')
  const [cms, setCms] = useState<DeepWorkCmsState | null>(null)

  const [intent, setIntent] = useState('')
  const [intentLocked, setIntentLocked] = useState(false)
  const [pomoTrack, setPomoTrack] = useState<LoopingFocusTrack>(null)
  const [deepAmbient, setDeepAmbient] = useState<DeepWorkAmbientId>('silence')

  useEffect(() => {
    void fetchDeepWorkCmsPublic(supabase).then(setCms)
  }, [])

  const mp3List = useMemo(
    () => (cms ? filterLoadedActiveTracks(cms) : []),
    [cms],
  )

  const onIntentUnlock = useCallback(() => {
    setIntentLocked(false)
  }, [])

  const onHydrateIntentLocked = useCallback(() => {
    setIntentLocked(true)
  }, [])

  const intentControl: PomodoroIntentControl = useMemo(
    () => ({
      intent,
      intentLocked,
      onIntentUnlock,
      onHydrateIntentLocked,
    }),
    [intent, intentLocked, onIntentUnlock, onHydrateIntentLocked],
  )

  const ambientControl = useMemo(
    () => ({
      value: deepAmbient,
      onChange: (id: DeepWorkAmbientId) => setDeepAmbient(id),
    }),
    [deepAmbient],
  )

  const pomoAmbientControl = useMemo(
    () => ({
      track: pomoTrack,
      setTrack: setPomoTrack,
    }),
    [pomoTrack],
  )

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="scroll-mt-24 rounded-2xl border-2 border-border bg-card p-6 shadow-none md:scroll-mt-28 lg:col-span-2">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={surface === 'pomodoro' ? 'default' : 'secondary'}
            className={cn(
              surface === 'pomodoro' && 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
            onClick={() => setSurface('pomodoro')}
          >
            Pomodoro
          </Button>
          <Button
            type="button"
            size="sm"
            variant={surface === 'deepwork' ? 'default' : 'secondary'}
            className={cn(
              surface === 'deepwork' && 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
            onClick={() => setSurface('deepwork')}
          >
            Deep work
          </Button>
        </div>

        <div
          id="pomodoro-focus"
          className={cn(surface !== 'pomodoro' && 'hidden')}
          aria-hidden={surface !== 'pomodoro'}
        >
          <IntentLock
            userId={ctx.userId}
            intent={intent}
            onIntentChange={setIntent}
            intentLocked={intentLocked}
            onIntentLocked={() => setIntentLocked(true)}
            onIntentUnlock={onIntentUnlock}
            disabled={false}
          />
          <PomodoroTimerCard
            alarmSoundRef={alarm.soundRef}
            alarmNotifyRef={alarm.notifyRef}
            intentControl={intentControl}
            ambientControl={pomoAmbientControl}
            deepWorkCmsFromParent={cms}
            embedded
            keyboardShortcutsEnabled={surface === 'pomodoro'}
            tabTitleActive={surface === 'pomodoro'}
          />
        </div>

        <div
          id="deep-work"
          className={cn(surface !== 'deepwork' && 'hidden')}
          aria-hidden={surface !== 'deepwork'}
        >
          <DeepWorkModeCard
            setSessions={setSessions}
            alarmSoundRef={alarm.soundRef}
            alarmNotifyRef={alarm.notifyRef}
            ambientControl={ambientControl}
            hideCardAmbientSelector
            deepWorkCmsFromParent={cms}
            omitSectionAnchor
            keyboardShortcutsEnabled={surface === 'deepwork'}
            tabTitleActive={surface === 'deepwork'}
          />
        </div>
      </Card>

      <div className="min-w-0">
        <AudioSettingsPanel
          mode={surface}
          isPro={isPro}
          alarm={alarm}
          pomodoroTrack={pomoTrack}
          onPomodoroTrackChange={setPomoTrack}
          deepWorkAmbient={deepAmbient}
          onDeepWorkAmbientChange={(id) => setDeepAmbient(id as DeepWorkAmbientId)}
          mp3TrackOptions={mp3List}
        />
      </div>
    </div>
  )
}
