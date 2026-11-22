# RevCrew — Motorcycle Rider Community App (Android & iOS)

**RevCrew** is a cross-platform mobile community app for bike riders built with **Expo (React Native) + TypeScript + Supabase**, designed with a **Dark Asphalt (`#08090C`) + Fiery Amber (`#FF6B1A`) + Electric Cyan (`#06B6D4`)** visual identity.

It works immediately out of the box in **Offline / Demo mode** (so your APK is 100% interactive right away) and seamlessly connects to **Supabase** for Auth, Realtime Group Chat, Live GPS Location Sync, and Media Storage.

## Features
- **Community Feed (Photos & Videos)**: Upload photos/videos from your gallery, tag rides, like, comment, and share highlights.
- **Nearby & Global Rides ("Open to Join")**: Filter by `Near Me`, `Global`, and `Open to Join`, view open rider slots, create & share new ride plans, and join with one tap.
- **Live Location Sharing & Pack Radar**: Toggle live GPS sharing (`expo-location`), watch pack riders move in real time on the Pack Radar map with speed/gap/battery telemetry, and send one-tap road pings (`FUEL STOP`, `CHAI BREAK`, `HAZARD`, `ALL CLEAR`, `SOS`).
- **Group Chat**: Dedicated Ride & Crew chat rooms with quick road pings and live GPS pin sharing.
- **Split Payments**: Log group fuel, dhaba/food, tolls, or stay bills, split equally across selected riders, track Paid/Pending per rider, and share UPI payment reminders.
- **Global Rider Groups**: Browse & join India and Global riding chapters.
- **AI Ride Itinerary Planner**: Generate a complete day-by-day ride itinerary (fuel pits, food stops, viewpoints, stays, packing checklist) with optional OpenAI-compatible API key or built-in offline engine, and publish it directly as an Open Ride.
- **Crew Group Banner Studio**: Design custom crew posters/banners (name, tagline, crest emblem, theme gradient, ride callout) and export/share as a PNG image.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run locally
npm run start     # Expo Go QR code (Android & iOS)
npm run web       # Instant browser preview
npm run typecheck # TypeScript verification
```

## Connect Supabase (Optional — Live Sync)
1. Create a Supabase project and run the SQL migration in [`supabase/migrations/20261122000000_revcrew_schema.sql`](supabase/migrations/20261122000000_revcrew_schema.sql).
2. Copy `.env.example` to `.env.local` and fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. Optionally add `EXPO_PUBLIC_AI_API_KEY` to power the AI Ride Planner with a live LLM.

## Build Android APK Now (and Play Store / App Store Later)

RevCrew is pre-configured with `eas.json` for cloud builds via **Expo Application Services (EAS)** — no local Android Studio or Xcode required:

```bash
# Install EAS CLI once & log in
npm install -g eas-cli
eas login

# 1. Build installable Android APK for direct sharing/testing
npm run build:apk

# 2. Later: Production builds for Google Play Store (.aab) & Apple App Store (.ipa)
npm run build:prod:android
npm run build:prod:ios
```
