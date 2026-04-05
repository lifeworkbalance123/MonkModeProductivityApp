import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'morning_protocol_v1'

export type MorningProtocolState = {
  requireUnlock: boolean
  steps: string[]
}

const defaultSteps = ['Hydrate', 'Stretch', 'Plan the day']

export async function loadMorningProtocol(): Promise<MorningProtocolState> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    if (!raw) {
      return { requireUnlock: false, steps: [...defaultSteps] }
    }
    const p = JSON.parse(raw) as Partial<MorningProtocolState>
    return {
      requireUnlock: !!p.requireUnlock,
      steps:
        Array.isArray(p.steps) && p.steps.length > 0 ? p.steps : [...defaultSteps],
    }
  } catch {
    return { requireUnlock: false, steps: [...defaultSteps] }
  }
}

export async function saveMorningProtocol(state: MorningProtocolState) {
  await AsyncStorage.setItem(KEY, JSON.stringify(state))
}
