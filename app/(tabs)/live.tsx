import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg'
import * as Location from 'expo-location'
import {
  Radio,
  Fuel,
  Coffee,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  MessageCircle,
  Battery,
  Gauge,
  Navigation,
} from 'lucide-react-native'
import { Colors, Radii, Spacing, Typography } from '@/theme/tokens'
import { AsphaltCard, Pill, Avatar, SectionHeader } from '@/components/ui'
import { useRevCrewStore } from '@/store/useRevCrewStore'
import { triggerHaptic } from '@/lib/haptics'
import type { PingType } from '@/types'

// Helper to project 0..1 progress along our scenic curved route SVG path
function getRoutePoint(progress: number): { x: number; y: number } {
  const t = Math.max(0.05, Math.min(0.95, progress))
  const x = 28 + t * 264
  const y = 115 - Math.sin(t * Math.PI * 1.6) * 52 - t * 24
  return { x, y }
}

export default function LiveScreen() {
  const router = useRouter()
  const {
    riders,
    liveTelemetry,
    myLiveSharing,
    setMyLiveSharing,
    broadcastRoadPing,
    tickLiveTelemetry,
  } = useRevCrewStore()

  const [lastBroadcast, setLastBroadcast] = useState<string | null>(null)

  // Live telemetry ticker so riders visibly move on the pack radar
  useEffect(() => {
    const timer = setInterval(() => {
      tickLiveTelemetry()
    }, 2600)
    return () => clearInterval(timer)
  }, [tickLiveTelemetry])

  const riderById = (id: string) => riders.find((r) => r.id === id) || riders[0]
  const activeCount = liveTelemetry.filter((t) => t.sharingLocation).length

  async function handleToggleSharing(nextVal: boolean) {
    triggerHaptic('medium')
    if (!nextVal) {
      setMyLiveSharing(false)
      return
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({})
        setMyLiveSharing(true, {
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4)),
        })
        return
      }
    } catch {
      // Fallback gracefully to simulated GPS on web/emulators
    }
    setMyLiveSharing(true)
  }

  function handlePing(type: PingType) {
    triggerHaptic(type === 'SOS' || type === 'HAZARD' ? 'warning' : 'success')
    broadcastRoadPing(type)
    setLastBroadcast(`${type} sent to ${activeCount} pack riders & Ride Chat`)
    if (type === 'SOS') {
      Alert.alert(
        'SOS Broadcast Sent',
        'Your exact GPS coordinates and emergency alert have been sent to all riders in the pack.'
      )
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
            <Text style={Typography.titleLarge}>Live Pack Radar</Text>
            <Text style={Typography.bodySmall}>
              Sunrise Kasauli Pine Twisties • {activeCount} riders live
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/chat/ch_kasauli')}
            style={styles.chatShortcut}
          >
            <MessageCircle size={18} color={Colors.cyanLight} />
            <Text style={styles.chatShortcutText}>Chat</Text>
          </Pressable>
        </View>

        {/* Share My Live Location Switch */}
        <AsphaltCard highlighted={myLiveSharing} style={styles.sharingCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View
              style={[
                styles.radarIconBox,
                { backgroundColor: myLiveSharing ? Colors.amberSoft : Colors.surface },
              ]}
            >
              <Radio size={22} color={myLiveSharing ? Colors.amber : Colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={Typography.headline}>Share My Live Location</Text>
              <Text style={Typography.caption}>
                {myLiveSharing
                  ? 'Broadcasting GPS telemetry to your pack'
                  : 'Paused — pack cannot see your live pin'}
              </Text>
            </View>
          </View>
          <Switch
            value={myLiveSharing}
            onValueChange={(v) => void handleToggleSharing(v)}
            trackColor={{ false: Colors.cardElevated, true: Colors.amber }}
            thumbColor="#FFFFFF"
          />
        </AsphaltCard>

        {/* Interactive SVG Live Route & Rider Radar */}
        <AsphaltCard style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Pill label="REALTIME GPS PACK" tone="cyan" />
            <Text style={Typography.monoSmall}>NH-5 • KASAULI RIDGE</Text>
          </View>

          <View style={styles.svgWrap}>
            <Svg width="100%" height={190} viewBox="0 0 320 190">
              {/* Subtle radar grid lines */}
              {[40, 95, 150].map((y) => (
                <Line
                  key={y}
                  x1="12"
                  y1={y}
                  x2="308"
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />
              ))}
              {/* Route polyline */}
              <Path
                d="M 28 145 Q 95 45, 165 88 T 292 65"
                fill="none"
                stroke="rgba(6,182,212,0.28)"
                strokeWidth={10}
                strokeLinecap="round"
              />
              <Path
                d="M 28 145 Q 95 45, 165 88 T 292 65"
                fill="none"
                stroke={Colors.cyan}
                strokeWidth={3}
                strokeLinecap="round"
              />

              {/* Start / Finish markers */}
              <Circle cx={28} cy={145} r={5} fill={Colors.textSecondary} />
              <SvgText x={22} y={168} fill={Colors.textMuted} fontSize="10" fontWeight="600">
                START
              </SvgText>
              <Circle cx={292} cy={65} r={6} fill={Colors.green} />
              <SvgText x={264} y={48} fill={Colors.green} fontSize="10" fontWeight="700">
                KASAULI
              </SvgText>

              {/* Live moving riders */}
              {liveTelemetry
                .filter((t) => t.sharingLocation)
                .map((t) => {
                  const rider = riderById(t.userId)
                  const pt = getRoutePoint(t.progress)
                  const initials = rider.fullName
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                  return (
                    <React.Fragment key={t.userId}>
                      <Circle cx={pt.x} cy={pt.y} r={18} fill={`${rider.accent}28`} />
                      <Circle
                        cx={pt.x}
                        cy={pt.y}
                        r={11}
                        fill={rider.accent}
                        stroke="#08090C"
                        strokeWidth={2}
                      />
                      <SvgText
                        x={pt.x}
                        y={pt.y + 3.5}
                        fill="#FFFFFF"
                        fontSize="8.5"
                        fontWeight="800"
                        textAnchor="middle"
                      >
                        {initials}
                      </SvgText>
                      <SvgText
                        x={pt.x}
                        y={pt.y + 24}
                        fill={Colors.text}
                        fontSize="9"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {t.speedKmh} km/h
                      </SvgText>
                    </React.Fragment>
                  )
                })}
            </Svg>
          </View>

          {lastBroadcast ? (
            <View style={styles.broadcastToast}>
              <Text style={styles.broadcastText}>{lastBroadcast}</Text>
            </View>
          ) : null}
        </AsphaltCard>

        {/* One-Tap Road Ping Deck */}
        <SectionHeader
          title="Quick Pack Pings"
          subtitle="Instantly alert all riders on live map & chat"
        />
        <View style={styles.pingGrid}>
          <Pressable onPress={() => handlePing('FUEL STOP')} style={styles.pingBtn}>
            <Fuel size={18} color={Colors.amber} />
            <Text style={styles.pingLabel}>Fuel Stop</Text>
          </Pressable>
          <Pressable onPress={() => handlePing('CHAI BREAK')} style={styles.pingBtn}>
            <Coffee size={18} color={Colors.cyanLight} />
            <Text style={styles.pingLabel}>Chai Break</Text>
          </Pressable>
          <Pressable onPress={() => handlePing('HAZARD')} style={styles.pingBtn}>
            <AlertTriangle size={18} color={Colors.gold} />
            <Text style={styles.pingLabel}>Hazard</Text>
          </Pressable>
          <Pressable onPress={() => handlePing('ALL CLEAR')} style={styles.pingBtn}>
            <CheckCircle2 size={18} color={Colors.green} />
            <Text style={styles.pingLabel}>All Clear</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => handlePing('SOS')} style={styles.sosBtn}>
          <ShieldAlert size={20} color="#FFFFFF" />
          <Text style={styles.sosText}>BROADCAST EMERGENCY SOS LOCATION</Text>
        </Pressable>

        {/* Live Pack Telemetry Roster */}
        <SectionHeader
          title="Riders on Live Map"
          subtitle="Live speed, formation role & GPS coordinates"
        />
        {liveTelemetry.map((t) => {
          const rider = riderById(t.userId)
          return (
            <AsphaltCard key={t.userId} style={styles.telemetryCard}>
              <View style={styles.telemetryTop}>
                <Avatar name={rider.fullName} accent={rider.accent} online={t.sharingLocation} />
                <View style={{ flex: 1 }}>
                  <Text style={Typography.headline}>{rider.fullName}</Text>
                  <Text style={Typography.caption}>
                    {t.formationRole} • {rider.bike}
                  </Text>
                </View>
                <Pill
                  label={t.sharingLocation ? `${t.speedKmh} KM/H` : 'OFFLINE'}
                  tone={t.sharingLocation ? 'amber' : 'neutral'}
                />
              </View>

              <View style={styles.telemetryMeta}>
                <View style={styles.metaChip}>
                  <Navigation size={13} color={Colors.cyanLight} />
                  <Text style={Typography.caption}>
                    {t.coords.lat}, {t.coords.lng}
                  </Text>
                </View>
                <View style={styles.metaChip}>
                  <Gauge size={13} color={Colors.amberLight} />
                  <Text style={Typography.caption}>
                    {t.gapKm === 0 ? 'Lead' : `+${t.gapKm} km gap`}
                  </Text>
                </View>
                <View style={styles.metaChip}>
                  <Battery size={13} color={Colors.green} />
                  <Text style={Typography.caption}>{t.batteryPct}%</Text>
                </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radii.pill,
    backgroundColor: Colors.cyanSoft,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
  },
  chatShortcutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.cyanLight,
  },
  sharingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  radarIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCard: {
    padding: Spacing.md,
    gap: 10,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  svgWrap: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  broadcastToast: {
    backgroundColor: Colors.amberSoft,
    borderColor: Colors.amberBorder,
    borderWidth: 1,
    borderRadius: Radii.sm,
    padding: 10,
  },
  broadcastText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.amberLight,
    textAlign: 'center',
  },
  pingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pingBtn: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pingLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.text,
  },
  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.redSoft,
    borderWidth: 1,
    borderColor: Colors.redBorder,
  },
  sosText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  telemetryCard: {
    gap: 10,
  },
  telemetryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  telemetryMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
})
