import type { Theme } from '@/context/ThemeContext'
import { maybeHapticSuccess } from '@/lib/haptics'
import { Pressable, Text, View } from 'react-native'

type Props = {
  theme: Theme
  title: string
  completed: boolean
  onToggle: () => void
}

export function HabitCard({ theme, title, completed, onToggle }: Props) {
  return (
    <Pressable
      onPress={async () => {
        const next = !completed
        onToggle()
        if (next) await maybeHapticSuccess()
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: theme.cardBg,
        borderWidth: 1,
        borderColor: theme.borderColor,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: completed ? theme.accent : theme.borderColor,
          backgroundColor: completed ? theme.accent : 'transparent',
          marginRight: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {completed ? (
          <Text
            style={{
              color: theme.isDark ? '#FFFFFF' : theme.text,
              fontSize: 12,
              fontWeight: '800',
            }}
          >
            ✓
          </Text>
        ) : null}
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 16,
          color: theme.text,
          opacity: completed ? 0.55 : 1,
          textDecorationLine: completed ? 'line-through' : 'none',
        }}
      >
        {title}
      </Text>
    </Pressable>
  )
}
