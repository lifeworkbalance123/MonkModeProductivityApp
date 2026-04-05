import { HabitCard } from '@/components/HabitCard'
import { WeeklyPlanner } from '@/components/WeeklyPlanner'
import { useTheme } from '@/context/ThemeContext'
import { HOME_HABITS } from '@/constants/habits'
import { getBodyFontFamily, getDisplayFontFamily } from '@/lib/theme-fonts'
import {
  loadArchitectWL,
  toggleArchitectHabit,
  type ArchitectWLState,
} from '@/lib/architect-wl'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function HomeScreen() {
  const { currentTheme } = useTheme()
  const insets = useSafeAreaInsets()
  const [wl, setWl] = useState<ArchitectWLState | null>(null)

  const refreshWl = useCallback(() => {
    loadArchitectWL().then(setWl)
  }, [])

  useFocusEffect(
    useCallback(() => {
      refreshWl()
    }, [refreshWl]),
  )

  const displayFont = getDisplayFontFamily(currentTheme)
  const bodyFont = getBodyFontFamily(currentTheme)

  const completedSet = new Set(wl?.completedIds ?? [])
  const total = HOME_HABITS.length
  const done = completedSet.size
  const pct = total ? Math.round((done / total) * 100) : 0

  const onToggle = async (habitId: string) => {
    const next = await toggleArchitectHabit(habitId)
    setWl(next)
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: currentTheme.base }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 20,
      }}
    >
      <Text
        style={{
          fontFamily: displayFont,
          fontSize: 28,
          fontWeight: '700',
          color: currentTheme.text,
          marginBottom: 4,
        }}
      >
        Monk Mode
      </Text>
      <Text
        style={{
          fontFamily: bodyFont,
          fontSize: 14,
          color: currentTheme.text,
          opacity: 0.7,
          marginBottom: 20,
        }}
      >
        {currentTheme.persona}
      </Text>

      {currentTheme.id === 'architect' && wl ? (
        <View
          style={{
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
            backgroundColor: currentTheme.cardBg,
            borderWidth: 1,
            borderColor: currentTheme.borderColor,
          }}
        >
          <Text
            style={{
              fontFamily: displayFont,
              fontSize: 13,
              fontWeight: '600',
              color: currentTheme.accent,
              marginBottom: 8,
            }}
          >
            Ws vs Ls — daily scoreboard
          </Text>
          <Text style={{ fontFamily: bodyFont, fontSize: 22, color: currentTheme.text }}>
            W: {wl.completedIds.length}{' '}
            <Text style={{ opacity: 0.5 }}>/</Text> L: {wl.lastRollupLosses}
          </Text>
          <Text
            style={{
              fontFamily: bodyFont,
              fontSize: 11,
              color: currentTheme.text,
              opacity: 0.55,
              marginTop: 6,
            }}
          >
            W = habits completed today. L = habits missed when the day rolled at midnight.
          </Text>
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16,
          padding: 14,
          borderRadius: 14,
          backgroundColor: currentTheme.cardBg,
          borderWidth: 1,
          borderColor: currentTheme.borderColor,
        }}
      >
        <Text style={{ fontSize: 28, marginRight: 12 }}>🔥</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: currentTheme.accent }}>
            {done}-day rhythm
          </Text>
          <Text style={{ fontSize: 12, color: currentTheme.text, opacity: 0.65 }}>
            {done} of {total} habits checked in today
          </Text>
          <View
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: currentTheme.borderColor,
              marginTop: 10,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${pct}%`,
                height: 6,
                borderRadius: 3,
                backgroundColor: currentTheme.accent,
              }}
            />
          </View>
        </View>
      </View>

      <Text
        style={{
          fontFamily: displayFont,
          fontSize: 18,
          fontWeight: '700',
          color: currentTheme.text,
          marginBottom: 10,
        }}
      >
        Daily habits
      </Text>
      {HOME_HABITS.map((h) => (
        <HabitCard
          key={h.id}
          theme={currentTheme}
          title={h.title}
          completed={completedSet.has(h.id)}
          onToggle={() => onToggle(h.id)}
        />
      ))}

      <View style={{ height: 20 }} />
      <WeeklyPlanner theme={currentTheme} />
    </ScrollView>
  )
}
