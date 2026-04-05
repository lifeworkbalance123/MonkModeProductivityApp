import { useTheme } from '@/context/ThemeContext'
import type { TrainingModuleRow } from '@/services/db'
import { Ionicons } from '@expo/vector-icons'
import { Clock, FileText, Lock, Play, Video } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

export type TrainingCardProps = {
  module: TrainingModuleRow
  completedToday?: boolean
  onPress: () => void
}

const thumbColors: Record<string, string> = {
  pomodoro: '#1e3a5f',
  timeboxing: '#2d4a3e',
  habits: '#4a3d5c',
  morning: '#5c4a2d',
  deepwork: '#3d2d2d',
  evening: '#2d3d4a',
}

/**
 * Sprint 1 training module card — grid tile with thumbnail, play/lock, duration & type badges.
 * Do not replace this layout in future sprints; extend via navigation / data only.
 */
export function TrainingCard({ module, completedToday, onPress }: TrainingCardProps) {
  const { currentTheme: t } = useTheme()
  const locked = module.locked === 1
  const bg = thumbColors[module.thumbnail_key] ?? t.cardBg
  const TypeIcon = module.type === 'video' ? Video : FileText

  return (
    <Pressable
      onPress={onPress}
      disabled={locked}
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: completedToday ? t.accent : t.borderColor,
        opacity: locked ? 0.75 : 1,
        backgroundColor: t.cardBg,
      }}
    >
      <View style={{ aspectRatio: 16 / 9, backgroundColor: bg, position: 'relative' }}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {locked ? (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: t.cardBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={22} color={t.text} opacity={0.7} />
            </View>
          ) : (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: t.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Play size={26} color={t.isDark ? '#fff' : '#111'} style={{ marginLeft: 4 }} />
            </View>
          )}
        </View>
        {completedToday ? (
          <View
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              backgroundColor: t.accent,
              borderRadius: 999,
              padding: 4,
            }}
          >
            <Ionicons name="checkmark" size={16} color={t.isDark ? '#fff' : '#111'} />
          </View>
        ) : null}
        <View
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: t.cardBg,
          }}
        >
          <Clock size={12} color={t.text} />
          <Text style={{ marginLeft: 4, fontSize: 11, fontWeight: '600', color: t.text }}>
            {module.duration}
          </Text>
        </View>
        <View
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: t.cardBg,
          }}
        >
          <TypeIcon size={12} color={t.text} />
          <Text style={{ marginLeft: 4, fontSize: 11, fontWeight: '600', color: t.text }}>
            {module.type === 'video' ? 'Video' : 'Article'}
          </Text>
        </View>
      </View>
      <View style={{ padding: 14 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: t.text }}>{module.title}</Text>
        <Text
          style={{ marginTop: 6, fontSize: 13, color: t.text, opacity: 0.65 }}
          numberOfLines={2}
        >
          {module.description}
        </Text>
      </View>
    </Pressable>
  )
}
