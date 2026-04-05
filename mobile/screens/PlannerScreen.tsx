import { WeeklyPlanner } from '@/components/WeeklyPlanner'
import { useTheme } from '@/context/ThemeContext'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function PlannerScreen() {
  const { currentTheme: t } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View style={{ flex: 1, backgroundColor: t.base, paddingTop: insets.top + 16, paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: t.text, marginBottom: 16 }}>Planner</Text>
      <WeeklyPlanner theme={t} />
    </View>
  )
}
