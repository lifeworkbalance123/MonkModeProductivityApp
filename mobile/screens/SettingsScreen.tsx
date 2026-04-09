import { PersonaFeaturesSettings } from '@/components/PersonaFeaturesSettings'
import { useTheme } from '@/context/ThemeContext'
import { useRouter } from 'expo-router'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function SettingsScreen() {
  const { currentTheme } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: currentTheme.base }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 20,
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: '800', color: currentTheme.text, marginBottom: 20 }}>
        Settings
      </Text>

      <Text style={{ fontSize: 13, fontWeight: '700', color: currentTheme.accent, marginBottom: 8 }}>
        Your Persona
      </Text>
      <View
        style={{
          padding: 16,
          borderRadius: 14,
          backgroundColor: currentTheme.cardBg,
          borderWidth: 1,
          borderColor: currentTheme.borderColor,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '700', color: currentTheme.text }}>
          {currentTheme.persona}
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 6 }}>
          <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: currentTheme.base }} />
          <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: currentTheme.text }} />
          <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: currentTheme.accent }} />
        </View>
        <Pressable
          onPress={() => router.push('/theme-picker')}
          style={{
            marginTop: 16,
            paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: currentTheme.accent,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontWeight: '800',
              color: currentTheme.isDark ? '#FFFFFF' : '#111111',
            }}
          >
            Change Persona
          </Text>
        </Pressable>
      </View>

      <Text style={{ fontSize: 13, fontWeight: '700', color: currentTheme.accent, marginTop: 8, marginBottom: 8 }}>
        Persona Features
      </Text>
      <PersonaFeaturesSettings />

      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: currentTheme.accent,
          marginTop: 18,
          marginBottom: 8,
        }}
      >
        Home Screen Widget
      </Text>
      <View
        style={{
          padding: 16,
          borderRadius: 14,
          backgroundColor: currentTheme.cardBg,
          borderWidth: 1,
          borderColor: currentTheme.borderColor,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '700', color: currentTheme.text, marginBottom: 10 }}>
          Add MonkMode to your home screen
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <View
            style={{
              flex: 1,
              minHeight: 120,
              borderRadius: 14,
              backgroundColor: '#111827',
              borderWidth: 1,
              borderColor: '#1F2937',
              padding: 10,
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: '#F59E0B', fontSize: 20 }}>🔥</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '800' }}>12</Text>
            <Text style={{ color: '#F59E0B', fontSize: 11 }}>Day streak</Text>
          </View>
          <View
            style={{
              flex: 1.4,
              minHeight: 120,
              borderRadius: 14,
              backgroundColor: '#111827',
              borderWidth: 1,
              borderColor: '#1F2937',
              padding: 10,
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: '#F59E0B', fontSize: 11 }}>Habits today</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '800' }}>4 / 6</Text>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: '#374151', overflow: 'hidden' }}>
              <View style={{ width: '66%', height: 6, borderRadius: 3, backgroundColor: '#F59E0B' }} />
            </View>
            <Text style={{ color: '#9CA3AF', fontSize: 10 }} numberOfLines={1}>
              Top goal: Deep work block
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 13, fontWeight: '700', color: currentTheme.text, marginBottom: 6 }}>
          iOS
        </Text>
        <Text style={{ color: currentTheme.text, opacity: 0.75, fontSize: 12, lineHeight: 18 }}>
          1. Long press on your home screen{'\n'}
          2. Tap the + button (top left){'\n'}
          3. Search for "MonkMode"{'\n'}
          4. Choose Small or Medium size{'\n'}
          5. Tap Add Widget
        </Text>

        <Text style={{ fontSize: 13, fontWeight: '700', color: currentTheme.text, marginTop: 10, marginBottom: 6 }}>
          Android
        </Text>
        <Text style={{ color: currentTheme.text, opacity: 0.75, fontSize: 12, lineHeight: 18 }}>
          1. Long press on your home screen{'\n'}
          2. Tap Widgets{'\n'}
          3. Find MonkMode in the list{'\n'}
          4. Drag to your home screen
        </Text>
      </View>

      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: currentTheme.accent,
          marginTop: 8,
          marginBottom: 8,
        }}
      >
        Apple Watch & Wear OS
      </Text>
      <View
        style={{
          padding: 16,
          borderRadius: 14,
          backgroundColor: currentTheme.cardBg,
          borderWidth: 1,
          borderColor: currentTheme.borderColor,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: '700', color: currentTheme.text, marginBottom: 10 }}>
          MonkMode is available on Apple Watch and Wear OS.
        </Text>
        <Text style={{ color: currentTheme.text, opacity: 0.75, fontSize: 12, lineHeight: 18 }}>
          iOS: Open the Watch app on your iPhone and install MonkMode.{'\n'}
          Android: The MonkMode Wear OS app installs automatically when you install the Android app.
        </Text>
        <View
          style={{
            marginTop: 12,
            alignSelf: 'flex-start',
            backgroundColor: '#F59E0B22',
            borderColor: '#F59E0B55',
            borderWidth: 1,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '800' }}>
            PRO: Habit sync on watch
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}
