import { HOME_HABITS } from '@/constants/habits'
import { loadArchitectWL, toggleArchitectHabit } from '@/lib/architect-wl'
import { NativeEventEmitter, NativeModules, Platform } from 'react-native'

type WatchHabit = {
  id: string
  name: string
  icon: string
  completed: boolean
}

type WatchPayload = {
  habits: WatchHabit[]
  streak: number
  isPro: boolean
  pomodoroActive: boolean
  pomodoroSecondsRemaining: number
}

type WatchActionMessage =
  | { action: 'complete_habit'; habitId: string }
  | { action: 'start_pomodoro' }
  | { action: 'save_gratitude'; text: string }

type WatchNativeModule = {
  updateApplicationContext?: (payload: WatchPayload) => Promise<void> | void
  sendDataToWear?: (payload: WatchPayload) => Promise<void> | void
}

type WatchActionHandlers = {
  onStartPomodoro?: () => void | Promise<void>
  onSaveGratitude?: (text: string) => void | Promise<void>
}

const NATIVE_EVENT_NAME = 'MonkModeWatchAction'
const USER_IS_PRO_FALLBACK = true
const POMODORO_SECONDS_DEFAULT = 25 * 60

function buildWatchHabits(completedIds: string[]): WatchHabit[] {
  const completed = new Set(completedIds)
  return HOME_HABITS.slice(0, 6).map((h) => ({
    id: h.id,
    name: h.title,
    icon: '✅',
    completed: completed.has(h.id),
  }))
}

export class WatchSessionManager {
  private handlers: WatchActionHandlers
  private eventSub: { remove: () => void } | null = null
  private emitter: NativeEventEmitter | null = null
  private nativeModule: WatchNativeModule | null = null

  constructor(handlers: WatchActionHandlers = {}) {
    this.handlers = handlers
    this.nativeModule = (NativeModules?.MonkModeWatchSync as WatchNativeModule) ?? null
    if (this.nativeModule) {
      this.emitter = new NativeEventEmitter(this.nativeModule as never)
    }
  }

  async syncNow() {
    const wl = await loadArchitectWL()
    const payload: WatchPayload = {
      habits: buildWatchHabits(wl.completedIds),
      streak: wl.completedIds.length,
      isPro: USER_IS_PRO_FALLBACK,
      pomodoroActive: false,
      pomodoroSecondsRemaining: POMODORO_SECONDS_DEFAULT,
    }

    if (Platform.OS === 'ios') {
      await this.nativeModule?.updateApplicationContext?.(payload)
      return
    }
    if (Platform.OS === 'android') {
      await this.nativeModule?.sendDataToWear?.(payload)
    }
  }

  startListening() {
    if (!this.emitter || this.eventSub) return
    this.eventSub = this.emitter.addListener(
      NATIVE_EVENT_NAME,
      (message: WatchActionMessage) => void this.handleAction(message),
    )
  }

  stopListening() {
    this.eventSub?.remove()
    this.eventSub = null
  }

  private async handleAction(message: WatchActionMessage) {
    if (message.action === 'complete_habit' && message.habitId) {
      await toggleArchitectHabit(message.habitId)
      await this.syncNow()
      return
    }

    if (message.action === 'start_pomodoro') {
      await this.handlers.onStartPomodoro?.()
      return
    }

    if (message.action === 'save_gratitude') {
      await this.handlers.onSaveGratitude?.(message.text)
    }
  }
}

let singleton: WatchSessionManager | null = null

export function getWatchSessionManager() {
  if (!singleton) singleton = new WatchSessionManager()
  return singleton
}

