import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Share,
  Alert,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  X,
  Sparkles,
  Fuel,
  Coffee,
  Camera,
  Bed,
  Flag,
  MapPin,
  CheckCircle2,
  Share2,
  Rocket,
} from 'lucide-react-native'
import { Colors, Radii, Spacing, Typography } from '@/theme/tokens'
import { AsphaltCard, PrimaryButton, SecondaryButton, Pill } from '@/components/ui'
import { generateAiRideItinerary } from '@/lib/aiPlanner'
import { useRevCrewStore } from '@/store/useRevCrewStore'
import { triggerHaptic } from '@/lib/haptics'
import type { AiRideItinerary, Difficulty } from '@/types'

const QUICK_ROUTES = [
  { origin: 'Chandigarh', dest: 'Spiti Valley', days: 4 },
  { origin: 'Manali', dest: 'Leh Ladakh', days: 3 },
  { origin: 'Mumbai', dest: 'Goa Coastal', days: 2 },
  { origin: 'Bengaluru', dest: 'Coorg Twisties', days: 1 },
]

export default function AiPlannerScreen() {
  const router = useRouter()
  const { createRide, saveItinerary } = useRevCrewStore()

  const [origin, setOrigin] = useState('Chandigarh')
  const [destination, setDestination] = useState('Spiti Valley')
  const [days, setDays] = useState(3)
  const [style, setStyle] = useState<Difficulty>('Spirited')
  const [ridersCount, setRidersCount] = useState('6')
  const [budgetTier, setBudgetTier] = useState<'Budget' | 'Balanced' | 'Premium'>('Balanced')
  const [loading, setLoading] = useState(false)
  const [itinerary, setItinerary] = useState<AiRideItinerary | null>(null)

  async function handleGenerate() {
    if (!origin.trim() || !destination.trim()) {
      Alert.alert('Enter route', 'Please specify both origin and destination.')
      return
    }
    triggerHaptic('medium')
    setLoading(true)
    try {
      const result = await generateAiRideItinerary({
        origin,
        destination,
        days,
        style,
        ridersCount: Number(ridersCount) || 6,
        budgetTier,
      })
      setItinerary(result)
      saveItinerary(result)
      triggerHaptic('success')
    } finally {
      setLoading(false)
    }
  }

  function handlePublishRide() {
    if (!itinerary) return
    const flatWaypoints = itinerary.days.flatMap((d) =>
      d.stops.map((s) => ({
        label: `Day ${d.day}: ${s.title}`,
        km: s.kmMark,
        note: `${s.time} • ${s.notes}`,
      }))
    )
    const created = createRide({
      title: itinerary.title,
      origin: itinerary.origin,
      destination: itinerary.destination,
      distanceKm: itinerary.totalDistanceKm,
      startTime: itinerary.bestDeparture,
      meetupLabel: `${itinerary.origin} Dawn Rollout`,
      difficulty: itinerary.ridingStyle,
      maxRiders: Math.max(8, Number(ridersCount) || 8),
      openToJoin: true,
      description: `AI-planned ${itinerary.durationLabel} itinerary. Est. ${itinerary.estimatedCostPerRider}.`,
      waypoints: flatWaypoints.slice(0, 8),
    })
    triggerHaptic('success')
    router.replace(`/ride/${created.id}`)
  }

  async function handleShareItinerary() {
    if (!itinerary) return
    const dayLines = itinerary.days
      .map(
        (d) =>
          `Day ${d.day}: ${d.headline} (${d.distanceKm} km)\n` +
          d.stops.map((s) => `  • ${s.time} — ${s.title} (${s.kmMark} km)`).join('\n')
      )
      .join('\n\n')
    try {
      await Share.share({
        message: `🏍️ ${itinerary.title}\n${itinerary.durationLabel} • ${itinerary.totalDistanceKm} km • ${itinerary.estimatedCostPerRider}\n\n${dayLines}\n\nPlanned with RevCrew AI`,
      })
    } catch {
      // Cancelled
    }
  }

  function renderStopIcon(type: string) {
    switch (type) {
      case 'fuel':
        return <Fuel size={15} color={Colors.amber} />
      case 'food':
        return <Coffee size={15} color={Colors.cyanLight} />
      case 'viewpoint':
        return <Camera size={15} color={Colors.green} />
      case 'stay':
        return <Bed size={15} color={Colors.gold} />
      case 'finish':
        return <Flag size={15} color={Colors.amberLight} />
      default:
        return <MapPin size={15} color={Colors.cyanLight} />
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Sparkles size={20} color={Colors.amber} />
          <Text style={Typography.title}>AI Ride Itinerary Planner</Text>
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
        {/* Quick Presets */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {QUICK_ROUTES.map((q) => (
            <Pressable
              key={q.dest}
              onPress={() => {
                triggerHaptic('selection')
                setOrigin(q.origin)
                setDestination(q.dest)
                setDays(q.days)
              }}
              style={styles.presetChip}
            >
              <Text style={styles.presetText}>
                {q.origin} → {q.dest}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Planner Form */}
        <AsphaltCard style={{ gap: 12 }}>
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Starting City</Text>
              <TextInput
                value={origin}
                onChangeText={setOrigin}
                placeholder="Origin"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Destination</Text>
              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder="Destination"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Duration (Days)</Text>
              <View style={styles.daysRow}>
                {[1, 2, 3, 4, 5].map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setDays(d)}
                    style={[styles.dayPill, days === d && styles.dayPillActive]}
                  >
                    <Text style={[styles.dayText, days === d && { color: Colors.amberLight }]}>
                      {d}D
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={{ width: 96 }}>
              <Text style={styles.label}>Riders</Text>
              <TextInput
                value={ridersCount}
                onChangeText={setRidersCount}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>

          <Text style={styles.label}>Riding Style</Text>
          <View style={styles.row3}>
            {(['Chill', 'Spirited', 'Hardcore'] as Difficulty[]).map((s) => (
              <SecondaryButton
                key={s}
                label={s}
                active={style === s}
                onPress={() => setStyle(s)}
                style={{ flex: 1, height: 38 }}
              />
            ))}
          </View>

          <Text style={styles.label}>Budget Tier</Text>
          <View style={styles.row3}>
            {(['Budget', 'Balanced', 'Premium'] as const).map((b) => (
              <SecondaryButton
                key={b}
                label={b}
                active={budgetTier === b}
                onPress={() => setBudgetTier(b)}
                style={{ flex: 1, height: 38 }}
              />
            ))}
          </View>

          <PrimaryButton
            label={loading ? 'Generating Full Itinerary...' : 'Generate AI Ride Plan'}
            icon={
              loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Sparkles size={18} color="#FFFFFF" />
              )
            }
            disabled={loading}
            onPress={() => void handleGenerate()}
            style={{ marginTop: 4 }}
          />
        </AsphaltCard>

        {/* Generated Itinerary Output */}
        {itinerary ? (
          <View style={{ gap: Spacing.md }}>
            <AsphaltCard highlighted style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Pill
                  label={itinerary.generatedBy === 'ai-api' ? 'AI GENERATED' : 'SMART ENGINE'}
                  tone="amber"
                />
                <Text style={Typography.monoSmall}>{itinerary.totalDistanceKm} KM TOTAL</Text>
              </View>

              <Text style={Typography.titleLarge}>{itinerary.title}</Text>
              <Text style={Typography.body}>
                {itinerary.durationLabel} • Best rollout: {itinerary.bestDeparture}
              </Text>
              <Text style={[Typography.mono, { color: Colors.cyanLight }]}>
                {itinerary.estimatedCostPerRider}
              </Text>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                <PrimaryButton
                  label="Publish as Open Ride"
                  icon={<Rocket size={16} color="#FFFFFF" />}
                  onPress={handlePublishRide}
                  style={{ flex: 1 }}
                />
                <SecondaryButton
                  label="Share"
                  icon={<Share2 size={16} color={Colors.cyanLight} />}
                  onPress={() => void handleShareItinerary()}
                />
              </View>
            </AsphaltCard>

            {/* Day-by-Day Schedule */}
            {itinerary.days.map((day) => (
              <AsphaltCard key={day.day} style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Pill label={`DAY ${day.day}`} tone="cyan" />
                  <Text style={Typography.caption}>
                    {day.distanceKm} km • {day.ridingHours}
                  </Text>
                </View>
                <Text style={Typography.headline}>{day.headline}</Text>

                <View style={{ gap: 10 }}>
                  {day.stops.map((stop, idx) => (
                    <View key={`${day.day}-${idx}`} style={styles.stopRow}>
                      <View style={styles.stopIconWrap}>{renderStopIcon(stop.type)}</View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={styles.stopTitle}>{stop.title}</Text>
                          <Text style={Typography.monoSmall}>{stop.time}</Text>
                        </View>
                        <Text style={Typography.bodySmall}>
                          {stop.kmMark} km mark • {stop.notes}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </AsphaltCard>
            ))}

            {/* Pre-Ride Checklist */}
            <AsphaltCard style={{ gap: 8 }}>
              <Text style={Typography.headline}>Pre-Ride Bike & Gear Checklist</Text>
              {itinerary.checklist.map((item) => (
                <View key={item} style={styles.checkRow}>
                  <CheckCircle2 size={15} color={Colors.green} />
                  <Text style={[Typography.body, { flex: 1 }]}>{item}</Text>
                </View>
              ))}
            </AsphaltCard>
          </View>
        ) : null}
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
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  presetText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.cyanLight,
  },
  twoCol: { flexDirection: 'row', gap: 10 },
  row3: { flexDirection: 'row', gap: 8 },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
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
  daysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayPill: {
    flex: 1,
    height: 40,
    borderRadius: Radii.sm,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillActive: {
    backgroundColor: Colors.amberSoft,
    borderColor: Colors.amberBorder,
  },
  dayText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  stopRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  stopIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    paddingRight: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
})
