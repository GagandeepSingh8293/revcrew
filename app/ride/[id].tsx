import React from 'react'
import { View, Text, ScrollView, Pressable, Share, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ArrowLeft,
  Share2,
  MapPin,
  Clock,
  Navigation,
  MessageCircle,
  Radio,
  Receipt,
  CheckCircle2,
  Users,
} from 'lucide-react-native'
import { Colors, Radii, Spacing, Typography } from '@/theme/tokens'
import {
  AsphaltCard,
  PrimaryButton,
  SecondaryButton,
  Pill,
  Avatar,
} from '@/components/ui'
import { useRevCrewStore } from '@/store/useRevCrewStore'
import { triggerHaptic } from '@/lib/haptics'

export default function RideDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { rides, riders, channels, currentUserId, toggleJoinRide } = useRevCrewStore()

  const ride = rides.find((r) => r.id === id) || rides[0]
  if (!ride) return null

  const riderById = (uid: string) => riders.find((r) => r.id === uid) || riders[0]
  const isJoined = ride.participantIds.includes(currentUserId)
  const spotsLeft = Math.max(0, ride.maxRiders - ride.participantIds.length)
  const rideChannel = channels.find((c) => c.rideId === ride.id) || channels[0]

  async function handleShare() {
    try {
      await Share.share({
        message: `🏍️ ${ride.title}\nRoute: ${ride.routeSummary} (${ride.distanceKm} km)\nStart: ${ride.startTime}\nMeetup: ${ride.meetupLabel}\n${ride.openToJoin ? `OPEN TO JOIN (${spotsLeft} spots left)` : 'Pack Ride'}\n\nJoin on RevCrew!`,
      })
    } catch {
      // Cancelled
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={20} color={Colors.text} />
        </Pressable>
        <Text style={Typography.headline}>Ride Plan</Text>
        <Pressable onPress={() => void handleShare()} style={styles.iconBtn}>
          <Share2 size={18} color={Colors.cyanLight} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={ride.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Pill
              label={ride.openToJoin ? `OPEN TO JOIN • ${spotsLeft} LEFT` : 'CLOSED PACK'}
              tone={ride.openToJoin ? 'green' : 'neutral'}
            />
            <Pill label={ride.difficulty.toUpperCase()} tone="amber" />
          </View>
          <Text style={styles.heroTitle}>{ride.title}</Text>
          <Text style={styles.heroRoute}>{ride.routeSummary}</Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroMeta}>
              <Clock size={14} color="#FFFFFF" />
              <Text style={styles.heroMetaText}>{ride.startTime}</Text>
            </View>
            <View style={styles.heroMeta}>
              <Navigation size={14} color="#FFFFFF" />
              <Text style={styles.heroMetaText}>{ride.distanceKm} km</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <PrimaryButton
            label={isJoined ? 'Joined Ride ✓' : 'Join This Ride'}
            tone={isJoined ? 'cyan' : 'amber'}
            icon={isJoined ? <CheckCircle2 size={17} color="#FFFFFF" /> : <Users size={17} color="#FFFFFF" />}
            onPress={() => {
              triggerHaptic('medium')
              toggleJoinRide(ride.id)
            }}
            style={{ flex: 1 }}
          />
        </View>

        <View style={styles.shortcutRow}>
          <SecondaryButton
            label="Group Chat"
            icon={<MessageCircle size={15} color={Colors.cyanLight} />}
            onPress={() => router.push(`/chat/${rideChannel.id}`)}
            style={{ flex: 1 }}
          />
          <SecondaryButton
            label="Live Map"
            icon={<Radio size={15} color={Colors.amber} />}
            onPress={() => router.push('/(tabs)/live')}
            style={{ flex: 1 }}
          />
          <SecondaryButton
            label="Splits"
            icon={<Receipt size={15} color={Colors.green} />}
            onPress={() => router.push('/(tabs)/splits')}
            style={{ flex: 1 }}
          />
        </View>

        {/* Description & Meetup */}
        <AsphaltCard style={{ gap: 8 }}>
          <Text style={Typography.headline}>Briefing & Meetup</Text>
          <Text style={Typography.body}>{ride.description}</Text>
          <View style={styles.meetupBox}>
            <MapPin size={16} color={Colors.amber} />
            <Text style={styles.meetupText}>{ride.meetupLabel}</Text>
          </View>
        </AsphaltCard>

        {/* Route Waypoints */}
        <AsphaltCard style={{ gap: 12 }}>
          <Text style={Typography.headline}>Route Waypoints</Text>
          {ride.waypoints.map((wp, idx) => (
            <View key={`${wp.label}-${idx}`} style={styles.wpRow}>
              <View style={styles.wpDot} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.wpLabel}>{wp.label}</Text>
                  <Text style={Typography.monoSmall}>{wp.km} km</Text>
                </View>
                {wp.note ? <Text style={Typography.bodySmall}>{wp.note}</Text> : null}
              </View>
            </View>
          ))}
        </AsphaltCard>

        {/* Confirmed Riders */}
        <AsphaltCard style={{ gap: 10 }}>
          <Text style={Typography.headline}>
            Pack Roster ({ride.participantIds.length}/{ride.maxRiders})
          </Text>
          {ride.participantIds.map((uid) => {
            const r = riderById(uid)
            return (
              <View key={uid} style={styles.rosterRow}>
                <Avatar name={r.fullName} accent={r.accent} size={34} online={r.ridingNow} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rosterName}>{r.fullName}</Text>
                  <Text style={Typography.caption}>{r.bike}</Text>
                </View>
                {uid === ride.captainId ? (
                  <Pill label="CAPTAIN" tone="amber" />
                ) : null}
              </View>
            )
          })}
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
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 48,
    gap: Spacing.md,
  },
  heroBanner: {
    borderRadius: Radii.card,
    padding: Spacing.xl,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
  },
  heroTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 23,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  heroRoute: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.86)',
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 8,
  },
  meetupBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  meetupText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.text,
  },
  wpRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  wpDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.amber,
    marginTop: 5,
  },
  wpLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  rosterName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
})
