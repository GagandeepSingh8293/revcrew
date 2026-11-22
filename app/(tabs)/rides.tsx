import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Share,
  Alert,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Sparkles,
  Plus,
  MapPin,
  Clock,
  Share2,
  CheckCircle2,
  Navigation,
  Users,
} from 'lucide-react-native'
import { Colors, Radii, Spacing, Typography } from '@/theme/tokens'
import {
  AsphaltCard,
  PrimaryButton,
  SecondaryButton,
  Pill,
  AvatarStack,
  ModalSheet,
} from '@/components/ui'
import { useRevCrewStore } from '@/store/useRevCrewStore'
import { triggerHaptic } from '@/lib/haptics'
import type { Difficulty } from '@/types'

export default function RidesScreen() {
  const router = useRouter()
  const { rides, riders, currentUserId, toggleJoinRide, createRide } = useRevCrewStore()

  const [scope, setScope] = useState<'all' | 'Near Me' | 'Global'>('all')
  const [openOnly, setOpenOnly] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  // New ride plan state
  const [title, setTitle] = useState('')
  const [origin, setOrigin] = useState('Chandigarh')
  const [destination, setDestination] = useState('')
  const [distanceKm, setDistanceKm] = useState('140')
  const [startTime, setStartTime] = useState('Sun • 05:45 AM')
  const [meetupLabel, setMeetupLabel] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('Spirited')
  const [maxRiders, setMaxRiders] = useState('12')
  const [openToJoin, setOpenToJoin] = useState(true)
  const [description, setDescription] = useState('')

  const riderById = (id: string) => riders.find((r) => r.id === id) || riders[0]

  const filteredRides = useMemo(() => {
    return rides.filter((r) => {
      if (scope !== 'all' && r.regionScope !== scope) return false
      if (openOnly && !r.openToJoin) return false
      return true
    })
  }, [rides, scope, openOnly])

  function handleCreateRide() {
    if (!title.trim() || !destination.trim()) {
      Alert.alert('Missing details', 'Please enter a ride title and destination.')
      return
    }
    const created = createRide({
      title,
      origin: origin || 'Current City',
      destination,
      distanceKm: Number(distanceKm) || 120,
      startTime,
      meetupLabel: meetupLabel || `${origin} Meetup Plaza`,
      difficulty,
      maxRiders: Number(maxRiders) || 12,
      openToJoin,
      description,
    })
    triggerHaptic('success')
    setCreateOpen(false)
    setTitle('')
    setDestination('')
    setDescription('')
    router.push(`/ride/${created.id}`)
  }

  async function handleShareRide(ride: (typeof rides)[number]) {
    try {
      await Share.share({
        message: `🏍️ ${ride.title}\nRoute: ${ride.routeSummary} (${ride.distanceKm} km)\nStart: ${ride.startTime}\nMeetup: ${ride.meetupLabel}\nStatus: ${ride.openToJoin ? 'OPEN TO JOIN' : 'Invite Only'} (${ride.participantIds.length}/${ride.maxRiders} riders)\n\nJoin on RevCrew!`,
      })
    } catch {
      // Cancelled
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={Typography.titleLarge}>Nearby & Global Rides</Text>
            <Text style={Typography.bodySmall}>
              Discover open rides or publish your own pack plan
            </Text>
          </View>
          <Pressable
            onPress={() => {
              triggerHaptic('light')
              setCreateOpen(true)
            }}
            style={styles.createBtn}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.createBtnText}>Plan</Text>
          </Pressable>
        </View>

        {/* AI Ride Itinerary Planner Callout */}
        <Pressable onPress={() => router.push('/ai-planner')}>
          <LinearGradient
            colors={['rgba(255,107,26,0.22)', 'rgba(6,182,212,0.18)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiBanner}
          >
            <View style={styles.aiIconBox}>
              <Sparkles size={22} color={Colors.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={Typography.headline}>AI Ride Itinerary Planner</Text>
              <Text style={Typography.bodySmall}>
                Generate a full route with fuel, food stops & packing checklist
              </Text>
            </View>
            <Text style={styles.aiArrow}>Try →</Text>
          </LinearGradient>
        </Pressable>

        {/* Scope & Open-To-Join Filters */}
        <View style={styles.filterRow}>
          {(['all', 'Near Me', 'Global'] as const).map((item) => (
            <Pressable
              key={item}
              onPress={() => {
                triggerHaptic('selection')
                setScope(item)
              }}
              style={[styles.filterChip, scope === item && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  scope === item && styles.filterChipTextActive,
                ]}
              >
                {item === 'all' ? 'All Rides' : item}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              triggerHaptic('selection')
              setOpenOnly((v) => !v)
            }}
            style={[styles.filterChip, openOnly && styles.openChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                openOnly && { color: Colors.green, fontWeight: '700' },
              ]}
            >
              Open to Join
            </Text>
          </Pressable>
        </View>

        {/* Ride Plan Cards */}
        {filteredRides.map((ride) => {
          const isJoined = ride.participantIds.includes(currentUserId)
          const spotsLeft = Math.max(0, ride.maxRiders - ride.participantIds.length)
          return (
            <AsphaltCard key={ride.id} style={styles.rideCard}>
              <Pressable onPress={() => router.push(`/ride/${ride.id}`)}>
                <View style={styles.rideTopRow}>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {ride.openToJoin ? (
                      <Pill
                        label={spotsLeft > 0 ? `OPEN TO JOIN • ${spotsLeft} LEFT` : 'PACK FULL'}
                        tone={spotsLeft > 0 ? 'green' : 'red'}
                      />
                    ) : (
                      <Pill label="CLOSED PACK" tone="neutral" />
                    )}
                    <Pill label={ride.difficulty.toUpperCase()} tone="amber" />
                  </View>
                  <Text style={Typography.monoSmall}>
                    {ride.regionScope === 'Near Me'
                      ? `${ride.distanceFromYouKm} km away`
                      : 'GLOBAL'}
                  </Text>
                </View>

                <Text style={[Typography.title, { marginTop: 10 }]}>{ride.title}</Text>
                <Text style={[Typography.body, { marginTop: 2 }]}>{ride.routeSummary}</Text>

                <View style={styles.metaGrid}>
                  <View style={styles.metaItem}>
                    <Clock size={14} color={Colors.amber} />
                    <Text style={Typography.caption}>{ride.startTime}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Navigation size={14} color={Colors.cyanLight} />
                    <Text style={Typography.caption}>{ride.distanceKm} km</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MapPin size={14} color={Colors.textSecondary} />
                    <Text style={Typography.caption} numberOfLines={1}>
                      {ride.meetupLabel}
                    </Text>
                  </View>
                </View>
              </Pressable>

              <View style={styles.rideFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AvatarStack
                    names={ride.participantIds.map((id) => riderById(id).fullName)}
                    accents={ride.participantIds.map((id) => riderById(id).accent)}
                  />
                  <Text style={Typography.caption}>
                    {ride.participantIds.length}/{ride.maxRiders}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => void handleShareRide(ride)}
                    style={styles.iconActionBtn}
                  >
                    <Share2 size={17} color={Colors.cyanLight} />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      triggerHaptic('medium')
                      toggleJoinRide(ride.id)
                    }}
                    style={[
                      styles.joinBtn,
                      isJoined && styles.joinedBtn,
                    ]}
                  >
                    {isJoined ? (
                      <CheckCircle2 size={15} color={Colors.green} />
                    ) : (
                      <Users size={15} color="#FFFFFF" />
                    )}
                    <Text
                      style={[
                        styles.joinBtnText,
                        isJoined && { color: Colors.green },
                      ]}
                    >
                      {isJoined ? 'Joined' : 'Join Ride'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </AsphaltCard>
          )
        })}
      </ScrollView>

      {/* Create Ride Plan Modal */}
      <ModalSheet
        visible={createOpen}
        title="Create & Share Ride Plan"
        onClose={() => setCreateOpen(false)}
      >
        <Text style={styles.fieldLabel}>Ride Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Dawn Timber Trail Twisties"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
        />

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Origin</Text>
            <TextInput
              value={origin}
              onChangeText={setOrigin}
              placeholder="Chandigarh"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Destination</Text>
            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder="Kasauli / Shimla"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Distance (km)</Text>
            <TextInput
              value={distanceKm}
              onChangeText={setDistanceKm}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Max Riders</Text>
            <TextInput
              value={maxRiders}
              onChangeText={setMaxRiders}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Start Date & Time</Text>
        <TextInput
          value={startTime}
          onChangeText={setStartTime}
          placeholder="Sun • 05:30 AM"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>Meetup Spot</Text>
        <TextInput
          value={meetupLabel}
          onChangeText={setMeetupLabel}
          placeholder="e.g. Chandimandir Toll Plaza"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>Pace / Difficulty</Text>
        <View style={styles.diffRow}>
          {(['Chill', 'Spirited', 'Hardcore'] as Difficulty[]).map((d) => (
            <SecondaryButton
              key={d}
              label={d}
              active={difficulty === d}
              onPress={() => setDifficulty(d)}
              style={{ flex: 1, height: 40 }}
            />
          ))}
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={Typography.headline}>Open to Join</Text>
            <Text style={Typography.caption}>
              Allow nearby riders on RevCrew to discover and join
            </Text>
          </View>
          <Switch
            value={openToJoin}
            onValueChange={setOpenToJoin}
            trackColor={{ false: Colors.cardElevated, true: Colors.amber }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Text style={styles.fieldLabel}>Ride Notes / Gear Rules</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Full riding gear mandatory, staggered formation..."
          placeholderTextColor={Colors.textMuted}
          multiline
          style={[styles.input, { minHeight: 74, textAlignVertical: 'top' }]}
        />

        <PrimaryButton
          label="Publish Ride Plan"
          onPress={handleCreateRide}
          style={{ marginTop: Spacing.lg }}
        />
      </ModalSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.lg, paddingBottom: 112, gap: Spacing.md },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.amber,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.pill,
  },
  createBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.md,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
  },
  aiIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiArrow: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    fontWeight: '700',
    color: Colors.amberLight,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.amberSoft,
    borderColor: Colors.amberBorder,
  },
  openChipActive: {
    backgroundColor: Colors.greenSoft,
    borderColor: Colors.greenBorder,
  },
  filterChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.amberLight,
    fontWeight: '700',
  },
  rideCard: {
    gap: 12,
  },
  rideTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  iconActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.cyanSoft,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.amber,
  },
  joinedBtn: {
    backgroundColor: Colors.greenSoft,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
  },
  joinBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
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
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  diffRow: {
    flexDirection: 'row',
    gap: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    padding: 12,
    borderRadius: Radii.sm,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
})
