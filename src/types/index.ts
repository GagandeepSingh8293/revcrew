export type Region = 'India' | 'Global'
export type RideStatus = 'upcoming' | 'live' | 'completed'
export type Difficulty = 'Chill' | 'Spirited' | 'Hardcore'
export type FormationRole =
  | 'Road Captain'
  | 'Tail Sweep'
  | 'Medic / Toolkit'
  | 'Reel Creator'
  | 'Pack Member'

export type PingType = 'FUEL STOP' | 'CHAI BREAK' | 'HAZARD' | 'ALL CLEAR' | 'SOS'

export interface LatLng {
  lat: number
  lng: number
}

export interface RiderProfile {
  id: string
  handle: string
  fullName: string
  city: string
  country: string
  bike: string
  totalKm: number
  accent: string
  ridingNow?: boolean
}

export interface Waypoint {
  label: string
  km: number
  note?: string
}

export interface RidePlan {
  id: string
  crewId?: string
  captainId: string
  title: string
  routeSummary: string
  description: string
  origin: string
  destination: string
  regionScope: 'Near Me' | 'Global'
  distanceFromYouKm: number
  distanceKm: number
  startTime: string
  meetupLabel: string
  meetupCoords: LatLng
  destinationCoords: LatLng
  openToJoin: boolean
  status: RideStatus
  maxRiders: number
  difficulty: Difficulty
  splitEnabled: boolean
  participantIds: string[]
  waypoints: Waypoint[]
  hashtags: string[]
  gradient: [string, string]
}

export interface FeedPost {
  id: string
  authorId: string
  rideId?: string
  rideTitle?: string
  mediaType: 'photo' | 'video'
  mediaUri?: string
  durationLabel?: string
  gradient: [string, string]
  caption: string
  location: string
  tags: string[]
  likes: number
  likedByMe: boolean
  comments: Array<{
    id: string
    authorId: string
    text: string
    createdAt: string
  }>
  createdAt: string
}

export interface CrewGroup {
  id: string
  name: string
  handle: string
  tagline: string
  description: string
  city: string
  country: string
  region: Region
  ridingStyle: string
  memberCount: number
  ridingNow: number
  verified: boolean
  accent: string
  secondaryAccent: string
  founded: string
  emblem: 'shield' | 'bolt' | 'compass' | 'flame' | 'wings'
  memberIds: string[]
}

export interface ChatChannel {
  id: string
  type: 'ride' | 'crew'
  title: string
  subtitle: string
  crewId?: string
  rideId?: string
  memberIds: string[]
  unread: number
  accent: string
  lastActive: string
}

export type MessageKind = 'text' | 'ping' | 'location' | 'media' | 'system'

export interface ChatMessage {
  id: string
  channelId: string
  senderId: string
  text: string
  kind: MessageKind
  pingType?: PingType
  coords?: LatLng
  createdAt: string
}

export interface ExpenseSettlement {
  userId: string
  amount: number
  settled: boolean
}

export type ExpenseCategory = 'Fuel' | 'Food & Chai' | 'Tolls' | 'Stay' | 'Gear / Repair'

export interface SplitExpense {
  id: string
  rideId: string
  rideTitle: string
  title: string
  category: ExpenseCategory
  paidByUserId: string
  amount: number
  currency: 'INR' | 'USD'
  settlements: ExpenseSettlement[]
  createdAt: string
}

export interface LiveRiderTelemetry {
  userId: string
  formationRole: FormationRole
  progress: number // 0..1 along route
  speedKmh: number
  gapKm: number
  coords: LatLng
  batteryPct: number
  lastPing?: PingType
  sharingLocation: boolean
}

export interface AiItineraryStop {
  time: string
  title: string
  type: 'start' | 'fuel' | 'food' | 'viewpoint' | 'stay' | 'finish'
  kmMark: number
  notes: string
}

export interface AiItineraryDay {
  day: number
  headline: string
  distanceKm: number
  ridingHours: string
  stops: AiItineraryStop[]
}

export interface AiRideItinerary {
  id: string
  title: string
  origin: string
  destination: string
  totalDistanceKm: number
  durationLabel: string
  ridingStyle: Difficulty
  bestDeparture: string
  estimatedCostPerRider: string
  routeHighlights: string[]
  days: AiItineraryDay[]
  checklist: string[]
  generatedBy: 'ai-api' | 'smart-engine'
}
