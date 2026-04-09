import { HabitCard } from '@/components/HabitCard'
import { useTheme } from '@/context/ThemeContext'
import { HOME_HABITS } from '@/constants/habits'
import {
  loadArchitectWL,
  toggleArchitectHabit,
  type ArchitectWLState,
} from '@/lib/architect-wl'
import { syncWidgetData } from '@/lib/widgetSync'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function HabitsScreen() {
  const { currentTheme: t } = useTheme()
  const insets = useSafeAreaInsets()
  const [wl, setWl] = useState<ArchitectWLState | null>(null)

  const refresh = useCallback(() => {
    loadArchitectWL().then((next) => {
      setWl(next)
      void syncWidgetData('local-mobile-user')
    })
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh]),
  )

  const done = new Set(wl?.completedIds ?? [])

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.base }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32 }}
    >
      <Text style={{ fontSize: 24, fontWeight: '800', color: t.text, marginBottom: 16 }}>Habits</Text>
      {HOME_HABITS.map((h) => (
        <HabitCard
          key={h.id}
          theme={t}
          title={h.title}
          completed={done.has(h.id)}
          onToggle={() =>
            toggleArchitectHabit(h.id).then((next) => {
              setWl(next)
              void syncWidgetData('local-mobile-user')
            })
          }
        />
      ))}
    </ScrollView>
  )
}
