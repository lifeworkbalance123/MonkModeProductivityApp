import 'react-native-gesture-handler'

import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { AppState } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { View } from 'react-native'
import Toast from 'react-native-toast-message'
import { syncWidgetData } from '@/lib/widgetSync'
import { getWatchSessionManager } from '@/lib/watchSync'
import '../global.css'

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <BottomSheetModalProvider>
          <RootLayoutInner />
          <Toast />
        </BottomSheetModalProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}

function RootLayoutInner() {
  const { currentTheme, isDark } = useTheme()

  useEffect(() => {
    const watchSession = getWatchSessionManager()
    watchSession.startListening()
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncWidgetData('local-mobile-user')
        void watchSession.syncNow()
      }
    })
    void syncWidgetData('local-mobile-user')
    void watchSession.syncNow()
    return () => {
      sub.remove()
      watchSession.stopListening()
    }
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: currentTheme.base }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: currentTheme.base },
          headerStyle: { backgroundColor: currentTheme.cardBg },
          headerTintColor: currentTheme.text,
          headerTitleStyle: { color: currentTheme.text },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="training" options={{ headerShown: false }} />
        <Stack.Screen
          name="theme-picker"
          options={{
            title: 'Change persona',
            presentation: 'modal',
          }}
        />
      </Stack>
    </View>
  )
}
