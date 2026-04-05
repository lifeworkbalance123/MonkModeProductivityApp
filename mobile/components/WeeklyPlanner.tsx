import type { Theme } from '@/context/ThemeContext'
import { HOME_HABITS } from '@/constants/habits'
import { useCallback, useState } from 'react'
import { Pressable, Text, View } from 'react-native'

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

type Props = {
  theme: Theme
}

/** Local week grid — tap cells to toggle (preview UX; sync with web storage can follow). */
export function WeeklyPlanner({ theme }: Props) {
  const [grid, setGrid] = useState<Record<string, Record<number, boolean>>>({})

  const toggleCell = useCallback((habitId: string, col: number) => {
    setGrid((prev) => {
      const row = { ...(prev[habitId] ?? {}) }
      row[col] = !row[col]
      return { ...prev, [habitId]: row }
    })
  }, [])

  return (
    <View
      style={{
        borderRadius: 14,
        padding: 14,
        backgroundColor: theme.cardBg,
        borderWidth: 1,
        borderColor: theme.borderColor,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 4 }}>
        This week
      </Text>
      <Text style={{ fontSize: 12, color: theme.text, opacity: 0.65, marginBottom: 12 }}>
        Tap a cell to mark a habit for that day (saved for this session on device).
      </Text>
      <View style={{ flexDirection: 'row', marginBottom: 8, paddingLeft: 72 }}>
        {DAYS.map((d, i) => (
          <Text
            key={`${d}-${i}`}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 11,
              fontWeight: '600',
              color: theme.text,
              opacity: 0.7,
            }}
          >
            {d}
          </Text>
        ))}
      </View>
      {HOME_HABITS.map((h) => (
        <View
          key={h.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            borderTopWidth: 1,
            borderTopColor: theme.borderColor,
          }}
        >
          <Text
            style={{
              width: 72,
              fontSize: 13,
              color: theme.text,
            }}
            numberOfLines={1}
          >
            {h.title}
          </Text>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            {DAYS.map((_, col) => {
              const on = !!grid[h.id]?.[col]
              return (
                <Pressable
                  key={col}
                  onPress={() => toggleCell(h.id, col)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${h.title} ${DAYS[col]}`}
                  style={({ pressed }) => ({
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 6,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      backgroundColor: on ? theme.accent : 'transparent',
                      borderWidth: 2,
                      borderColor: on ? theme.accent : theme.borderColor,
                    }}
                  />
                </Pressable>
              )
            })}
          </View>
        </View>
      ))}
    </View>
  )
}
