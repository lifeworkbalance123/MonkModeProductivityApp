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
    </ScrollView>
  )
}
