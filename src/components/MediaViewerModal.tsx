import React from 'react'
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Share,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useVideoPlayer, VideoView } from 'expo-video'
import { X, Heart, Share2, MapPin, Camera } from 'lucide-react-native'
import { Colors, Spacing, Typography, Radii } from '@/theme/tokens'
import { Avatar, Pill } from '@/components/ui'
import { triggerHaptic } from '@/lib/haptics'
import type { FeedPost, RiderProfile } from '@/types'

function ActiveVideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true
    p.play()
  })

  return (
    <VideoView
      player={player}
      style={styles.videoView}
      contentFit="contain"
      nativeControls
    />
  )
}

export function MediaViewerModal({
  post,
  author,
  onClose,
  onToggleLike,
}: {
  post: FeedPost | null
  author: RiderProfile | null
  onClose: () => void
  onToggleLike: (postId: string) => void
}) {
  if (!post || !author) return null

  const isVideo = post.mediaType === 'video' && Boolean(post.mediaUri)
  const imageSourceUri = post.mediaType === 'photo' ? post.mediaUri : post.thumbnailUri

  async function handleShare() {
    if (!post) return
    try {
      await Share.share({
        message: `${post.caption}\n📍 ${post.location}\nShared via RevCrew`,
      })
    } catch {
      // Cancelled
    }
  }

  return (
    <Modal visible animationType="fade" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <Avatar name={author.fullName} accent={author.accent} size={36} online={author.ridingNow} />
            <View style={{ flex: 1 }}>
              <Text style={Typography.headline}>{author.fullName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} color={Colors.cyanLight} />
                <Text style={Typography.caption} numberOfLines={1}>
                  {post.location} • {author.bike}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => {
              triggerHaptic('light')
              onClose()
            }}
            style={styles.closeBtn}
            hitSlop={10}
          >
            <X size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Full-screen Media Stage */}
        <View style={styles.stage}>
          {isVideo && post.mediaUri ? (
            <ActiveVideoPlayer uri={post.mediaUri} />
          ) : imageSourceUri ? (
            <Image
              source={{ uri: imageSourceUri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          ) : (
            <LinearGradient
              colors={post.gradient}
              style={styles.fallbackBox}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Camera size={42} color="rgba(255,255,255,0.8)" />
              <Text style={[Typography.title, { marginTop: 12 }]}>
                {post.rideTitle || post.location}
              </Text>
            </LinearGradient>
          )}
        </View>

        {/* Bottom Caption & Actions */}
        <View style={styles.footer}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <Pill
              label={post.mediaType === 'video' ? post.durationLabel || 'VIDEO REEL' : 'PHOTO'}
              tone={post.mediaType === 'video' ? 'amber' : 'cyan'}
            />
            {post.rideTitle ? <Pill label={post.rideTitle} tone="neutral" /> : null}
          </View>
          <Text style={styles.caption}>{post.caption}</Text>

          <View style={styles.actionRow}>
            <Pressable
              onPress={() => {
                triggerHaptic('light')
                onToggleLike(post.id)
              }}
              style={[styles.footerBtn, post.likedByMe && styles.likedBtn]}
            >
              <Heart
                size={18}
                color={post.likedByMe ? Colors.amber : '#FFFFFF'}
                fill={post.likedByMe ? Colors.amber : 'transparent'}
              />
              <Text style={styles.footerBtnText}>
                {post.likes} {post.likes === 1 ? 'Like' : 'Likes'}
              </Text>
            </Pressable>

            <Pressable onPress={() => void handleShare()} style={styles.footerBtn}>
              <Share2 size={18} color={Colors.cyanLight} />
              <Text style={[styles.footerBtnText, { color: Colors.cyanLight }]}>Share</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  fallbackBox: {
    width: '90%',
    height: 320,
    borderRadius: Radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  footerBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radii.button,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  likedBtn: {
    backgroundColor: Colors.amberSoft,
    borderColor: Colors.amberBorder,
  },
  footerBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
})
