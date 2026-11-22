# RevCrew — System & Technical Architecture

This document describes the complete client, backend, real-time, storage, AI, and build/release architecture of **RevCrew**.

---

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph MobileClient["RevCrew Mobile App (Android & iOS — React Native 0.88 / Expo SDK 58)"]
        UI["Expo Router File-Based Screens\n(Auth, 5 Tabs, AI Planner, Banner Studio, Chat, Ride Detail)"]
        Media["Native Media & Sensors\n(expo-video, expo-image-picker, expo-location,\nreact-native-view-shot, expo-sharing)"]
        Store["Zustand State Store + AsyncStorage\n(Local-First Persistence & Offline Fallback)"]
        AIEngine["Dual-Mode AI Planner\n(OpenAI-Compatible LLM API + Smart Offline Engine)"]
        SBClient["Supabase JS Client\n(Auth, PostgREST, Realtime WS, Storage)"]

        UI --> Store
        UI --> Media
        UI --> AIEngine
        Store <--> SBClient
    end

    subgraph SupabaseCloud["Supabase Backend (Project: fpqwuqoxdcuxyfsgtcsw)"]
        SBAuth["Supabase Auth\n(Email/Password JWT Sessions)"]
        Postgres["PostgreSQL Database\n(14 Tables + Row-Level Security + Indexes)"]
        Realtime["Supabase Realtime Engine\n(WebSocket Postgres Changes)"]
        Storage["Supabase Storage Buckets\n(ride-media, crew-banners)"]

        SBAuth --> Postgres
        Postgres --> Realtime
    end

    subgraph ExternalServices["Optional External Services"]
        LLM["LLM Provider API\n(OpenAI / Gemini / Compatible)"]
        GitHub["GitHub Actions & Releases\n(Automated APK CI/CD)"]
    end

    SBClient <--> SBAuth
    SBClient <--> Postgres
    SBClient <--> Realtime
    SBClient <--> Storage
    AIEngine -. "If API Key Configured" .-> LLM
    MobileClient -. "Native Gradle Build" .-> GitHub
```

---

## 2. Client App Routing & State Architecture

```mermaid
flowchart LR
    Root["app/_layout.tsx\n(Fonts, GestureHandler, ErrorBoundary)"] --> Gate["app/index.tsx\n(Auth Guard)"]
    Gate -- "Unauthenticated" --> AuthStack["app/auth/\n• login.tsx\n• signup.tsx"]
    Gate -- "Authenticated / Demo" --> TabNav["app/(tabs)/_layout.tsx\n(Native Bottom Tabs)"]

    TabNav --> T1["home.tsx\nFeed + MediaViewerModal"]
    TabNav --> T2["rides.tsx\nNearby & Open Rides"]
    TabNav --> T3["live.tsx\nLive GPS Pack Radar"]
    TabNav --> T4["crews.tsx\nGlobal Groups & Chats"]
    TabNav --> T5["splits.tsx\nSplit Payments Ledger"]

    Root --> Modals["Stack & Modal Routes\n• app/ai-planner.tsx\n• app/banner-studio.tsx\n• app/chat/[channelId].tsx\n• app/ride/[id].tsx"]
```

### Key Client Design Decisions
- **Local-First Zustand + AsyncStorage (`src/store/useRevCrewStore.ts`)**: All rides, posts, chats, crew memberships, splits, and live telemetry work immediately offline and persist across app restarts.
- **Native Tab Navigation (`app/(tabs)/_layout.tsx`)**: Uses React Navigation's native `<Tabs>` bar for zero touch-clipping and reliable Android/iOS switching.
- **Error Boundary (`app/_layout.tsx`)**: Catches unexpected runtime errors cleanly with a dark recovery UI instead of hard-crashing.
- **Native Media Stack**:
  - `expo-video` (`VideoView` + `useVideoPlayer`) for hardware-accelerated video reel playback.
  - `expo-image-picker` for photo/video uploads from gallery.
  - `expo-location` for live GPS coordinates with simulated telemetry fallback on emulators.
  - `react-native-view-shot` + `expo-sharing` for high-resolution PNG Crew Banner export.

---

## 3. Supabase PostgreSQL Database Schema (ER Diagram)

All 14 tables live in the `public` schema with **Row-Level Security (RLS)** enabled and verified with **0 security advisor warnings**.

```mermaid
erDiagram
    PROFILES ||--o{ CREWS : creates
    PROFILES ||--o{ CREW_MEMBERS : joins
    CREWS ||--o{ CREW_MEMBERS : has
    PROFILES ||--o{ RIDES : captains
    CREWS ||--o{ RIDES : organizes
    RIDES ||--o{ RIDE_PARTICIPANTS : includes
    PROFILES ||--o{ RIDE_PARTICIPANTS : rsvps
    PROFILES ||--o{ FEED_POSTS : posts
    RIDES ||--o{ FEED_POSTS : featured_in
    FEED_POSTS ||--o{ FEED_LIKES : receives
    FEED_POSTS ||--o{ FEED_COMMENTS : has
    RIDES ||--o{ CHAT_CHANNELS : owns
    CREWS ||--o{ CHAT_CHANNELS : owns
    CHAT_CHANNELS ||--o{ CHAT_MESSAGES : contains
    RIDES ||--o{ LIVE_LOCATIONS : tracks
    PROFILES ||--o{ LIVE_LOCATIONS : broadcasts
    RIDES ||--o{ SPLIT_EXPENSES : incurs
    SPLIT_EXPENSES ||--o{ EXPENSE_SETTLEMENTS : splits_into
    PROFILES ||--o{ AI_ITINERARIES : saves
```

### Realtime & Storage Channels
- **Realtime (`supabase_realtime` publication):**
  - `public.chat_messages` → Instant group chat & road pings (`FUEL STOP`, `CHAI BREAK`, `HAZARD`, `ALL CLEAR`, `SOS`).
  - `public.live_locations` → Live rider GPS coordinates, speed (km/h), and battery % on the Pack Radar.
- **Storage Buckets:**
  - `ride-media` (public read, owner-scoped authenticated upload/update)
  - `crew-banners` (public read, owner-scoped authenticated upload/update)

---

## 4. Build, Signing & Release Pipeline

```mermaid
flowchart LR
    Code["TypeScript Source\n(app/ + src/)"] --> Check["tsc --noEmit\n(0 Errors)"]
    Check --> Prebuild["expo prebuild --platform android\n(Generates Native android/ Gradle Project)"]
    Prebuild --> Gradle["./gradlew assembleRelease\n(JDK 21 + Android SDK 37 + Hermes JS)"]
    Gradle --> Verify["apksigner.jar verify\n(APK Signature Scheme v2)"]
    Verify --> Release["GitHub Release\nRevCrew.apk (Direct Download)"]
    Gradle -. "Future Store Release" .-> Stores["Google Play (.aab)\nApple App Store (.ipa)"]
```

| Environment | Build Command | Output |
|---|---|---|
| **Local Android APK (No Expo Cloud)** | `android/gradlew -p android assembleRelease` | `RevCrew.apk` (arm64-v8a) |
| **GitHub Actions CI** | `.github/workflows/build-apk.yml` | Downloadable APK artifact on push |
| **Google Play Store (Future)** | `android/gradlew -p android bundleRelease` | `app-release.aab` |
| **Apple App Store (Future)** | `npx expo prebuild --platform ios` + Xcode Archive | `.ipa` via App Store Connect |
