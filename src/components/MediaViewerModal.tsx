import React, { useEffect, useState } from 'react'
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Share,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useVideoPlayer, VideoView } from 'expo-video'
import {
  X,
  Heart,
  Share2,
  MapPin,
  Camera,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react-native'
import { Colors, Spacing, Typography, Radii } from '@/theme/tokens'
import { Avatar, Pill } from '@/components/ui'
import { triggerHaptic } from '@/lib/haptics'
import type { FeedPost, RiderProfile } from '@/types'

function ActiveVideoPlayer({ uri }: { uri: string }) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isBuffering, setIsBuffering] = useState(true)

  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = true
    p.muted = false
    p.play()
  })

  useEffect(() => {
    const statusSub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') {
        setIsBuffering(false)
        player.play()
      } else if (status === 'loading') {
        setIsBuffering(true)
      } else if (status === 'error') {
        setIsBuffering(false)
      }
    })
    const playSub = player.addListener('playingChange', ({ isPlaying: playing }) => {
      setIsPlaying(playing)
      if (playing) setIsBuffering(false)
    })

    // Ensure playback kicks off once mounted
    const timer = setTimeout(() => {
      try {
        player.play()
      } catch {
        // Ignore
      }
    }, 200)

    return () => {
      clearTimeout(timer)
      statusSub.remove()
      playSub.remove()
    }
  }, [player])

  function togglePlay() {
    triggerHaptic('light')
    if (isPlaying) {
      player.pause()
      setIsPlaying(false)
    } else {
      player.play()
      setIsPlaying(true)
    }
  }

  function toggleMute() {
    triggerHaptic('light')
    const next = !isMuted
    player.muted = next
    setIsMuted(next)
  }

  return (
    <View style={styles.videoWrap}>
      <VideoView
        player={player}
        style={styles.videoView}
        contentFit="contain"
        nativeControls
      />
      {isBuffering ? (
        <View style={styles.bufferOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.amber} />
          <Text style={styles.bufferText}>Loading Ride Reel...</Text>
        </View>
      ) : null}

      <View style={styles.videoControlsBar}>
        <Pressable onPress={togglePlay} style={styles.controlPill}>
          {isPlaying ? (
            <Pause size={16} color="#FFFFFF" />
          ) : (
            <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
          )}
          <Text style={styles.controlText}>{isPlaying ? 'Pause' : 'Play'}</Text>
        </Pressable>

        <Pressable onPress={toggleMute} style={styles.controlPill}>
          {isMuted ? (
            <VolumeX size={16} color={Colors.amberLight} />
          ) : (
            <Volume2 size={16} color={Colors.cyanLight} />
          )}
          <Text style={styles.controlText}>{isMuted ? 'Unmute' : 'Sound On'}</Text>
        </Pressable>
      </View>
    </View>
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
  videoWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  bufferOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: Radii.md,
  },
  bufferText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  videoControlsBar: {
    position: 'absolute',
    bottom: 14,
    flexDirection: 'row',
    gap: 10,
  },
  controlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(15,18,24,0.85)',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  controlText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
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
