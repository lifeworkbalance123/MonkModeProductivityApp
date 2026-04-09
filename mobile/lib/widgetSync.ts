import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform, NativeModules } from 'react-native'
import { HOME_HABITS } from '@/constants/habits'
import { loadArchitectWL } from '@/lib/architect-wl'

const IOS_APP_GROUP = 'group.com.monkmode.shared'
const IOS_WIDGET_KEY = 'monkmode_widget_data'
const ANDROID_WIDGET_KEY = 'monkmode_widget_data'
const TOP_GOAL_KEY = 'monkmode_top_goal'

type WidgetPayload = {
  streak: number
  bestStreak: number
  habitsCompleted: number
  habitsTotal: number
  topGoal: string
  lastUpdated: string
}

type AndroidWidgetSharedStorageModule = {
  setWidgetData?: (jsonPayload: string) => Promise<void> | void
}

function getAndroidWidgetModule(): AndroidWidgetSharedStorageModule | null {
  return (NativeModules?.MonkModeWidgetStorage as AndroidWidgetSharedStorageModule) ?? null
}

async function writeSharedWidgetData(payload: WidgetPayload) {
  const serialized = JSON.stringify(payload)

  if (Platform.OS === 'ios') {
    await AsyncStorage.setItem(IOS_WIDGET_KEY, serialized)
    await AsyncStorage.setItem(`${IOS_APP_GROUP}.${IOS_WIDGET_KEY}`, serialized)
    return
  }

  if (Platform.OS === 'android') {
    const module = getAndroidWidgetModule()
    if (module?.setWidgetData) {
      await module.setWidgetData(serialized)
    } else {
      await AsyncStorage.setItem(ANDROID_WIDGET_KEY, serialized)
    }
  }
}

export async function syncWidgetData(userId: string): Promise<void> {
  if (!userId) return

  const wl = await loadArchitectWL()
  const habitsTotal = HOME_HABITS.length
  const habitsCompleted = wl.completedIds.length
  const topGoal = (await AsyncStorage.getItem(TOP_GOAL_KEY)) ?? ''

  const payload: WidgetPayload = {
    streak: habitsCompleted,
    bestStreak: Math.max(habitsCompleted, wl.lastRollupLosses),
    habitsCompleted,
    habitsTotal,
    topGoal,
    lastUpdated: new Date().toISOString(),
  }

  await writeSharedWidgetData(payload)
}

export async function setWidgetTopGoal(goalText: string) {
  await AsyncStorage.setItem(TOP_GOAL_KEY, goalText.trim())
}

// IMPORTANT: Widgets require EAS Build.
// Run: eas build --platform ios --profile production
// Widgets do NOT work in Expo Go or the Expo web build.
// Test on a real device via TestFlight after EAS Build completes.

