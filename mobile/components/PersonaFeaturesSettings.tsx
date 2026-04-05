import { useTheme } from '@/context/ThemeContext'
import {
  FOCUS_MODE_KEY,
  getFocusModeEnergy,
  setFocusModeEnergy,
  type FocusModeEnergy,
} from '@/lib/focus-mode-pref'
import {
  HAPTIC_FOCUS_KEY,
  isHapticFocusEnabled,
  setHapticFocusEnabled,
} from '@/lib/haptics'
import {
  loadMorningProtocol,
  saveMorningProtocol,
  type MorningProtocolState,
} from '@/lib/morning-protocol-pref'
import { useCallback, useEffect, useState } from 'react'
import {
  Modal,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'

/** Persona-specific settings (Step 5). Only the active persona block is shown. */
export function PersonaFeaturesSettings() {
  const { currentTheme } = useTheme()

  if (currentTheme.id === 'minimalist') {
    return <MinimalistHaptics />
  }
  if (currentTheme.id === 'architect') {
    return <ArchitectCopy />
  }
  if (currentTheme.id === 'flowseeker') {
    return <FlowSeekerToggle />
  }
  if (currentTheme.id === 'resetter') {
    return <ResetterHardLock />
  }
  if (currentTheme.id === 'ascetic') {
    return <AsceticMorningProtocol />
  }
  return null
}

function SectionShell({
  label,
  description,
  children,
  comingSoon,
}: {
  label: string
  description: string
  children: React.ReactNode
  comingSoon?: boolean
}) {
  const { currentTheme } = useTheme()
  return (
    <View
      style={{
        padding: 14,
        borderRadius: 12,
        backgroundColor: currentTheme.cardBg,
        borderWidth: 1,
        borderColor: currentTheme.borderColor,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: currentTheme.text, flex: 1 }}>
          {label}
        </Text>
        {comingSoon ? (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: currentTheme.borderColor,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: currentTheme.text }}>Coming Soon</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ fontSize: 13, color: currentTheme.text, opacity: 0.75, marginTop: 6 }}>
        {description}
      </Text>
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  )
}

function MinimalistHaptics() {
  const { currentTheme } = useTheme()
  const [on, setOn] = useState(true)

  useEffect(() => {
    isHapticFocusEnabled().then(setOn)
  }, [])

  const toggle = async (v: boolean) => {
    setOn(v)
    await setHapticFocusEnabled(v)
  }

  return (
    <SectionShell
      label="Haptic Focus Mode"
      description="Replaces all sound alerts with precise haptic patterns."
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: currentTheme.text, fontSize: 14 }}>Haptics on timer & habits</Text>
        <Switch value={on} onValueChange={toggle} trackColor={{ true: currentTheme.accent }} />
      </View>
      <Text style={{ fontSize: 11, color: currentTheme.text, opacity: 0.5, marginTop: 8 }}>
        Stored as {HAPTIC_FOCUS_KEY}. Default on for The Minimalist.
      </Text>
    </SectionShell>
  )
}

function ArchitectCopy() {
  const { currentTheme } = useTheme()
  return (
    <SectionShell
      label="Ws vs Ls Tracker"
      description="Daily scoreboard. Complete your non-negotiables, earn your W. View counts on the Home tab."
    >
      <Text style={{ fontSize: 13, color: currentTheme.text, opacity: 0.8 }}>
        W = habits completed today. L updates when the calendar day rolls at midnight based on what you
        missed yesterday.
      </Text>
    </SectionShell>
  )
}

function FlowSeekerToggle() {
  const { currentTheme } = useTheme()
  const [mode, setMode] = useState<FocusModeEnergy>('soft')

  useEffect(() => {
    getFocusModeEnergy().then(setMode)
  }, [])

  const pick = async (m: FocusModeEnergy) => {
    setMode(m)
    await setFocusModeEnergy(m)
  }

  return (
    <SectionShell
      label="Soft Focus / Hard Focus"
      description="Tell the app your energy level. It adapts your goal suggestions."
    >
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {(['soft', 'hard'] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => pick(m)}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: mode === m ? currentTheme.accent : currentTheme.borderColor,
              backgroundColor: mode === m ? currentTheme.cardBg : 'transparent',
            }}
          >
            <Text style={{ textAlign: 'center', fontWeight: '700', color: currentTheme.text }}>
              {m === 'soft' ? 'Soft Focus (creative)' : 'Hard Focus (analytical)'}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ fontSize: 11, color: currentTheme.text, opacity: 0.5, marginTop: 8 }}>
        Stored as {FOCUS_MODE_KEY}. Goal logic coming later.
      </Text>
    </SectionShell>
  )
}

function ResetterHardLock() {
  const { currentTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [duration, setDuration] = useState<'1' | '2' | '4' | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    setDuration(null)
  }, [])

  return (
    <SectionShell
      label="Hard Lock Mode"
      description="Locks you into the app for up to 4 hours. No switching. No escape."
    >
      {/* TODO: implement with Expo Foreground Service + accessibility permissions */}
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          paddingVertical: 14,
          borderRadius: 10,
          backgroundColor: '#B91C1C',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '800' }}>Activate Hard Lock</Text>
      </Pressable>
      <Text style={{ fontSize: 11, color: '#B91C1C', marginTop: 8 }}>
        Placeholder — no lock is enforced yet (v2.0).
      </Text>

      <Modal visible={open} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', padding: 24 }}
          onPress={close}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              borderRadius: 16,
              padding: 20,
              backgroundColor: currentTheme.cardBg,
              borderWidth: 1,
              borderColor: currentTheme.borderColor,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '800', color: currentTheme.text }}>
              Hard Lock
            </Text>
            <Text style={{ marginTop: 10, color: currentTheme.text, opacity: 0.85 }}>
              This will prevent app switching for the selected duration. Are you sure?
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              {(['1', '2', '4'] as const).map((h) => (
                <Pressable
                  key={h}
                  onPress={() => setDuration(h)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: duration === h ? currentTheme.accent : currentTheme.borderColor,
                  }}
                >
                  <Text style={{ color: currentTheme.text, fontWeight: '600' }}>{h} hr</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 12 }}>
              <Pressable onPress={close}>
                <Text style={{ color: currentTheme.text, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={close}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#B91C1C' }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Confirm (no-op)</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SectionShell>
  )
}

function AsceticMorningProtocol() {
  const { currentTheme } = useTheme()
  const [state, setState] = useState<MorningProtocolState | null>(null)

  useEffect(() => {
    loadMorningProtocol().then(setState)
  }, [])

  const persist = async (next: MorningProtocolState) => {
    setState(next)
    await saveMorningProtocol(next)
  }

  if (!state) return null

  return (
    <SectionShell
      label="Morning Protocol Lock"
      description="The app stays locked until your morning protocol is complete."
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: currentTheme.text, flex: 1, paddingRight: 12 }}>
          Require morning protocol to unlock app
        </Text>
        <Switch
          value={state.requireUnlock}
          onValueChange={(v) => persist({ ...state, requireUnlock: v })}
          trackColor={{ true: currentTheme.accent }}
        />
      </View>
      {state.requireUnlock ? (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: currentTheme.text, marginBottom: 8 }}>
            Steps (customise)
          </Text>
          {state.steps.map((step, i) => (
            <TextInput
              key={i}
              value={step}
              onChangeText={(text) => {
                const steps = [...state.steps]
                steps[i] = text
                persist({ ...state, steps })
              }}
              placeholder={`Step ${i + 1}`}
              placeholderTextColor="#888888"
              style={{
                borderWidth: 1,
                borderColor: currentTheme.borderColor,
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
                color: currentTheme.text,
                backgroundColor: currentTheme.base,
              }}
            />
          ))}
        </View>
      ) : null}
      {/* TODO: implement lock screen with Expo SplashScreen override */}
      <Text style={{ fontSize: 11, color: currentTheme.text, opacity: 0.55, marginTop: 8 }}>
        Enforcement not wired yet — preferences are saved only.
      </Text>
    </SectionShell>
  )
}
