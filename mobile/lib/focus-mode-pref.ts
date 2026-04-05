import AsyncStorage from '@react-native-async-storage/async-storage'

export const FOCUS_MODE_KEY = 'focus_mode'

export type FocusModeEnergy = 'soft' | 'hard'

export async function getFocusModeEnergy(): Promise<FocusModeEnergy> {
  const v = await AsyncStorage.getItem(FOCUS_MODE_KEY)
  if (v === 'hard') return 'hard'
  return 'soft'
}

export async function setFocusModeEnergy(mode: FocusModeEnergy) {
  await AsyncStorage.setItem(FOCUS_MODE_KEY, mode)
}
