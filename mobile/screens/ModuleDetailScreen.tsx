import { MediaContentBlock } from '@/components/MediaContentBlock'
import { useTheme } from '@/context/ThemeContext'
import {
  getContentBlockByModuleId,
  getTrainingModuleById,
  markModuleCompleted,
  type TrainingModuleRow,
} from '@/services/db'
import type { ContentBlock } from '@/types/media'
import { Ionicons } from '@expo/vector-icons'
import { ChevronLeft } from 'lucide-react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ModuleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { currentTheme: t } = useTheme()
  const insets = useSafeAreaInsets()
  const [mod, setMod] = useState<TrainingModuleRow | null>(null)
  const [block, setBlock] = useState<ContentBlock | null>(null)
  const [completeAnim] = useState(new Animated.Value(0))

  const load = useCallback(async () => {
    if (!id) return
    const m = await getTrainingModuleById(String(id))
    setMod(m)
    const b = await getContentBlockByModuleId(String(id))
    setBlock(b)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const onComplete = async () => {
    if (!id) return
    await markModuleCompleted(String(id))
    Animated.sequence([
      Animated.spring(completeAnim, { toValue: 1, useNativeDriver: true, friction: 5 }),
      Animated.delay(400),
      Animated.timing(completeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start()
  }

  if (!mod) {
    return (
      <View style={{ flex: 1, backgroundColor: t.base, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: t.text }}>Loading…</Text>
      </View>
    )
  }

  const locked = mod.locked === 1

  return (
    <View style={{ flex: 1, backgroundColor: t.base }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ChevronLeft size={28} color={t.text} />
          <Text style={{ color: t.text, fontSize: 16, marginLeft: 4 }}>Back</Text>
        </Pressable>

        <Text style={{ fontSize: 26, fontWeight: '800', color: t.text, marginBottom: 12 }}>{mod.title}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: t.cardBg,
              borderWidth: 1,
              borderColor: t.borderColor,
            }}
          >
            <Text style={{ color: t.text, fontSize: 12, fontWeight: '600' }}>{mod.duration}</Text>
          </View>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: t.cardBg,
              borderWidth: 1,
              borderColor: t.borderColor,
            }}
          >
            <Text style={{ color: t.text, fontSize: 12, fontWeight: '600' }}>
              {mod.type === 'video' ? 'Video' : 'Article'}
            </Text>
          </View>
        </View>

        {block && !locked ? (
          <MediaContentBlock block={block} moduleTitle={mod.title} />
        ) : (
          <View
            style={{
              padding: 20,
              borderRadius: 14,
              backgroundColor: t.cardBg,
              borderWidth: 1,
              borderColor: t.borderColor,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: t.accent, marginBottom: 8 }}>
              Content coming soon
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 22, color: t.text, opacity: 0.85 }}>
              {mod.description}
            </Text>
          </View>
        )}

        {!locked ? (
          <Pressable
            onPress={onComplete}
            style={{
              marginTop: 8,
              paddingVertical: 16,
              borderRadius: 12,
              backgroundColor: t.accent,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Text style={{ fontWeight: '800', color: t.isDark ? '#fff' : '#111' }}>Mark as Complete</Text>
            <Animated.View style={{ opacity: completeAnim, transform: [{ scale: completeAnim }] }}>
              <Ionicons name="checkmark-circle" size={24} color={t.accent} />
            </Animated.View>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  )
}
