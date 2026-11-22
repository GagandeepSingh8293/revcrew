import React from 'react'
import { Platform } from 'react-native'
import { Tabs } from 'expo-router'
import { Flame, Compass, Radio, Users, Receipt } from 'lucide-react-native'
import { Colors } from '@/theme/tokens'
import { useRevCrewStore } from '@/store/useRevCrewStore'

export default function TabsLayout() {
  const totalUnread = useRevCrewStore((s) =>
    s.channels.reduce((acc, ch) => acc + ch.unread, 0)
  )

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Colors.background },
        tabBarActiveTintColor: Colors.amber,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Flame size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: 'Rides',
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          tabBarIcon: ({ color, size }) => <Radio size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="crews"
        options={{
          title: 'Crews',
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.amber,
            color: '#FFFFFF',
            fontSize: 10,
          },
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="splits"
        options={{
          title: 'Splits',
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
