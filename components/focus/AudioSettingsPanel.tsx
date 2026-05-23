'use client'

import type { RefObject } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ProBadge } from '@/components/pro-badge'
import { AudioTrackSelector } from '@/components/focus/AudioTrackSelector'
import { cn } from '@/lib/utils'
import type { LoopingFocusTrack } from '@/hooks/useLoopingFocusTrack'

export type FocusTimerSurface = 'pomodoro' | 'deepwork'

/** Shape of `useTimerAlarmSettings()` return (avoids typeof on a hook-only type import). */
export type FocusTimerAlarmSettings = {
  soundOn: boolean
  setSoundOn: (on: boolean) => void
  notifyOn: boolean
  setNotifyOn: (on: boolean) => void
  notifyPermission: NotificationPermission | 'unsupported'
  soundRef: RefObject<boolean>
  notifyRef: RefObject<boolean>
}

const BRAINWAVE_ROWS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'beta', label: 'Beta (13–30 Hz) — hustle / execution' },
  { id: 'alpha', label: 'Alpha (8–12 Hz) — calm focus bridge' },
  { id: 'theta', label: 'Theta (4–8 Hz) — deep creative state' },
  { id: 'gamma', label: 'Gamma (30–100 Hz) — insight / synthesis' },
]

type Alarm = FocusTimerAlarmSettings

type Props = {
  mode: FocusTimerSurface
  isPro: boolean
  alarm: Alarm
  pomodoroTrack: LoopingFocusTrack
  onPomodoroTrackChange: (t: LoopingFocusTrack) => void
  deepWorkAmbient: string
  onDeepWorkAmbientChange: (id: string) => void
  mp3TrackOptions: Array<{ key: string; label: string; url?: string | null }>
}

export function AudioSettingsPanel({
  mode,
  isPro,
  alarm,
  pomodoroTrack,
  onPomodoroTrackChange,
  deepWorkAmbient,
  onDeepWorkAmbientChange,
  mp3TrackOptions,
}: Props) {
  const mp3ForSelector = mp3TrackOptions.map((t) => ({ key: t.key, label: t.label }))

  return (
    <Card className="rounded-2xl border border-border p-4 shadow-none md:p-5">
      <div className="label-machine mb-3 text-foreground">Focus audio & alerts</div>

      <div className="space-y-4 border-b border-border pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="panel-timer-alarm-sound"
              checked={alarm.soundOn}
              onCheckedChange={alarm.setSoundOn}
            />
            <Label htmlFor="panel-timer-alarm-sound" className="cursor-pointer font-normal text-sm">
              Sound when a phase ends
            </Label>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <div className="flex items-center gap-2">
              <Switch
                id="panel-timer-alarm-notify"
                checked={alarm.notifyOn}
                onCheckedChange={alarm.setNotifyOn}
                disabled={alarm.notifyPermission === 'unsupported'}
              />
              <Label htmlFor="panel-timer-alarm-notify" className="cursor-pointer font-normal text-sm">
                Desktop notification
              </Label>
            </div>
            {alarm.notifyPermission === 'denied' ? (
              <p className="text-xs text-muted-foreground sm:ml-0">
                Unblock notifications for this site in your browser settings to use alerts in the
                background.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {mode === 'pomodoro' ? 'Pomodoro background (MP3)' : 'Deep work ambient'}
          </p>
          {mode === 'pomodoro' ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onPomodoroTrackChange(null)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                  pomodoroTrack == null
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-secondary text-muted-foreground hover:brightness-110 hover:text-foreground',
                )}
              >
                None
              </button>
              {mp3TrackOptions.map((t) => {
                const u = t.url?.trim()
                if (!u) return null
                const active = pomodoroTrack?.url === u
                return (
                  <button
                    key={t.key}
                    type="button"
                    title={t.label}
                    onClick={() => onPomodoroTrackChange({ url: u, label: t.label })}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-secondary text-muted-foreground hover:brightness-110 hover:text-foreground',
                    )}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          ) : (
            <AudioTrackSelector
              ambient={deepWorkAmbient}
              onAmbientChange={onDeepWorkAmbientChange}
              mp3Tracks={mp3ForSelector}
              disabled={false}
              compact
            />
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">Brainwave-styled audio</p>
            {!isPro ? <ProBadge /> : null}
          </div>
          <ul className="space-y-2 text-sm text-foreground/90">
            {BRAINWAVE_ROWS.map((row) => (
              <li
                key={row.id}
                className="flex items-start justify-between gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2"
              >
                <span>{row.label}</span>
                {!isPro ? (
                  <span className="shrink-0 text-[11px] text-muted-foreground">Pro roadmap</span>
                ) : (
                  <span className="shrink-0 text-[11px] text-muted-foreground">Coming soon</span>
                )}
              </li>
            ))}
          </ul>
          {!isPro ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Pro unlocks future brainwave-tuned focus audio. Built-in ambient and curated MP3s work
              today.
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
