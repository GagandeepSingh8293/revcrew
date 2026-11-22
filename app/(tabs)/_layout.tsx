import React from 'react'
import { StyleSheet, View, Pressable, Text, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Tabs } from 'expo-router'
import { Flame, Compass, Radio, Users, Receipt } from 'lucide-react-native'
import { Colors, Radii, Shadows } from '@/theme/tokens'
import { triggerHaptic } from '@/lib/haptics'
import { useRevCrewStore } from '@/store/useRevCrewStore'

const TABS = [
  { name: 'home', label: 'Feed', Icon: Flame },
  { name: 'rides', label: 'Rides', Icon: Compass },
  { name: 'live', label: 'Live', Icon: Radio },
  { name: 'crews', label: 'Crews', Icon: Users },
  { name: 'splits', label: 'Splits', Icon: Receipt },
]

function FloatingTabBar({ state, navigation }: any) {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const myLiveSharing = useRevCrewStore((s) => s.myLiveSharing)
  const totalUnread = useRevCrewStore((s) =>
    s.channels.reduce((acc, ch) => acc + ch.unread, 0)
  )

  const containerWidth = Math.min(width - 24, 440)
  const bottomInset = Math.max(12, (insets.bottom || 0) + 6)

  return (
    <View style={[styles.floatingWrapper, { bottom: bottomInset }]} pointerEvents="box-none">
      <View style={[styles.barContainer, { width: containerWidth }]}>
        {state.routes.map((route: { key: string; name: string }, index: number) => {
          const tab = TABS.find((t) => t.name === route.name) || TABS[index]
          if (!tab) return null
          const isFocused = state.index === index
          const { Icon, label } = tab

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                triggerHaptic('selection')
                if (!isFocused) navigation.navigate(route.name)
              }}
              style={[styles.tabButton, isFocused && styles.tabButtonActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
            >
              <View style={styles.iconWrap}>
                <Icon
                  size={20}
                  color={isFocused ? Colors.amber : Colors.textMuted}
                />
                {tab.name === 'live' && myLiveSharing ? (
                  <View style={styles.livePulseDot} />
                ) : null}
                {tab.name === 'crews' && totalUnread > 0 ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isFocused ? styles.activeLabel : styles.inactiveLabel,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Colors.background },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Feed' }} />
      <Tabs.Screen name="rides" options={{ title: 'Rides' }} />
      <Tabs.Screen name="live" options={{ title: 'Live' }} />
      <Tabs.Screen name="crews" options={{ title: 'Crews' }} />
      <Tabs.Screen name="splits" options={{ title: 'Splits' }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  barContainer: {
    height: 66,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(15, 18, 24, 0.96)',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    ...Shadows.card,
  },
  tabButton: {
    flex: 1,
    height: 52,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: Colors.amberSoft,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePulseDot: {
    position: 'absolute',
    top: -2,
    right: -5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.cyan,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  unreadBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: Colors.amberLight,
    fontWeight: '700',
  },
  inactiveLabel: {
    color: Colors.textMuted,
    fontWeight: '500',
  },
})
