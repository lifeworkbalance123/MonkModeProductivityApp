import { MediaUploadForm } from '@/components/MediaUploadForm'
import { TrainingCard } from '@/components/TrainingCard'
import { useTheme } from '@/context/ThemeContext'
import {
  getCompletedModuleIdsToday,
  getTrainingModules,
  type TrainingModuleRow,
} from '@/services/db'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
} from '@gorhom/bottom-sheet'
import { router, useFocusEffect } from 'expo-router'
import { BookOpen, Zap } from 'lucide-react-native'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function TrainingScreen() {
  const { currentTheme: t } = useTheme()
  const insets = useSafeAreaInsets()
  const [modules, setModules] = useState<TrainingModuleRow[]>([])
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const sheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['90%'], [])

  const refresh = useCallback(async () => {
    const [m, c] = await Promise.all([getTrainingModules(), getCompletedModuleIdsToday()])
    setModules(m)
    setCompleted(c)
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh]),
  )

  const openSheet = () => sheetRef.current?.present()
  const closeSheet = () => sheetRef.current?.dismiss()

  return (
    <View style={{ flex: 1, backgroundColor: t.base, paddingTop: insets.top + 16 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: t.borderColor,
              backgroundColor: t.cardBg,
              marginBottom: 12,
            }}
          >
            <BookOpen size={16} color={t.accent} />
            <Text style={{ marginLeft: 8, fontSize: 13, color: t.text, opacity: 0.8 }}>Training Hub</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: t.text, marginBottom: 8 }}>
            Learn. Grow. Transform.
          </Text>
          <Text style={{ fontSize: 15, color: t.text, opacity: 0.7, lineHeight: 22 }}>
            Curated productivity techniques, habits, and personal development. New content added weekly.
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
          {modules.map((m) => (
            <View key={m.id} style={{ width: '48%' }}>
              <TrainingCard
                module={m}
                completedToday={completed.has(m.id)}
                onPress={() => {
                  router.push(`/training/${m.id}`)
                }}
              />
            </View>
          ))}
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View
            style={{
              padding: 20,
              borderRadius: 14,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: t.borderColor,
              backgroundColor: t.cardBg,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: t.cardBg,
                  borderWidth: 1,
                  borderColor: t.borderColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={24} color={t.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: t.text, marginBottom: 6 }}>
                  Create Your Own Training Content
                </Text>
                <Text style={{ fontSize: 13, color: t.text, opacity: 0.7, marginBottom: 14 }}>
                  Upload videos, images, and text to build your personal motivation library.
                </Text>
                <Pressable
                  onPress={openSheet}
                  style={{
                    alignSelf: 'flex-start',
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 10,
                    backgroundColor: t.accent,
                  }}
                >
                  <Text style={{ fontWeight: '800', color: t.isDark ? '#fff' : '#111' }}>Upload Content</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        handleIndicatorStyle={{ backgroundColor: t.borderColor }}
        backgroundStyle={{ backgroundColor: t.cardBg }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
        )}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <View style={{ flex: 1, minHeight: 400 }}>
        <MediaUploadForm
          onSaved={() => {
            Toast.show({
              type: 'success',
              text1: 'Content block saved.',
              text2: 'It will appear in the next module you assign it to.',
            })
          }}
          onClose={closeSheet}
        />
        </View>
      </BottomSheetModal>
    </View>
  )
}
