import { useTheme } from '@/context/ThemeContext'
import { maybeHapticSuccess } from '@/lib/haptics'
import { getBodyFontFamily, getDisplayFontFamily } from '@/lib/theme-fonts'
import { useEffect, useRef, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Svg, { Circle, G } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const FOCUS_SECONDS = 25 * 60
const R = 88
const CIRC = 2 * Math.PI * R

export default function FocusScreen() {
  const { currentTheme } = useTheme()
  const insets = useSafeAreaInsets()
  const [remaining, setRemaining] = useState(FOCUS_SECONDS)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const firedRef = useRef(false)

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    return () => clearTimer()
  }, [])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          setRunning(false)
          if (!firedRef.current) {
            firedRef.current = true
            void maybeHapticSuccess()
          }
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearTimer()
  }, [running])

  const dashOffset =
    FOCUS_SECONDS > 0 ? CIRC * (1 - remaining / FOCUS_SECONDS) : CIRC

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const displayFont = getDisplayFontFamily(currentTheme)
  const bodyFont = getBodyFontFamily(currentTheme)

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: currentTheme.base,
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 24,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: displayFont,
          fontSize: 24,
          fontWeight: '700',
          color: currentTheme.text,
          marginBottom: 8,
        }}
      >
        Deep focus
      </Text>
      <Text
        style={{
          fontFamily: bodyFont,
          fontSize: 14,
          color: currentTheme.text,
          opacity: 0.65,
          marginBottom: 32,
          textAlign: 'center',
        }}
      >
        25-minute block. Timer ring uses your accent colour.
      </Text>

      <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={220} height={220} style={{ position: 'absolute' }}>
          <Circle
            cx={110}
            cy={110}
            r={R}
            stroke={currentTheme.borderColor}
            strokeWidth={10}
            fill="none"
          />
          <G transform="rotate(-90 110 110)">
            <Circle
              cx={110}
              cy={110}
              r={R}
              stroke={currentTheme.accent}
              strokeWidth={10}
              fill="none"
              strokeDasharray={`${CIRC}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </G>
        </Svg>
        <Text
          style={{
            fontFamily: displayFont,
            fontSize: 36,
            fontWeight: '700',
            color: currentTheme.text,
          }}
        >
          {fmt(remaining)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 36 }}>
        <Pressable
          onPress={() => {
            if (remaining === 0) {
              setRemaining(FOCUS_SECONDS)
              firedRef.current = false
            }
            setRunning((r) => !r)
          }}
          style={{
            paddingVertical: 14,
            paddingHorizontal: 28,
            borderRadius: 12,
            backgroundColor: currentTheme.accent,
          }}
        >
          <Text
            style={{
              fontFamily: bodyFont,
              fontWeight: '700',
              color: currentTheme.isDark ? '#fff' : '#111',
            }}
          >
            {running ? 'Pause' : remaining === 0 ? 'Restart' : 'Start'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            clearTimer()
            setRunning(false)
            setRemaining(FOCUS_SECONDS)
            firedRef.current = false
          }}
          style={{
            paddingVertical: 14,
            paddingHorizontal: 28,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: currentTheme.borderColor,
            backgroundColor: currentTheme.cardBg,
          }}
        >
          <Text style={{ fontFamily: bodyFont, fontWeight: '600', color: currentTheme.text }}>
            Reset
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
