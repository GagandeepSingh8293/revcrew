import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || ''

export const isSupabaseConfigured = Boolean(
  supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20
)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null

/**
 * Subscribe to Supabase Realtime broadcasts for a live ride's pack locations.
 * Automatically no-ops cleanly in Offline / Demo mode.
 */
export function subscribeToLivePack(
  rideId: string,
  onLocationUpdate: (payload: {
    userId: string
    lat: number
    lng: number
    speedKmh: number
  }) => void
) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel(`live-pack:${rideId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'live_locations',
        filter: `ride_id=eq.${rideId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown> | null
        if (!row) return
        onLocationUpdate({
          userId: String(row.user_id || ''),
          lat: Number(row.lat || 0),
          lng: Number(row.lng || 0),
          speedKmh: Number(row.speed_kmh || 0),
        })
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

/**
 * Subscribe to Supabase Realtime messages for a group chat channel.
 */
export function subscribeToChatChannel(
  channelId: string,
  onMessage: (row: Record<string, unknown>) => void
) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel(`chat:${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        if (payload.new) onMessage(payload.new as Record<string, unknown>)
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
