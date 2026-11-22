import React from 'react'
import { StyleSheet, View, Pressable, Text } from 'react-native'
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

function DockedPillTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets()
  const myLiveSharing = useRevCrewStore((s) => s.myLiveSharing)
  const totalUnread = useRevCrewStore((s) =>
    s.channels.reduce((acc, ch) => acc + ch.unread, 0)
  )

  const bottomPad = Math.max(10, insets.bottom || 0)

  return (
    <View style={[styles.dockWrapper, { paddingBottom: bottomPad }]}>
      <View style={styles.barContainer}>
        {state.routes.map((route: { key: string; name: string; params?: any }, index: number) => {
          const tab = TABS.find((t) => t.name === route.name) || TABS[index]
          if (!tab) return null
          const isFocused = state.index === index
          const { Icon, label } = tab

          const onPress = () => {
            triggerHaptic('selection')
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params)
            }
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              hitSlop={6}
              style={({ pressed }) => [
                styles.tabButton,
                isFocused && styles.tabButtonActive,
                pressed && { opacity: 0.78 },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={`${label} Tab`}
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
      tabBar={(props) => <DockedPillTabBar {...props} />}
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
  dockWrapper: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  barContainer: {
    height: 62,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    ...Shadows.card,
  },
  tabButton: {
    flex: 1,
    height: 50,
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
