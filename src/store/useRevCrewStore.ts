import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type {
  RiderProfile,
  RidePlan,
  FeedPost,
  CrewGroup,
  ChatChannel,
  ChatMessage,
  SplitExpense,
  LiveRiderTelemetry,
  PingType,
  ExpenseCategory,
  Difficulty,
  AiRideItinerary,
  LatLng,
} from '@/types'
import {
  CURRENT_USER_ID,
  INITIAL_RIDERS,
  INITIAL_CREWS,
  INITIAL_RIDES,
  INITIAL_POSTS,
  INITIAL_CHANNELS,
  INITIAL_MESSAGES,
  INITIAL_EXPENSES,
  INITIAL_LIVE_TELEMETRY,
} from '@/data/mockData'

interface NewRidePayload {
  title: string
  origin: string
  destination: string
  distanceKm: number
  startTime: string
  meetupLabel: string
  difficulty: Difficulty
  maxRiders: number
  openToJoin: boolean
  description: string
  waypoints?: Array<{ label: string; km: number; note?: string }>
}

interface NewPostPayload {
  caption: string
  location: string
  mediaType: 'photo' | 'video'
  mediaUri?: string
  rideId?: string
  rideTitle?: string
  tags: string[]
}

interface NewExpensePayload {
  rideId: string
  rideTitle: string
  title: string
  category: ExpenseCategory
  paidByUserId: string
  amount: number
  participantIds: string[]
}

interface RevCrewState {
  currentUserId: string
  riders: RiderProfile[]
  crews: CrewGroup[]
  rides: RidePlan[]
  posts: FeedPost[]
  channels: ChatChannel[]
  messages: ChatMessage[]
  expenses: SplitExpense[]
  liveTelemetry: LiveRiderTelemetry[]
  myLiveSharing: boolean
  activeLiveRideId: string
  savedItineraries: AiRideItinerary[]

  toggleJoinRide: (rideId: string) => void
  createRide: (payload: NewRidePayload) => RidePlan
  toggleJoinCrew: (crewId: string) => void
  toggleLikePost: (postId: string) => void
  addCommentToPost: (postId: string, text: string) => void
  createPost: (payload: NewPostPayload) => void
  sendMessage: (
    channelId: string,
    text: string,
    kind?: ChatMessage['kind'],
    extra?: { pingType?: PingType; coords?: LatLng }
  ) => void
  markChannelRead: (channelId: string) => void
  addExpense: (payload: NewExpensePayload) => void
  toggleSettlement: (expenseId: string, userId: string) => void
  setMyLiveSharing: (sharing: boolean, coords?: LatLng) => void
  broadcastRoadPing: (pingType: PingType) => void
  tickLiveTelemetry: () => void
  saveItinerary: (itinerary: AiRideItinerary) => void
}

const GRADIENTS: Array<[string, string]> = [
  ['#7C2D12', '#0E7490'],
  ['#C2410C', '#155E75'],
  ['#065F46', '#0891B2'],
  ['#9A3412', '#312E81'],
  ['#164E63', '#1E293B'],
]

export const useRevCrewStore = create<RevCrewState>()(
  persist(
    (set, get) => ({
      currentUserId: CURRENT_USER_ID,
      riders: INITIAL_RIDERS,
      crews: INITIAL_CREWS,
      rides: INITIAL_RIDES,
      posts: INITIAL_POSTS,
      channels: INITIAL_CHANNELS,
      messages: INITIAL_MESSAGES,
      expenses: INITIAL_EXPENSES,
      liveTelemetry: INITIAL_LIVE_TELEMETRY,
      myLiveSharing: true,
      activeLiveRideId: 'r_kasauli',
      savedItineraries: [],

      toggleJoinRide: (rideId) =>
        set((state) => ({
          rides: state.rides.map((r) => {
            if (r.id !== rideId) return r
            const joined = r.participantIds.includes(state.currentUserId)
            if (joined) {
              return {
                ...r,
                participantIds: r.participantIds.filter((id) => id !== state.currentUserId),
              }
            }
            if (r.participantIds.length >= r.maxRiders) return r
            return {
              ...r,
              participantIds: [...r.participantIds, state.currentUserId],
            }
          }),
        })),

      createRide: (payload) => {
        const id = `r_${Date.now()}`
        const gradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)]
        const newRide: RidePlan = {
          id,
          crewId: 'c_shivalik',
          captainId: get().currentUserId,
          title: payload.title.trim(),
          routeSummary: `${payload.origin.trim()} -> ${payload.destination.trim()}`,
          description: payload.description.trim() || 'Community group ride planned on RevCrew.',
          origin: payload.origin.trim(),
          destination: payload.destination.trim(),
          regionScope: 'Near Me',
          distanceFromYouKm: 1.2,
          distanceKm: payload.distanceKm || 120,
          startTime: payload.startTime.trim() || 'Sun • 06:00 AM',
          meetupLabel: payload.meetupLabel.trim() || `${payload.origin.trim()} Main Plaza`,
          meetupCoords: { lat: 30.7333, lng: 76.7794 },
          destinationCoords: { lat: 30.9, lng: 76.96 },
          openToJoin: payload.openToJoin,
          status: 'upcoming',
          maxRiders: payload.maxRiders || 12,
          difficulty: payload.difficulty,
          splitEnabled: true,
          participantIds: [get().currentUserId],
          waypoints:
            payload.waypoints && payload.waypoints.length > 0
              ? payload.waypoints
              : [
                  { label: `${payload.origin.trim()} Meetup`, km: 0, note: 'Pack briefing' },
                  {
                    label: `${payload.destination.trim()} Finish`,
                    km: payload.distanceKm || 120,
                  },
                ],
          hashtags: ['#RevCrew', payload.openToJoin ? '#OpenToJoin' : '#PackRide'],
          gradient,
        }

        const newChannel: ChatChannel = {
          id: `ch_${id}`,
          type: 'ride',
          title: newRide.title,
          subtitle: `Ride Chat • ${newRide.startTime}`,
          rideId: id,
          memberIds: [get().currentUserId],
          unread: 0,
          accent: '#FF6B1A',
          lastActive: 'Just now',
        }

        set((state) => ({
          rides: [newRide, ...state.rides],
          channels: [newChannel, ...state.channels],
          messages: [
            ...state.messages,
            {
              id: `m_${Date.now()}`,
              channelId: newChannel.id,
              senderId: state.currentUserId,
              text: `Ride room created for ${newRide.title}. Meetup: ${newRide.meetupLabel}.`,
              kind: 'system',
              createdAt: 'Just now',
            },
          ],
        }))

        return newRide
      },

      toggleJoinCrew: (crewId) =>
        set((state) => {
          const crew = state.crews.find((c) => c.id === crewId)
          if (!crew) return state
          const isMember = crew.memberIds.includes(state.currentUserId)
          const updatedCrews = state.crews.map((c) => {
            if (c.id !== crewId) return c
            return {
              ...c,
              memberIds: isMember
                ? c.memberIds.filter((id) => id !== state.currentUserId)
                : [...c.memberIds, state.currentUserId],
              memberCount: isMember ? c.memberCount - 1 : c.memberCount + 1,
            }
          })

          let updatedChannels = state.channels
          const existingChannel = state.channels.find((ch) => ch.crewId === crewId)
          if (!isMember && !existingChannel) {
            updatedChannels = [
              {
                id: `ch_${crewId}`,
                type: 'crew',
                title: crew.name,
                subtitle: `${crew.memberCount + 1} members • ${crew.city}`,
                crewId,
                memberIds: [...crew.memberIds, state.currentUserId],
                unread: 1,
                accent: crew.accent,
                lastActive: 'Just now',
              },
              ...state.channels,
            ]
          }
          return { crews: updatedCrews, channels: updatedChannels }
        }),

      toggleLikePost: (postId) =>
        set((state) => ({
          posts: state.posts.map((p) => {
            if (p.id !== postId) return p
            const nextLiked = !p.likedByMe
            return {
              ...p,
              likedByMe: nextLiked,
              likes: nextLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
            }
          }),
        })),

      addCommentToPost: (postId, text) => {
        const trimmed = text.trim()
        if (!trimmed) return
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: [
                    ...p.comments,
                    {
                      id: `cm_${Date.now()}`,
                      authorId: state.currentUserId,
                      text: trimmed,
                      createdAt: 'Just now',
                    },
                  ],
                }
              : p
          ),
        }))
      },

      createPost: (payload) =>
        set((state) => ({
          posts: [
            {
              id: `p_${Date.now()}`,
              authorId: state.currentUserId,
              rideId: payload.rideId,
              rideTitle: payload.rideTitle,
              mediaType: payload.mediaType,
              mediaUri: payload.mediaUri,
              durationLabel: payload.mediaType === 'video' ? '0:24 REEL' : undefined,
              gradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
              caption: payload.caption.trim(),
              location: payload.location.trim() || 'On the Road',
              tags: payload.tags.length > 0 ? payload.tags : ['#RevCrew'],
              likes: 1,
              likedByMe: true,
              comments: [],
              createdAt: 'Just now',
            },
            ...state.posts,
          ],
        })),

      sendMessage: (channelId, text, kind = 'text', extra) => {
        const trimmed = text.trim()
        if (!trimmed) return
        const now = new Date()
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: `m_${Date.now()}`,
              channelId,
              senderId: state.currentUserId,
              text: trimmed,
              kind,
              pingType: extra?.pingType,
              coords: extra?.coords,
              createdAt: timeStr,
            },
          ],
          channels: state.channels.map((ch) =>
            ch.id === channelId ? { ...ch, lastActive: 'Just now', unread: 0 } : ch
          ),
        }))
      },

      markChannelRead: (channelId) =>
        set((state) => ({
          channels: state.channels.map((ch) =>
            ch.id === channelId ? { ...ch, unread: 0 } : ch
          ),
        })),

      addExpense: (payload) => {
        const count = Math.max(1, payload.participantIds.length)
        const perHead = Math.round(payload.amount / count)
        const newExpense: SplitExpense = {
          id: `ex_${Date.now()}`,
          rideId: payload.rideId,
          rideTitle: payload.rideTitle,
          title: payload.title.trim(),
          category: payload.category,
          paidByUserId: payload.paidByUserId,
          amount: payload.amount,
          currency: 'INR',
          settlements: payload.participantIds.map((uid) => ({
            userId: uid,
            amount: perHead,
            settled: uid === payload.paidByUserId,
          })),
          createdAt: 'Just now',
        }
        set((state) => ({
          expenses: [newExpense, ...state.expenses],
        }))
      },

      toggleSettlement: (expenseId, userId) =>
        set((state) => ({
          expenses: state.expenses.map((ex) => {
            if (ex.id !== expenseId) return ex
            return {
              ...ex,
              settlements: ex.settlements.map((s) =>
                s.userId === userId ? { ...s, settled: !s.settled } : s
              ),
            }
          }),
        })),

      setMyLiveSharing: (sharing, coords) =>
        set((state) => ({
          myLiveSharing: sharing,
          liveTelemetry: state.liveTelemetry.map((t) =>
            t.userId === state.currentUserId
              ? {
                  ...t,
                  sharingLocation: sharing,
                  coords: coords || t.coords,
                  speedKmh: sharing ? Math.max(t.speedKmh, 62) : 0,
                }
              : t
          ),
        })),

      broadcastRoadPing: (pingType) => {
        const state = get()
        const channelId = 'ch_kasauli'
        const pingDescriptions: Record<PingType, string> = {
          'FUEL STOP': 'Requesting fuel pit stop at the next station.',
          'CHAI BREAK': 'Calling a 15-min chai & stretch break ahead.',
          HAZARD: 'Road hazard / gravel ahead — slow down & hold line!',
          'ALL CLEAR': 'Clear road ahead, safe to maintain cruise pace.',
          SOS: 'EMERGENCY SOS — Rider stopped and needs immediate pack assistance!',
        }
        state.sendMessage(channelId, pingDescriptions[pingType], 'ping', { pingType })
        set((s) => ({
          liveTelemetry: s.liveTelemetry.map((t) =>
            t.userId === s.currentUserId ? { ...t, lastPing: pingType } : t
          ),
        }))
      },

      tickLiveTelemetry: () =>
        set((state) => ({
          liveTelemetry: state.liveTelemetry.map((t) => {
            if (!t.sharingLocation) return t
            const delta = 0.008 + Math.random() * 0.007
            const nextProgress = t.progress + delta > 0.94 ? 0.25 : t.progress + delta
            const nextSpeed = Math.max(
              48,
              Math.min(98, Math.round(t.speedKmh + (Math.random() - 0.5) * 8))
            )
            return {
              ...t,
              progress: nextProgress,
              speedKmh: nextSpeed,
              coords: {
                lat: Number((t.coords.lat + (Math.random() - 0.45) * 0.0008).toFixed(4)),
                lng: Number((t.coords.lng + (Math.random() - 0.45) * 0.0008).toFixed(4)),
              },
            }
          }),
        })),

      saveItinerary: (itinerary) =>
        set((state) => ({
          savedItineraries: [itinerary, ...state.savedItineraries].slice(0, 10),
        })),
    }),
    {
      name: 'revcrew-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
