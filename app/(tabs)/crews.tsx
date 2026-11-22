import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Flag,
  MessageCircle,
  Globe,
  MapPin,
  Users,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native'
import { Colors, Radii, Spacing, Typography } from '@/theme/tokens'
import { AsphaltCard, Pill, SectionHeader } from '@/components/ui'
import { useRevCrewStore } from '@/store/useRevCrewStore'
import { triggerHaptic } from '@/lib/haptics'
import type { Region } from '@/types'

export default function CrewsScreen() {
  const router = useRouter()
  const { crews, channels, currentUserId, toggleJoinCrew } = useRevCrewStore()
  const [regionFilter, setRegionFilter] = useState<'All' | Region>('All')

  const filteredCrews = useMemo(() => {
    if (regionFilter === 'All') return crews
    return crews.filter((c) => c.region === regionFilter)
  }, [crews, regionFilter])

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={Typography.titleLarge}>Global Crews & Chats</Text>
        <Text style={Typography.bodySmall}>
          Join global riding chapters, chat with your pack & design crew banners
        </Text>

        {/* Crew Banner Studio Launcher */}
        <Pressable onPress={() => router.push('/banner-studio')}>
          <LinearGradient
            colors={['#7C2D12', '#0E7490']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerStudioCard}
          >
            <View style={styles.studioIcon}>
              <Flag size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.studioTitle}>Crew Group Banner Studio</Text>
              <Text style={styles.studioSub}>
                Design your custom crew crest, tagline & shareable poster
              </Text>
            </View>
            <ChevronRight size={20} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>

        {/* Active Group Chats */}
        <SectionHeader
          title="Group Chats"
          subtitle="Ride rooms & crew channels"
        />
        <View style={{ gap: 10 }}>
          {channels.map((ch) => (
            <Pressable
              key={ch.id}
              onPress={() => {
                triggerHaptic('light')
                router.push(`/chat/${ch.id}`)
              }}
            >
              <AsphaltCard style={styles.channelCard}>
                <View
                  style={[
                    styles.channelAvatar,
                    { backgroundColor: `${ch.accent}24`, borderColor: `${ch.accent}66` },
                  ]}
                >
                  <MessageCircle size={20} color={ch.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.channelTopRow}>
                    <Text style={Typography.headline}>{ch.title}</Text>
                    <Text style={Typography.caption}>{ch.lastActive}</Text>
                  </View>
                  <Text style={Typography.bodySmall} numberOfLines={1}>
                    {ch.subtitle}
                  </Text>
                </View>
                {ch.unread > 0 ? (
                  <View style={styles.unreadPill}>
                    <Text style={styles.unreadText}>{ch.unread}</Text>
                  </View>
                ) : (
                  <ChevronRight size={18} color={Colors.textMuted} />
                )}
              </AsphaltCard>
            </Pressable>
          ))}
        </View>

        {/* Global Groups Directory */}
        <SectionHeader
          title="Global Rider Groups"
          subtitle="Connect with crews worldwide"
        />
        <View style={styles.filterRow}>
          {(['All', 'India', 'Global'] as const).map((r) => (
            <Pressable
              key={r}
              onPress={() => {
                triggerHaptic('selection')
                setRegionFilter(r)
              }}
              style={[styles.filterChip, regionFilter === r && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterText,
                  regionFilter === r && styles.filterTextActive,
                ]}
              >
                {r}
              </Text>
            </Pressable>
          ))}
        </View>

        {filteredCrews.map((crew) => {
          const isMember = crew.memberIds.includes(currentUserId)
          return (
            <AsphaltCard key={crew.id} style={styles.crewCard}>
              <View style={styles.crewTop}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={Typography.title}>{crew.name}</Text>
                    {crew.verified ? (
                      <ShieldCheck size={16} color={Colors.cyanLight} />
                    ) : null}
                  </View>
                  <Text style={Typography.caption}>
                    {crew.handle} • Est. {crew.founded}
                  </Text>
                </View>
                <Pill
                  label={crew.region.toUpperCase()}
                  tone={crew.region === 'Global' ? 'cyan' : 'amber'}
                  icon={<Globe size={11} color={crew.region === 'Global' ? Colors.cyanLight : Colors.amberLight} />}
                />
              </View>

              <Text style={Typography.body}>{crew.description}</Text>

              <View style={styles.crewStats}>
                <View style={styles.statChip}>
                  <MapPin size={13} color={Colors.amber} />
                  <Text style={Typography.caption}>
                    {crew.city}, {crew.country}
                  </Text>
                </View>
                <View style={styles.statChip}>
                  <Users size={13} color={Colors.cyanLight} />
                  <Text style={Typography.caption}>
                    {crew.memberCount.toLocaleString()} riders • {crew.ridingNow} live
                  </Text>
                </View>
              </View>

              <View style={styles.crewActions}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/banner-studio',
                      params: { crewId: crew.id },
                    })
                  }
                  style={styles.bannerMiniBtn}
                >
                  <Flag size={15} color={Colors.cyanLight} />
                  <Text style={styles.bannerMiniText}>Make Banner</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    triggerHaptic('medium')
                    toggleJoinCrew(crew.id)
                  }}
                  style={[styles.joinCrewBtn, isMember && styles.joinedCrewBtn]}
                >
                  {isMember ? (
                    <CheckCircle2 size={15} color={Colors.green} />
                  ) : null}
                  <Text
                    style={[
                      styles.joinCrewText,
                      isMember && { color: Colors.green },
                    ]}
                  >
                    {isMember ? 'Joined Crew' : 'Join Group'}
                  </Text>
                </Pressable>
              </View>
            </AsphaltCard>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.lg, paddingBottom: 112, gap: Spacing.md },
  bannerStudioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.lg,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
  },
  studioIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studioTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  studioSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 2,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.md,
  },
  channelAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
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
  filterText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.amberLight,
    fontWeight: '700',
  },
  crewCard: {
    gap: 10,
  },
  crewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  crewStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  crewActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  bannerMiniBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.cyanSoft,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bannerMiniText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.cyanLight,
  },
  joinCrewBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.amber,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  joinedCrewBtn: {
    backgroundColor: Colors.greenSoft,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
  },
  joinCrewText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
