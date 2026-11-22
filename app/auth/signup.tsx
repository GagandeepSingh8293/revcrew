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
import {
  ArrowLeft,
  User,
  AtSign,
  Bike,
  MapPin,
  Mail,
  Lock,
  CheckCircle2,
} from 'lucide-react-native'
import { Colors, Radii, Spacing, Typography } from '@/theme/tokens'
import { PrimaryButton } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useRevCrewStore } from '@/store/useRevCrewStore'
import { triggerHaptic } from '@/lib/haptics'

export default function SignUpScreen() {
  const router = useRouter()
  const { completeAuth } = useRevCrewStore()

  const [fullName, setFullName] = useState('')
  const [handle, setHandle] = useState('')
  const [bike, setBike] = useState('')
  const [city, setCity] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSignUp() {
    setErrorMsg('')
    const cleanEmail = email.trim().toLowerCase()
    const cleanName = fullName.trim()
    const cleanHandle = (handle.trim() || cleanName.toLowerCase().replace(/\s+/g, '_')).replace(
      /^@?/,
      '@'
    )

    if (!cleanName || !cleanEmail || password.length < 6) {
      setErrorMsg('Please enter your name, email, and a password (min 6 characters).')
      return
    }

    triggerHaptic('medium')
    setLoading(true)
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanName,
              handle: cleanHandle,
              bike: bike.trim() || 'Touring Motorcycle',
              city: city.trim() || 'India',
            },
          },
        })
        if (error) {
          setErrorMsg(error.message)
          return
        }

        // Create profile row if session is immediately active
        if (data.user && data.session) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            handle: cleanHandle,
            full_name: cleanName,
            bike: bike.trim() || 'Touring Motorcycle',
            city: city.trim() || 'India',
            country: 'India',
          })
        }

        completeAuth({
          mode: 'supabase',
          email: cleanEmail,
          fullName: cleanName,
          handle: cleanHandle,
          bike: bike.trim() || 'Touring Motorcycle',
          city: city.trim() || 'India',
        })
      } else {
        completeAuth({
          mode: 'demo',
          email: cleanEmail,
          fullName: cleanName,
          handle: cleanHandle,
          bike: bike.trim() || 'Touring Motorcycle',
          city: city.trim() || 'India',
        })
      }
      triggerHaptic('success')
      router.replace('/(tabs)/home')
    } catch (e: any) {
      setErrorMsg(e?.message || 'Unable to create rider account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.text} />
        </Pressable>
        <Text style={Typography.headline}>Create Rider Account</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={Typography.title}>Join the RevCrew Pack</Text>
            <Text style={[Typography.bodySmall, { marginBottom: 14 }]}>
              Set up your rider profile & primary motorcycle to join open rides
            </Text>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrap}>
              <User size={17} color={Colors.textMuted} />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Gagan Singh"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Rider Handle</Text>
            <View style={styles.inputWrap}>
              <AtSign size={17} color={Colors.textMuted} />
              <TextInput
                value={handle}
                onChangeText={setHandle}
                placeholder="gagan_rev"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Primary Motorcycle</Text>
            <View style={styles.inputWrap}>
              <Bike size={17} color={Colors.amber} />
              <TextInput
                value={bike}
                onChangeText={setBike}
                placeholder="e.g. Royal Enfield Himalayan 450"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Home City</Text>
            <View style={styles.inputWrap}>
              <MapPin size={17} color={Colors.cyanLight} />
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Chandigarh"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrap}>
              <Mail size={17} color={Colors.textMuted} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="rider@revcrew.app"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Password (min 6 characters)</Text>
            <View style={styles.inputWrap}>
              <Lock size={17} color={Colors.textMuted} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create a strong password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <PrimaryButton
              label={loading ? 'Creating Profile...' : 'Create Rider Account'}
              icon={
                loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <CheckCircle2 size={18} color="#FFFFFF" />
                )
              }
              disabled={loading}
              onPress={() => void handleSignUp()}
              style={{ marginTop: 18 }}
            />
          </View>

          <View style={styles.footerRow}>
            <Text style={Typography.body}>Already have an account?</Text>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text style={styles.linkText}>Sign In</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.lg,
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
    marginBottom: 10,
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
    height: 46,
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
