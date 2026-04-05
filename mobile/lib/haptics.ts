import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Haptics from 'expo-haptics'

export const HAPTIC_FOCUS_KEY = 'haptic_focus_enabled'

/** When unset, haptics are ON (default for Minimalist). */
export async function isHapticFocusEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(HAPTIC_FOCUS_KEY)
  if (v === null) return true
  return v === 'true'
}

export async function setHapticFocusEnabled(enabled: boolean) {
  await AsyncStorage.setItem(HAPTIC_FOCUS_KEY, enabled ? 'true' : 'false')
}

export async function maybeHapticSuccess() {
  const on = await isHapticFocusEnabled()
  if (!on) return
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  } catch {
    /* simulator / web */
  }
}

export async function maybeHapticMedium() {
  const on = await isHapticFocusEnabled()
  if (!on) return
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  } catch {
    /* ignore */
  }
}
