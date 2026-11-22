import React, { useEffect } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter'
import {
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk'
import { Colors, Radii, Spacing } from '@/theme/tokens'

void SplashScreen.preventAutoHideAsync()

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected error' }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorScreen}>
          <Text style={styles.errorTitle}>RevCrew recovered from an error</Text>
          <Text style={styles.errorMsg}>{this.state.message}</Text>
          <Pressable
            onPress={() => this.setState({ hasError: false, message: '' })}
            style={styles.retryBtn}
          >
            <Text style={styles.retryText}>Tap to Retry</Text>
          </Pressable>
        </View>
      )
    }
    return this.props.children
  }
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar style="light" />
      <AppErrorBoundary>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="ai-planner" options={{ presentation: 'modal' }} />
          <Stack.Screen name="banner-studio" options={{ presentation: 'modal' }} />
          <Stack.Screen name="chat/[channelId]" />
          <Stack.Screen name="ride/[id]" />
        </Stack>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  errorScreen: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.amber,
    textAlign: 'center',
  },
  errorMsg: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: Colors.amber,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: Radii.pill,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
})
