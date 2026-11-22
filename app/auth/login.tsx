import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Mail, Lock, Eye, EyeOff, Flame, ArrowRight, Sparkles } from 'lucide-react-native'
import { Colors, Radii, Spacing, Typography } from '@/theme/tokens'
import { PrimaryButton, SecondaryButton } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useRevCrewStore } from '@/store/useRevCrewStore'
import { triggerHaptic } from '@/lib/haptics'

export default function LoginScreen() {
  const router = useRouter()
  const { completeAuth } = useRevCrewStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleLogin() {
    setErrorMsg('')
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter your email and password.')
      return
    }
    triggerHaptic('medium')
    setLoading(true)
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })
        if (error) {
          setErrorMsg(error.message)
          return
        }
        const userMeta = data.user?.user_metadata || {}
        completeAuth({
          mode: 'supabase',
          email: cleanEmail,
          fullName: userMeta.full_name || cleanEmail.split('@')[0],
          handle: userMeta.handle || `@${cleanEmail.split('@')[0]}`,
          bike: userMeta.bike || 'Adventure Tourer',
          city: userMeta.city || 'India',
        })
      } else {
        completeAuth({
          mode: 'demo',
          email: cleanEmail,
          fullName: cleanEmail.split('@')[0],
          handle: `@${cleanEmail.split('@')[0]}`,
        })
      }
      triggerHaptic('success')
      router.replace('/(tabs)/home')
    } catch (e: any) {
      setErrorMsg(e?.message || 'Unable to sign in right now.')
    } finally {
      setLoading(false)
    }
  }

  function handleDemoAccess() {
    triggerHaptic('light')
    completeAuth({
      mode: 'demo',
      email: 'rider@revcrew.app',
      fullName: 'Gagan Singh',
      handle: '@gagan_rev',
      bike: 'Triumph Tiger 900 Rally Pro',
      city: 'Chandigarh',
    })
    router.replace('/(tabs)/home')
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Emblem */}
          <View style={styles.brandBlock}>
            <LinearGradient
              colors={['#FF6B1A', '#06B6D4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoRing}
            >
              <View style={styles.logoInner}>
                <Flame size={34} color={Colors.amber} />
              </View>
            </LinearGradient>

            <View style={styles.brandRow}>
              <Text style={styles.brandWord}>REV</Text>
              <Text style={[styles.brandWord, { color: Colors.amber }]}>CREW</Text>
            </View>
            <Text style={styles.subtitle}>
              Pack Connected • Live Radar • AI Ride Planning
            </Text>
          </View>

          {/* Login Form Card */}
          <View style={styles.card}>
            <Text style={Typography.title}>Rider Sign In</Text>
            <Text style={[Typography.bodySmall, { marginBottom: 16 }]}>
              Sign in with your RevCrew account to sync rides, chats & live GPS
            </Text>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrap}>
              <Mail size={18} color={Colors.textMuted} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="rider@revcrew.app"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} color={Colors.textMuted} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={styles.input}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                {showPassword ? (
                  <EyeOff size={18} color={Colors.textSecondary} />
                ) : (
                  <Eye size={18} color={Colors.textSecondary} />
                )}
              </Pressable>
            </View>

            <PrimaryButton
              label={loading ? 'Signing In...' : 'Sign In to RevCrew'}
              icon={
                loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ArrowRight size={18} color="#FFFFFF" />
                )
              }
              disabled={loading}
              onPress={() => void handleLogin()}
              style={{ marginTop: 18 }}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={Typography.caption}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <SecondaryButton
              label="Continue as Guest Rider (Instant Demo)"
              icon={<Sparkles size={16} color={Colors.cyanLight} />}
              onPress={handleDemoAccess}
            />
          </View>

          {/* Footer Sign Up link */}
          <View style={styles.footerRow}>
            <Text style={Typography.body}>New to the pack?</Text>
            <Pressable onPress={() => router.push('/auth/signup')} hitSlop={8}>
              <Text style={styles.linkText}>Create Rider Account →</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  brandBlock: {
    alignItems: 'center',
    gap: 8,
  },
  logoRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    padding: 3,
    marginBottom: 4,
  },
  logoInner: {
    flex: 1,
    borderRadius: 36,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandWord: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.xl,
  },
  errorBox: {
    backgroundColor: Colors.redSoft,
    borderWidth: 1,
    borderColor: Colors.redBorder,
    borderRadius: Radii.sm,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#FCA5A5',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: Radii.sm,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    fontWeight: '700',
    color: Colors.amber,
  },
})
