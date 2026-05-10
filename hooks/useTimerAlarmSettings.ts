'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getTimerAlarmNotifyEnabled,
  getTimerAlarmSoundEnabled,
  requestTimerNotificationPermission,
  setTimerAlarmNotifyEnabled,
  setTimerAlarmSoundEnabled,
} from '@/lib/timer-alarm'

export function useTimerAlarmSettings() {
  const [soundOn, setSoundOnState] = useState(true)
  const [notifyOn, setNotifyOnState] = useState(false)
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission | 'unsupported'>('default')

  useEffect(() => {
    setSoundOnState(getTimerAlarmSoundEnabled())
    setNotifyOnState(getTimerAlarmNotifyEnabled())
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifyPermission(Notification.permission)
    } else {
      setNotifyPermission('unsupported')
    }
  }, [])

  const soundRef = useRef(soundOn)
  const notifyRef = useRef(notifyOn)
  useEffect(() => {
    soundRef.current = soundOn
  }, [soundOn])
  useEffect(() => {
    notifyRef.current = notifyOn
  }, [notifyOn])

  const setSoundOn = useCallback((on: boolean) => {
    setSoundOnState(on)
    setTimerAlarmSoundEnabled(on)
    soundRef.current = on
  }, [])

  const setNotifyOn = useCallback((on: boolean) => {
    if (on && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'denied') {
        setNotifyPermission('denied')
        setNotifyOnState(false)
        setTimerAlarmNotifyEnabled(false)
        notifyRef.current = false
        return
      }
      if (Notification.permission === 'default') {
        void (async () => {
          try {
            const p = await requestTimerNotificationPermission()
            setNotifyPermission(p)
            const granted = p === 'granted'
            setNotifyOnState(granted)
            setTimerAlarmNotifyEnabled(granted)
            notifyRef.current = granted
          } catch {
            setNotifyPermission('denied')
            setNotifyOnState(false)
            setTimerAlarmNotifyEnabled(false)
            notifyRef.current = false
          }
        })()
        return
      }
    }
    setNotifyOnState(on)
    setTimerAlarmNotifyEnabled(on)
    notifyRef.current = on
  }, [])

  return {
    soundOn,
    setSoundOn,
    notifyOn,
    setNotifyOn,
    notifyPermission,
    setNotifyPermission,
    soundRef,
    notifyRef,
  }
}
