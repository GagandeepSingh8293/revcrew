-- RevCrew Community Rider Platform — Supabase PostgreSQL Schema
-- Covers: Profiles, Global Crews, Ride Plans (Open to Join), Community Media Feed (Photos/Videos),
-- Realtime Group Chat, Live Location Sharing, Split Expenses, AI Itineraries, Crew Banners & Storage.

create extension if not exists pgcrypto;

-- 1. Rider Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null,
  full_name text not null,
  city text not null default '',
  country text not null default '',
  bike text not null default '',
  total_km integer not null default 0,
  accent text not null default '#FF6B1A',
  riding_now boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Global Crews / Groups
create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  handle text unique not null,
  tagline text not null default '',
  description text not null default '',
  city text not null default '',
  country text not null default '',
  region text not null default 'Global' check (region in ('India', 'Global')),
  riding_style text not null default 'Touring',
  verified boolean not null default false,
  accent text not null default '#FF6B1A',
  secondary_accent text not null default '#06B6D4',
  emblem text not null default 'shield' check (emblem in ('shield', 'bolt', 'compass', 'flame', 'wings')),
  founded text not null default '2026',
  banner_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.crew_members (
  crew_id uuid not null references public.crews(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'captain', 'member')),
  joined_at timestamptz not null default now(),
  primary key (crew_id, user_id)
);

-- 3. Ride Plans (with Open to Join status)
create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid references public.crews(id) on delete set null,
  captain_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  route_summary text not null,
  description text not null default '',
  origin text not null,
  destination text not null,
  region_scope text not null default 'Near Me' check (region_scope in ('Near Me', 'Global')),
  distance_km integer not null default 0,
  start_time text not null,
  meetup_label text not null,
  meetup_lat double precision,
  meetup_lng double precision,
  dest_lat double precision,
  dest_lng double precision,
  open_to_join boolean not null default true,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'completed')),
  max_riders integer not null default 12,
  difficulty text not null default 'Spirited' check (difficulty in ('Chill', 'Spirited', 'Hardcore')),
  split_enabled boolean not null default true,
  waypoints jsonb not null default '[]'::jsonb,
  hashtags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.ride_participants (
  ride_id uuid not null references public.rides(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  formation_role text not null default 'Pack Member',
  rsvp_status text not null default 'going' check (rsvp_status in ('going', 'maybe', 'out')),
  joined_at timestamptz not null default now(),
  primary key (ride_id, user_id)
);

-- 4. Community Photos & Videos Feed
create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  ride_id uuid references public.rides(id) on delete set null,
  media_type text not null check (media_type in ('photo', 'video')),
  media_url text not null,
  caption text not null default '',
  location text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.feed_likes (
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.feed_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- 5. Group Chat Channels & Realtime Messages
create table if not exists public.chat_channels (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('ride', 'crew')),
  title text not null,
  subtitle text not null default '',
  ride_id uuid references public.rides(id) on delete cascade,
  crew_id uuid references public.crews(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  kind text not null default 'text' check (kind in ('text', 'ping', 'location', 'media', 'system')),
  ping_type text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

-- 6. Live Location Sharing Telemetry
create table if not exists public.live_locations (
  ride_id uuid not null references public.rides(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  speed_kmh integer not null default 0,
  battery_pct integer not null default 100,
  last_ping text,
  sharing_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (ride_id, user_id)
);

-- 7. Split Payments / Ride Expenses
create table if not exists public.split_expenses (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  paid_by_user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null default 'Fuel',
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'INR',
  created_at timestamptz not null default now()
);

create table if not exists public.expense_settlements (
  expense_id uuid not null references public.split_expenses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  share_amount numeric(12, 2) not null check (share_amount >= 0),
  settled boolean not null default false,
  settled_at timestamptz,
  primary key (expense_id, user_id)
);

-- 8. Saved AI Ride Itineraries
create table if not exists public.ai_itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  origin text not null,
  destination text not null,
  total_distance_km integer not null default 0,
  itinerary_json jsonb not null,
  created_at timestamptz not null default now()
);

-- Indexes on foreign keys & hot query paths
create index if not exists idx_crew_members_user on public.crew_members(user_id);
create index if not exists idx_rides_open_status on public.rides(open_to_join, status, created_at desc);
create index if not exists idx_rides_captain on public.rides(captain_id);
create index if not exists idx_ride_participants_user on public.ride_participants(user_id);
create index if not exists idx_feed_posts_created on public.feed_posts(created_at desc);
create index if not exists idx_feed_comments_post on public.feed_comments(post_id, created_at asc);
create index if not exists idx_chat_messages_channel on public.chat_messages(channel_id, created_at asc);
create index if not exists idx_live_locations_ride on public.live_locations(ride_id, updated_at desc);
create index if not exists idx_split_expenses_ride on public.split_expenses(ride_id, created_at desc);
create index if not exists idx_expense_settlements_user on public.expense_settlements(user_id);
create index if not exists idx_ai_itineraries_user on public.ai_itineraries(user_id, created_at desc);

-- Enable Row-Level Security on ALL public tables
alter table public.profiles enable row level security;
alter table public.crews enable row level security;
alter table public.crew_members enable row level security;
alter table public.rides enable row level security;
alter table public.ride_participants enable row level security;
alter table public.feed_posts enable row level security;
alter table public.feed_likes enable row level security;
alter table public.feed_comments enable row level security;
alter table public.chat_channels enable row level security;
alter table public.chat_messages enable row level security;
alter table public.live_locations enable row level security;
alter table public.split_expenses enable row level security;
alter table public.expense_settlements enable row level security;
alter table public.ai_itineraries enable row level security;

-- RLS Policies (using TO authenticated/anon and (select auth.uid()) for performance)
create policy "profiles_select_all" on public.profiles for select to authenticated, anon using (true);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "crews_select_all" on public.crews for select to authenticated, anon using (true);
create policy "crews_insert_auth" on public.crews for insert to authenticated with check ((select auth.uid()) = created_by);
create policy "crews_update_owner" on public.crews for update to authenticated using ((select auth.uid()) = created_by) with check ((select auth.uid()) = created_by);

create policy "crew_members_select_all" on public.crew_members for select to authenticated, anon using (true);
create policy "crew_members_insert_own" on public.crew_members for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "crew_members_delete_own" on public.crew_members for delete to authenticated using ((select auth.uid()) = user_id);

create policy "rides_select_all" on public.rides for select to authenticated, anon using (true);
create policy "rides_insert_captain" on public.rides for insert to authenticated with check ((select auth.uid()) = captain_id);
create policy "rides_update_captain" on public.rides for update to authenticated using ((select auth.uid()) = captain_id) with check ((select auth.uid()) = captain_id);

create policy "ride_participants_select_all" on public.ride_participants for select to authenticated, anon using (true);
create policy "ride_participants_insert_own" on public.ride_participants for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ride_participants_delete_own" on public.ride_participants for delete to authenticated using ((select auth.uid()) = user_id);

create policy "feed_posts_select_all" on public.feed_posts for select to authenticated, anon using (true);
create policy "feed_posts_insert_own" on public.feed_posts for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "feed_posts_delete_own" on public.feed_posts for delete to authenticated using ((select auth.uid()) = author_id);

create policy "feed_likes_select_all" on public.feed_likes for select to authenticated, anon using (true);
create policy "feed_likes_insert_own" on public.feed_likes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "feed_likes_delete_own" on public.feed_likes for delete to authenticated using ((select auth.uid()) = user_id);

create policy "feed_comments_select_all" on public.feed_comments for select to authenticated, anon using (true);
create policy "feed_comments_insert_own" on public.feed_comments for insert to authenticated with check ((select auth.uid()) = author_id);

create policy "chat_channels_select_auth" on public.chat_channels for select to authenticated using (true);
create policy "chat_messages_select_auth" on public.chat_messages for select to authenticated using (true);
create policy "chat_messages_insert_own" on public.chat_messages for insert to authenticated with check ((select auth.uid()) = sender_id);

create policy "live_locations_select_auth" on public.live_locations for select to authenticated using (true);
create policy "live_locations_insert_own" on public.live_locations for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "live_locations_update_own" on public.live_locations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "split_expenses_select_auth" on public.split_expenses for select to authenticated using (true);
create policy "split_expenses_insert_own" on public.split_expenses for insert to authenticated with check ((select auth.uid()) = paid_by_user_id);

create policy "expense_settlements_select_auth" on public.expense_settlements for select to authenticated using (true);
create policy "expense_settlements_update_own" on public.expense_settlements for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "ai_itineraries_select_own" on public.ai_itineraries for select to authenticated using ((select auth.uid()) = user_id);
create policy "ai_itineraries_insert_own" on public.ai_itineraries for insert to authenticated with check ((select auth.uid()) = user_id);

-- Enable Realtime on live chat & live location tables
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.live_locations;

-- Storage buckets for ride photos/videos and exported crew banners
insert into storage.buckets (id, name, public)
values
  ('ride-media', 'ride-media', true),
  ('crew-banners', 'crew-banners', true)
on conflict (id) do nothing;

create policy "storage_ride_media_select" on storage.objects for select to authenticated, anon using (bucket_id in ('ride-media', 'crew-banners'));
create policy "storage_ride_media_insert" on storage.objects for insert to authenticated with check (bucket_id in ('ride-media', 'crew-banners') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "storage_ride_media_update" on storage.objects for update to authenticated using (bucket_id in ('ride-media', 'crew-banners') and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id in ('ride-media', 'crew-banners'));
