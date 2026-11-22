import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import {
  ArrowLeft,
  Send,
  Fuel,
  Coffee,
  AlertTriangle,
  MapPin,
} from 'lucide-react-native'
import { Colors, Radii, Spacing, Typography } from '@/theme/tokens'
import { Avatar, Pill } from '@/components/ui'
import { useRevCrewStore } from '@/store/useRevCrewStore'
import { triggerHaptic } from '@/lib/haptics'
import type { PingType } from '@/types'

export default function ChatRoomScreen() {
  const router = useRouter()
  const { channelId } = useLocalSearchParams<{ channelId: string }>()
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null)

  const {
    channels,
    messages,
    riders,
    currentUserId,
    sendMessage,
    markChannelRead,
    liveTelemetry,
  } = useRevCrewStore()

  const [draft, setDraft] = useState('')
  const channel = channels.find((c) => c.id === channelId) || channels[0]
  const roomMessages = messages.filter((m) => m.channelId === channel?.id)
  const riderById = (id: string) => riders.find((r) => r.id === id) || riders[0]

  useEffect(() => {
    if (channel?.id) markChannelRead(channel.id)
  }, [channel?.id, markChannelRead])

  function handleSend() {
    if (!draft.trim() || !channel) return
    sendMessage(channel.id, draft, 'text')
    setDraft('')
    triggerHaptic('light')
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
  }

  function handleQuickPing(pingType: PingType, text: string) {
    if (!channel) return
    sendMessage(channel.id, text, 'ping', { pingType })
    triggerHaptic('medium')
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
  }

  function handleShareLivePin() {
    if (!channel) return
    const myLoc = liveTelemetry.find((t) => t.userId === currentUserId)
    const coords = myLoc?.coords || { lat: 30.8542, lng: 76.9421 }
    sendMessage(
      channel.id,
      `Shared Live GPS Pin: ${coords.lat}, ${coords.lng} (${myLoc?.speedKmh || 68} km/h)`,
      'location',
      { coords }
    )
    triggerHaptic('success')
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={Colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={Typography.headline}>{channel?.title || 'Pack Chat'}</Text>
          <Text style={Typography.caption}>{channel?.subtitle}</Text>
        </View>
        <Pill label={channel?.type === 'ride' ? 'RIDE CHAT' : 'CREW CHAT'} tone="cyan" />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {roomMessages.map((msg) => {
            const sender = riderById(msg.senderId)
            const isMine = msg.senderId === currentUserId
            if (msg.kind === 'system') {
              return (
                <View key={msg.id} style={styles.systemBubble}>
                  <Text style={styles.systemText}>{msg.text}</Text>
                </View>
              )
            }
            return (
              <View
                key={msg.id}
                style={[styles.msgRow, isMine && styles.msgRowMine]}
              >
                {!isMine ? (
                  <Avatar name={sender.fullName} accent={sender.accent} size={30} />
                ) : null}
                <View
                  style={[
                    styles.bubble,
                    isMine ? styles.bubbleMine : styles.bubbleOther,
                    msg.kind === 'ping' && styles.bubblePing,
                    msg.kind === 'location' && styles.bubbleLocation,
                  ]}
                >
                  {!isMine ? (
                    <Text style={[styles.senderName, { color: sender.accent }]}>
                      {sender.fullName}
                    </Text>
                  ) : null}
                  {msg.pingType ? (
                    <View style={{ marginBottom: 4 }}>
                      <Pill
                        label={msg.pingType}
                        tone={msg.pingType === 'SOS' || msg.pingType === 'HAZARD' ? 'red' : 'amber'}
                      />
                    </View>
                  ) : null}
                  {msg.kind === 'location' ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <MapPin size={14} color={Colors.cyanLight} />
                      <Text style={Typography.monoSmall}>LIVE GPS PIN</Text>
                    </View>
                  ) : null}
                  <Text style={styles.msgText}>{msg.text}</Text>
                  <Text style={styles.msgTime}>{msg.createdAt}</Text>
                </View>
              </View>
            )
          })}
        </ScrollView>

        {/* Quick Rider Ping Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickPingBar}
        >
          <Pressable
            onPress={() => handleQuickPing('FUEL STOP', 'Fuel stop needed in next 10 km!')}
            style={styles.quickChip}
          >
            <Fuel size={13} color={Colors.amber} />
            <Text style={styles.quickChipText}>Fuel Stop</Text>
          </Pressable>
          <Pressable
            onPress={() => handleQuickPing('CHAI BREAK', 'Stopping for hot chai & stretch.')}
            style={styles.quickChip}
          >
            <Coffee size={13} color={Colors.cyanLight} />
            <Text style={styles.quickChipText}>Chai Break</Text>
          </Pressable>
          <Pressable
            onPress={() => handleQuickPing('HAZARD', 'Gravel / pothole ahead — slow down!')}
            style={styles.quickChip}
          >
            <AlertTriangle size={13} color={Colors.gold} />
            <Text style={styles.quickChipText}>Hazard</Text>
          </Pressable>
          <Pressable onPress={handleShareLivePin} style={styles.quickChip}>
            <MapPin size={13} color={Colors.green} />
            <Text style={styles.quickChipText}>Share GPS</Text>
          </Pressable>
        </ScrollView>

        {/* Composer */}
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message your riding pack..."
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            onSubmitEditing={handleSend}
          />
          <Pressable onPress={handleSend} style={styles.sendBtn}>
            <Send size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  messageList: {
    padding: Spacing.lg,
    gap: 12,
  },
  systemBubble: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  systemText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  msgRowMine: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 3,
  },
  bubbleOther: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleMine: {
    backgroundColor: Colors.amberSoft,
    borderColor: Colors.amberBorder,
    borderBottomRightRadius: 4,
  },
  bubblePing: {
    borderColor: Colors.amber,
  },
  bubbleLocation: {
    backgroundColor: Colors.cyanSoft,
    borderColor: Colors.cyanBorder,
  },
  senderName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    fontWeight: '700',
  },
  msgText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  msgTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  quickPingBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  quickChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.text,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: Radii.pill,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 16,
    color: Colors.text,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
