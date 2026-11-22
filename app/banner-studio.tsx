import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Share,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import ViewShot from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'
import {
  X,
  Flag,
  Shield,
  Zap,
  Compass,
  Flame,
  Feather,
  Share2,
  MapPin,
  Users,
} from 'lucide-react-native'
import { Colors, Radii, Spacing, Typography } from '@/theme/tokens'
import { AsphaltCard, PrimaryButton, SecondaryButton } from '@/components/ui'
import { useRevCrewStore } from '@/store/useRevCrewStore'
import { triggerHaptic } from '@/lib/haptics'

const THEMES: Array<{ id: string; label: string; colors: [string, string]; accent: string }> = [
  { id: 'amber', label: 'Asphalt Amber', colors: ['#1C120C', '#9A3412'], accent: '#FF6B1A' },
  { id: 'cyan', label: 'Electric Cyan', colors: ['#0B1726', '#0E7490'], accent: '#06B6D4' },
  { id: 'hybrid', label: 'RevCrew Dual', colors: ['#7C2D12', '#0E7490'], accent: '#FF8A4C' },
  { id: 'crimson', label: 'Apex Crimson', colors: ['#1F0A10', '#9F1239'], accent: '#F43F5E' },
  { id: 'emerald', label: 'Mountain ADV', colors: ['#06241B', '#065F46'], accent: '#10B981' },
]

const EMBLEMS = [
  { id: 'shield', label: 'Shield', Icon: Shield },
  { id: 'flame', label: 'Flame', Icon: Flame },
  { id: 'bolt', label: 'Bolt', Icon: Zap },
  { id: 'compass', label: 'Compass', Icon: Compass },
  { id: 'wings', label: 'Wings', Icon: Feather },
] as const

export default function BannerStudioScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ crewId?: string }>()
  const crews = useRevCrewStore((s) => s.crews)
  const initialCrew = crews.find((c) => c.id === params.crewId) || crews[0]

  const viewShotRef = useRef<React.ComponentRef<typeof ViewShot>>(null)

  const [crewName, setCrewName] = useState(initialCrew?.name || 'Shivalik Apex Pack')
  const [tagline, setTagline] = useState(
    initialCrew?.tagline || 'Dawn Runs • Twisties • Zero Riders Left Behind'
  )
  const [city, setCity] = useState(`${initialCrew?.city || 'Chandigarh'}, ${initialCrew?.country || 'India'}`)
  const [founded, setFounded] = useState(initialCrew?.founded || '2021')
  const [callout, setCallout] = useState('SUNDAY SUNRISE RUN • OPEN TO JOIN')
  const [themeId, setThemeId] = useState('hybrid')
  const [emblemId, setEmblemId] = useState<(typeof EMBLEMS)[number]['id']>('shield')
  const [aspect, setAspect] = useState<'wide' | 'poster'>('poster')

  const activeTheme = THEMES.find((t) => t.id === themeId) || THEMES[0]
  const activeEmblem = EMBLEMS.find((e) => e.id === emblemId) || EMBLEMS[0]
  const EmblemIcon = activeEmblem.Icon

  async function handleExportAndShare() {
    triggerHaptic('success')
    try {
      if (Platform.OS !== 'web' && viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture()
        const canShare = await Sharing.isAvailableAsync()
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: `Share ${crewName} Crew Banner`,
          })
          return
        }
      }
      await Share.share({
        message: `🏍️ ${crewName.toUpperCase()} (Est. ${founded})\n${tagline}\n📍 ${city}\n🔥 ${callout}\n\nJoin our riding pack on RevCrew!`,
      })
    } catch {
      Alert.alert('Banner ready', 'Your crew banner has been prepared to share.')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Flag size={20} color={Colors.amber} />
          <Text style={Typography.title}>Crew Banner Studio</Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Live Exportable Banner Preview */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1 }}
          style={styles.shotWrapper}
        >
          <LinearGradient
            colors={activeTheme.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.bannerCanvas,
              aspect === 'wide' ? { minHeight: 200 } : { minHeight: 300 },
            ]}
          >
            {/* Corner badge & Est year */}
            <View style={styles.bannerTopRow}>
              <View style={[styles.estPill, { borderColor: activeTheme.accent }]}>
                <Text style={[styles.estText, { color: activeTheme.accent }]}>
                  EST. {founded || '2026'}
                </Text>
              </View>
              <Text style={styles.watermark}>REVCREW OFFICIAL</Text>
            </View>

            {/* Center Emblem + Crew Identity */}
            <View style={styles.bannerCenter}>
              <View
                style={[
                  styles.emblemRing,
                  {
                    borderColor: activeTheme.accent,
                    backgroundColor: 'rgba(8,9,12,0.55)',
                  },
                ]}
              >
                <EmblemIcon size={34} color={activeTheme.accent} />
              </View>
              <Text style={styles.bannerCrewName}>{crewName.toUpperCase() || 'YOUR CREW'}</Text>
              <Text style={styles.bannerTagline}>{tagline}</Text>
            </View>

            {/* Bottom Callout Bar */}
            <View style={styles.bannerBottom}>
              <View style={styles.bannerMetaRow}>
                <View style={styles.bannerMetaChip}>
                  <MapPin size={12} color="#FFFFFF" />
                  <Text style={styles.bannerMetaText}>{city}</Text>
                </View>
                <View style={styles.bannerMetaChip}>
                  <Users size={12} color="#FFFFFF" />
                  <Text style={styles.bannerMetaText}>OPEN PACK</Text>
                </View>
              </View>
              {callout.trim() ? (
                <View style={[styles.calloutStrip, { backgroundColor: activeTheme.accent }]}>
                  <Text style={styles.calloutText}>{callout.toUpperCase()}</Text>
                </View>
              ) : null}
            </View>
          </LinearGradient>
        </ViewShot>

        {/* Share / Export Primary CTA */}
        <PrimaryButton
          label="Export & Share Crew Banner"
          icon={<Share2 size={18} color="#FFFFFF" />}
          onPress={() => void handleExportAndShare()}
        />

        {/* Customization Controls */}
        <AsphaltCard style={{ gap: 12 }}>
          <Text style={styles.sectionLabel}>Layout Format</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <SecondaryButton
              label="Poster Card"
              active={aspect === 'poster'}
              onPress={() => setAspect('poster')}
              style={{ flex: 1, height: 38 }}
            />
            <SecondaryButton
              label="Wide Banner"
              active={aspect === 'wide'}
              onPress={() => setAspect('wide')}
              style={{ flex: 1, height: 38 }}
            />
          </View>

          <Text style={styles.sectionLabel}>Color Theme</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {THEMES.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => {
                  triggerHaptic('selection')
                  setThemeId(t.id)
                }}
                style={[
                  styles.themeChip,
                  themeId === t.id && { borderColor: t.accent, backgroundColor: `${t.accent}22` },
                ]}
              >
                <View style={[styles.themeDot, { backgroundColor: t.accent }]} />
                <Text style={styles.themeText}>{t.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.sectionLabel}>Crew Crest Emblem</Text>
          <View style={styles.emblemRow}>
            {EMBLEMS.map((e) => {
              const IconComp = e.Icon
              const active = emblemId === e.id
              return (
                <Pressable
                  key={e.id}
                  onPress={() => {
                    triggerHaptic('selection')
                    setEmblemId(e.id)
                  }}
                  style={[styles.emblemChip, active && styles.emblemChipActive]}
                >
                  <IconComp size={18} color={active ? Colors.amber : Colors.textSecondary} />
                  <Text style={[styles.emblemLabel, active && { color: Colors.amberLight }]}>
                    {e.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <Text style={styles.sectionLabel}>Crew Name</Text>
          <TextInput
            value={crewName}
            onChangeText={setCrewName}
            style={styles.input}
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.sectionLabel}>Tagline / Motto</Text>
          <TextInput
            value={tagline}
            onChangeText={setTagline}
            style={styles.input}
            placeholderTextColor={Colors.textMuted}
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionLabel}>City / Region</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                style={styles.input}
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={{ width: 96 }}>
              <Text style={styles.sectionLabel}>Founded</Text>
              <TextInput
                value={founded}
                onChangeText={setFounded}
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>Ride Callout Ribbon</Text>
          <TextInput
            value={callout}
            onChangeText={setCallout}
            style={styles.input}
            placeholder="e.g. SUNDAY DAWN RUN • OPEN TO JOIN"
            placeholderTextColor={Colors.textMuted}
          />
        </AsphaltCard>
      </ScrollView>
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 48,
    gap: Spacing.md,
  },
  shotWrapper: {
    borderRadius: Radii.card,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  bannerCanvas: {
    padding: Spacing.xl,
    justifyContent: 'space-between',
    gap: 18,
  },
  bannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  estText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  watermark: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.72)',
  },
  bannerCenter: {
    alignItems: 'center',
    gap: 8,
  },
  emblemRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCrewName: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1.4,
  },
  bannerTagline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.86)',
    textAlign: 'center',
  },
  bannerBottom: {
    gap: 10,
  },
  bannerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
  bannerMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bannerMetaText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  calloutStrip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.sm,
    alignItems: 'center',
  },
  calloutText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  themeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  themeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.text,
  },
  emblemRow: {
    flexDirection: 'row',
    gap: 6,
  },
  emblemChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  emblemChipActive: {
    backgroundColor: Colors.amberSoft,
    borderColor: Colors.amberBorder,
  },
  emblemLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
  },
})
