import 'react-native-gesture-handler'

import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { View } from 'react-native'
import Toast from 'react-native-toast-message'
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
