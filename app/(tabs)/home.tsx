import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Share,
  StyleSheet,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from 'expo-image-picker'
import {
  Sparkles,
  Flag,
  Radio,
  Camera,
  Video,
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Play,
  Plus,
  Send,
  Wifi,
  WifiOff,
  LogOut,
} from 'lucide-react-native'
import { Colors, Radii, Spacing, Typography } from '@/theme/tokens'
import {
  AsphaltCard,
  PrimaryButton,
  SecondaryButton,
  Pill,
  Avatar,
  AvatarStack,
  SectionHeader,
  ModalSheet,
} from '@/components/ui'
import { useRevCrewStore } from '@/store/useRevCrewStore'
import { isSupabaseConfigured } from '@/lib/supabase'
import { triggerHaptic } from '@/lib/haptics'
import { MediaViewerModal } from '@/components/MediaViewerModal'
import type { FeedPost } from '@/types'

export default function HomeScreen() {
  const router = useRouter()
  const {
    riders,
    rides,
    posts,
    toggleLikePost,
    addCommentToPost,
    createPost,
    signOut,
  } = useRevCrewStore()

  const [composerOpen, setComposerOpen] = useState(false)
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo')
  const [pickedUri, setPickedUri] = useState<string | undefined>()
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [tagsInput, setTagsInput] = useState('#RevCrew #WeekendRide')
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [viewingPostId, setViewingPostId] = useState<string | null>(null)

  const viewingPost: FeedPost | null =
    posts.find((p) => p.id === viewingPostId) || null

  const featuredRide = rides[0]
  const riderById = (id: string) => riders.find((r) => r.id === id) || riders[0]

  async function pickMedia(kind: 'photo' | 'video') {
    setMediaType(kind)
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow photo library access to pick ride media.')
        return
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: kind === 'video' ? ['videos'] : ['images'],
        quality: 0.8,
      })
      if (!res.canceled && res.assets?.[0]?.uri) {
        setPickedUri(res.assets[0].uri)
      }
    } catch {
      // Graceful fallback when running in environments without native picker
    }
  }

  function handlePublishPost() {
    if (!caption.trim()) {
      Alert.alert('Add a caption', 'Share a short story about your ride moment.')
      return
    }
    const tags = tagsInput
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`))

    createPost({
      caption,
      location: location || 'NH-44 Highway',
      mediaType,
      mediaUri: pickedUri,
      rideId: featuredRide?.id,
      rideTitle: featuredRide?.title,
      tags,
    })
    triggerHaptic('success')
    setCaption('')
    setLocation('')
    setPickedUri(undefined)
    setComposerOpen(false)
  }

  async function handleSharePost(captionText: string, loc: string) {
    try {
      await Share.share({
        message: `${captionText}\n📍 ${loc}\nShared via RevCrew — Rider Community`,
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
        {/* Top Brand Bar */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brandWord}>REV</Text>
              <Text style={[styles.brandWord, { color: Colors.amber }]}>CREW</Text>
            </View>
            <Text style={Typography.caption}>Pack Connected • Ride Without Limits</Text>
          </View>
          <View style={styles.headerActions}>
            <Pill
              label={isSupabaseConfigured ? 'LIVE SYNC' : 'DEMO MODE'}
              tone={isSupabaseConfigured ? 'green' : 'cyan'}
              icon={
                isSupabaseConfigured ? (
                  <Wifi size={12} color={Colors.green} />
                ) : (
                  <WifiOff size={12} color={Colors.cyanLight} />
                )
              }
            />
            <Pressable
              onPress={() => {
                triggerHaptic('light')
                setComposerOpen(true)
              }}
              style={styles.uploadIconBtn}
            >
              <Plus size={20} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={() => {
                triggerHaptic('light')
                signOut()
                router.replace('/auth/login')
              }}
              style={styles.logoutIconBtn}
            >
              <LogOut size={17} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Quick Action Studio Strip */}
        <View style={styles.quickGrid}>
          <Pressable
            onPress={() => router.push('/ai-planner')}
            style={({ pressed }) => [styles.quickTile, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={['rgba(255,107,26,0.22)', 'rgba(255,107,26,0.05)']}
              style={styles.quickTileInner}
            >
              <Sparkles size={20} color={Colors.amber} />
              <Text style={styles.quickTileTitle}>AI Planner</Text>
              <Text style={styles.quickTileSub}>Full itinerary</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => router.push('/banner-studio')}
            style={({ pressed }) => [styles.quickTile, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={['rgba(6,182,212,0.22)', 'rgba(6,182,212,0.05)']}
              style={styles.quickTileInner}
            >
              <Flag size={20} color={Colors.cyanLight} />
              <Text style={styles.quickTileTitle}>Crew Banner</Text>
              <Text style={styles.quickTileSub}>Design & share</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/live')}
            style={({ pressed }) => [styles.quickTile, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={['rgba(16,185,129,0.22)', 'rgba(16,185,129,0.05)']}
              style={styles.quickTileInner}
            >
              <Radio size={20} color={Colors.green} />
              <Text style={styles.quickTileTitle}>Live Pack</Text>
              <Text style={styles.quickTileSub}>GPS Radar</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Featured Open Ride Hero */}
        {featuredRide ? (
          <Pressable onPress={() => router.push(`/ride/${featuredRide.id}`)}>
            <LinearGradient
              colors={featuredRide.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroTopRow}>
                <Pill
                  label={featuredRide.status === 'live' ? 'LIVE NOW' : 'OPEN TO JOIN'}
                  tone={featuredRide.status === 'live' ? 'amber' : 'green'}
                />
                <Text style={styles.heroDistance}>{featuredRide.distanceKm} KM</Text>
              </View>
              <Text style={styles.heroTitle}>{featuredRide.title}</Text>
              <Text style={styles.heroRoute}>{featuredRide.routeSummary}</Text>
              <View style={styles.heroFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <AvatarStack
                    names={featuredRide.participantIds.map((id) => riderById(id).fullName)}
                    accents={featuredRide.participantIds.map((id) => riderById(id).accent)}
                  />
                  <Text style={styles.heroSpots}>
                    {featuredRide.participantIds.length}/{featuredRide.maxRiders} riders
                  </Text>
                </View>
                <Text style={styles.heroCta}>Open Ride →</Text>
              </View>
            </LinearGradient>
          </Pressable>
        ) : null}

        {/* Community Media Feed */}
        <SectionHeader
          title="Rider Feed"
          subtitle="Photos, exhaust reels & ride highlights"
          actionLabel="+ Share Media"
          onAction={() => setComposerOpen(true)}
        />

        {posts.map((post) => {
          const author = riderById(post.authorId)
          const showComments = !!expandedComments[post.id]
          return (
            <AsphaltCard key={post.id} style={styles.postCard}>
              {/* Author header */}
              <View style={styles.postHeader}>
                <Avatar
                  name={author.fullName}
                  accent={author.accent}
                  online={author.ridingNow}
                />
                <View style={{ flex: 1 }}>
                  <Text style={Typography.headline}>{author.fullName}</Text>
                  <View style={styles.locationRow}>
                    <MapPin size={12} color={Colors.cyanLight} />
                    <Text style={Typography.caption}>
                      {post.location} • {post.createdAt}
                    </Text>
                  </View>
                </View>
                <Pill
                  label={post.mediaType === 'video' ? post.durationLabel || 'VIDEO' : 'PHOTO'}
                  tone={post.mediaType === 'video' ? 'amber' : 'cyan'}
                />
              </View>

              {/* Media Frame — Tap to view full-screen Photo or play Video */}
              <Pressable
                onPress={() => {
                  triggerHaptic('light')
                  setViewingPostId(post.id)
                }}
                style={({ pressed }) => [
                  styles.mediaFrame,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <LinearGradient
                  colors={post.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {post.thumbnailUri || (post.mediaType === 'photo' && post.mediaUri) ? (
                  <Image
                    source={{
                      uri: post.mediaType === 'photo' ? post.mediaUri : post.thumbnailUri,
                    }}
                    style={styles.mediaImg}
                    resizeMode="cover"
                  />
                ) : null}

                <LinearGradient
                  colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.68)']}
                  style={styles.mediaScrim}
                >
                  {post.mediaType === 'video' ? (
                    <View style={styles.playCircle}>
                      <Play size={26} color="#FFFFFF" fill="#FFFFFF" />
                    </View>
                  ) : null}
                  <View style={styles.mediaCaptionBar}>
                    <Text style={styles.mediaOverlayTitle} numberOfLines={1}>
                      {post.rideTitle || post.location}
                    </Text>
                    <Text style={styles.mediaOverlaySub}>
                      {post.mediaType === 'video' ? 'Tap to play reel' : 'Tap to view photo'} •{' '}
                      {author.bike}
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>

              {/* Caption & Tags */}
              <Text style={styles.postCaption}>{post.caption}</Text>
              <View style={styles.tagRow}>
                {post.tags.map((t) => (
                  <Text key={t} style={styles.tagText}>
                    {t}
                  </Text>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.postActions}>
                <Pressable
                  onPress={() => {
                    triggerHaptic('light')
                    toggleLikePost(post.id)
                  }}
                  style={styles.actionBtn}
                >
                  <Heart
                    size={19}
                    color={post.likedByMe ? Colors.amber : Colors.textSecondary}
                    fill={post.likedByMe ? Colors.amber : 'transparent'}
                  />
                  <Text
                    style={[
                      styles.actionText,
                      post.likedByMe && { color: Colors.amberLight },
                    ]}
                  >
                    {post.likes}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                  }
                  style={styles.actionBtn}
                >
                  <MessageCircle size={19} color={Colors.textSecondary} />
                  <Text style={styles.actionText}>{post.comments.length}</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleSharePost(post.caption, post.location)}
                  style={styles.actionBtn}
                >
                  <Share2 size={18} color={Colors.cyanLight} />
                  <Text style={[styles.actionText, { color: Colors.cyanLight }]}>Share</Text>
                </Pressable>
              </View>

              {/* Comments Drawer */}
              {showComments ? (
                <View style={styles.commentsBox}>
                  {post.comments.map((cm) => {
                    const cmAuthor = riderById(cm.authorId)
                    return (
                      <View key={cm.id} style={styles.commentRow}>
                        <Text style={styles.commentAuthor}>{cmAuthor.fullName}</Text>
                        <Text style={styles.commentBody}>{cm.text}</Text>
                      </View>
                    )
                  })}
                  <View style={styles.commentInputRow}>
                    <TextInput
                      value={commentDrafts[post.id] || ''}
                      onChangeText={(txt) =>
                        setCommentDrafts((prev) => ({ ...prev, [post.id]: txt }))
                      }
                      placeholder="Drop a comment for the pack..."
                      placeholderTextColor={Colors.textMuted}
                      style={styles.commentInput}
                    />
                    <Pressable
                      onPress={() => {
                        addCommentToPost(post.id, commentDrafts[post.id] || '')
                        setCommentDrafts((prev) => ({ ...prev, [post.id]: '' }))
                        triggerHaptic('light')
                      }}
                      style={styles.commentSendBtn}
                    >
                      <Send size={15} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </AsphaltCard>
          )
        })}
      </ScrollView>

      {/* Share Photo / Video Modal */}
      <ModalSheet
        visible={composerOpen}
        title="Share Ride Photo or Video"
        onClose={() => setComposerOpen(false)}
      >
        <View style={styles.mediaTypeRow}>
          <SecondaryButton
            label="Pick Photo"
            active={mediaType === 'photo'}
            icon={<Camera size={16} color={mediaType === 'photo' ? Colors.cyanLight : Colors.text} />}
            onPress={() => void pickMedia('photo')}
            style={{ flex: 1 }}
          />
          <SecondaryButton
            label="Pick Video"
            active={mediaType === 'video'}
            icon={<Video size={16} color={mediaType === 'video' ? Colors.cyanLight : Colors.text} />}
            onPress={() => void pickMedia('video')}
            style={{ flex: 1 }}
          />
        </View>

        {pickedUri ? (
          <View style={styles.pickedPreview}>
            <Image source={{ uri: pickedUri }} style={styles.pickedImg} resizeMode="cover" />
          </View>
        ) : (
          <View style={styles.pickedHint}>
            <Text style={Typography.bodySmall}>
              Selected format: {mediaType.toUpperCase()} (pick from gallery or post with ride card)
            </Text>
          </View>
        )}

        <Text style={styles.fieldLabel}>Caption</Text>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="How were the roads, views, and pack vibes?"
          placeholderTextColor={Colors.textMuted}
          multiline
          style={[styles.input, { minHeight: 84, textAlignVertical: 'top' }]}
        />

        <Text style={styles.fieldLabel}>Location / Pass</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Kasauli Ridge, Himachal"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>Hashtags</Text>
        <TextInput
          value={tagsInput}
          onChangeText={setTagsInput}
          placeholder="#RevCrew #Twisties"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
        />

        <PrimaryButton
          label={`Publish ${mediaType === 'video' ? 'Video Reel' : 'Photo'} to Feed`}
          onPress={handlePublishPost}
          style={{ marginTop: Spacing.md }}
        />
      </ModalSheet>

      {/* Full-Screen Photo & Video Player Modal */}
      <MediaViewerModal
        post={viewingPost}
        author={viewingPost ? riderById(viewingPost.authorId) : null}
        onClose={() => setViewingPostId(null)}
        onToggleLike={toggleLikePost}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 112,
    gap: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandWord: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickTile: {
    flex: 1,
    borderRadius: Radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickTileInner: {
    padding: Spacing.md,
    gap: 4,
  },
  quickTileTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
  },
  quickTileSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  heroCard: {
    borderRadius: Radii.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    gap: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroDistance: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroRoute: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  heroSpots: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  heroCta: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  postCard: {
    gap: Spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  mediaFrame: {
    borderRadius: Radii.md,
    overflow: 'hidden',
    height: 220,
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  mediaImg: {
    width: '100%',
    height: '100%',
  },
  mediaScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: Spacing.md,
  },
  mediaCaptionBar: {
    width: '100%',
    marginTop: 'auto',
  },
  mediaPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: 8,
  },
  playCircle: {
    position: 'absolute',
    top: '34%',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,107,26,0.85)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaOverlayTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mediaOverlaySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 2,
  },
  postCaption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    color: Colors.cyanLight,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  commentsBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.sm,
    padding: Spacing.md,
    gap: 8,
  },
  commentRow: {
    gap: 2,
  },
  commentAuthor: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.amberLight,
  },
  commentBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.text,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    height: 38,
    borderRadius: Radii.sm,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    color: Colors.text,
    fontSize: 13,
  },
  commentSendBtn: {
    width: 38,
    height: 38,
    borderRadius: Radii.sm,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  pickedPreview: {
    height: 150,
    borderRadius: Radii.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  pickedImg: {
    width: '100%',
    height: '100%',
  },
  pickedHint: {
    padding: Spacing.md,
    borderRadius: Radii.sm,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: Colors.text,
    fontSize: 14,
  },
})
