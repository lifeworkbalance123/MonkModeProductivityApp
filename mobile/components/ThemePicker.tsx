import { useTheme, THEMES } from '@/context/ThemeContext'
import { useRouter } from 'expo-router'
import { useRef } from 'react'
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ThemePicker() {
  const { currentTheme, setTheme } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const scales = useRef(
    THEMES.reduce<Record<string, Animated.Value>>((acc, t) => {
      acc[t.id] = new Animated.Value(1)
      return acc
    }, {}),
  ).current

  const bounce = (id: string) => {
    const a = scales[id]
    if (!a) return
    Animated.sequence([
      Animated.spring(a, {
        toValue: 1.04,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(a, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start()
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: currentTheme.base }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
      }}
    >
      <View
        style={{
          paddingVertical: 16,
          paddingHorizontal: 14,
          borderRadius: 12,
          marginBottom: 20,
          backgroundColor: currentTheme.cardBg,
          borderWidth: 1,
          borderColor: currentTheme.borderColor,
        }}
      >
        <Text style={{ fontSize: 13, color: currentTheme.text, opacity: 0.8 }}>
          Your current persona
        </Text>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: currentTheme.accent,
            marginTop: 4,
          }}
        >
          {currentTheme.persona}
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 6 }}>
          <View
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              backgroundColor: currentTheme.base,
              borderWidth: 1,
              borderColor: currentTheme.borderColor,
            }}
          />
          <View
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              backgroundColor: currentTheme.text,
            }}
          />
          <View
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              backgroundColor: currentTheme.accent,
            }}
          />
        </View>
      </View>

      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: currentTheme.text,
          marginBottom: 12,
        }}
      >
        Choose a persona
      </Text>

      {THEMES.map((t) => {
        const active = t.id === currentTheme.id
        return (
          <Animated.View
            key={t.id}
            style={{
              transform: [{ scale: scales[t.id]! }],
              marginBottom: 14,
            }}
          >
            <Pressable
              onPress={() => {
                setTheme(t.id)
                bounce(t.id)
                setTimeout(() => router.back(), 380)
              }}
              style={{
                borderRadius: 14,
                padding: 16,
                backgroundColor: t.cardBg,
                borderWidth: active ? 2 : 1,
                borderColor: active ? t.accent : t.borderColor,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: '700',
                      color: t.text,
                    }}
                  >
                    {t.persona}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: t.text,
                      opacity: 0.75,
                      marginTop: 6,
                    }}
                  >
                    {t.tagline}
                  </Text>
                </View>
                {active ? (
                  <View
                    style={{
                      backgroundColor: t.accent,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: t.isDark ? '#fff' : '#111',
                      }}
                    >
                      Selected
                    </Text>
                  </View>
                ) : null}
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 14,
                  gap: 4,
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <View style={{ flex: 1, height: 28, backgroundColor: t.base }} />
                <View style={{ flex: 1, height: 28, backgroundColor: t.text }} />
                <View style={{ flex: 1, height: 28, backgroundColor: t.accent }} />
              </View>
            </Pressable>
          </Animated.View>
        )
      })}
    </ScrollView>
  )
}
