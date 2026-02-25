-- Herd MVP3 — run this in Supabase Dashboard → SQL Editor

-- Profiles (extends auth.users with display_name, username)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  username text not null default '',
  phone text,
  avatar_id integer not null default 7,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Concerts
create table if not exists public.concerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  artist text not null,
  tour text,
  date text not null,
  venue text,
  city text,
  ticket_type text,
  ticket_price numeric,
  source text default 'manual',
  created_at timestamptz default now()
);

alter table public.concerts enable row level security;

drop policy if exists "Users can manage own concerts" on public.concerts;
create policy "Users can manage own concerts"
  on public.concerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Vinyl
create table if not exists public.vinyl (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  artist_name text not null,
  album_name text not null,
  is_limited_edition boolean default false,
  created_at timestamptz default now()
);

alter table public.vinyl enable row level security;

drop policy if exists "Users can manage own vinyl" on public.vinyl;
create policy "Users can manage own vinyl"
  on public.vinyl for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Merch
create table if not exists public.merch (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  artist_name text not null,
  item_name text not null,
  merch_type text not null,
  is_tour_merch boolean default false,
  tour_name text,
  purchase_price numeric,
  purchase_location text,
  created_at timestamptz default now()
);

alter table public.merch enable row level security;

drop policy if exists "Users can manage own merch" on public.merch;
create policy "Users can manage own merch"
  on public.merch for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Streaming stats (one row per user; top_artists/top_tracks as jsonb)
create table if not exists public.user_streaming_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_hours integer not null default 0,
  total_records integer not null default 0,
  unique_artists integer not null default 0,
  unique_tracks integer not null default 0,
  top_artists jsonb not null default '[]',
  top_tracks jsonb not null default '[]',
  featured_artists jsonb not null default '[]',
  start_date timestamptz,
  end_date timestamptz,
  updated_at timestamptz default now()
);

alter table public.user_streaming_stats enable row level security;

drop policy if exists "Users can manage own streaming stats" on public.user_streaming_stats;
create policy "Users can manage own streaming stats"
  on public.user_streaming_stats for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Add date range columns if missing (for existing DBs that ran schema before this change)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_streaming_stats' and column_name = 'start_date') then
    alter table public.user_streaming_stats add column start_date timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_streaming_stats' and column_name = 'end_date') then
    alter table public.user_streaming_stats add column end_date timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_streaming_stats' and column_name = 'featured_artists') then
    alter table public.user_streaming_stats add column featured_artists jsonb not null default '[]';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_streaming_stats' and column_name = 'artist_minutes_by_month') then
    alter table public.user_streaming_stats add column artist_minutes_by_month jsonb not null default '{}';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_streaming_stats' and column_name = 'track_minutes_by_month') then
    alter table public.user_streaming_stats add column track_minutes_by_month jsonb not null default '{}';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'avatar_id') then
    alter table public.profiles add column avatar_id integer not null default 7;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_youtube' and column_name = 'featured_youtube_channels') then
    alter table public.user_youtube add column featured_youtube_channels jsonb not null default '[]';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_youtube_takeout' and column_name = 'channel_rankings_json') then
    alter table public.user_youtube_takeout add column channel_rankings_json jsonb not null default '[]';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_youtube_takeout' and column_name = 'video_rankings_json') then
    alter table public.user_youtube_takeout add column video_rankings_json jsonb not null default '[]';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_youtube_takeout' and column_name = 'watch_trend_json') then
    alter table public.user_youtube_takeout add column watch_trend_json jsonb not null default '[]';
  end if;
end $$;

-- YouTube (OAuth + cached API data; Takeout can be added later in separate table/columns)
create table if not exists public.user_youtube (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  access_token text,
  token_expires_at timestamptz,
  youtube_channel_id text,
  youtube_channel_title text,
  herd_display_name text,
  herd_email text,
  herd_phone text,
  subscription_count integer not null default 0,
  playlist_count integer not null default 0,
  liked_count integer not null default 0,
  subscriptions_json jsonb not null default '[]',
  playlists_json jsonb not null default '[]',
  liked_videos_json jsonb not null default '[]',
  subscriptions_ranked_by_likes_json jsonb not null default '[]',
  last_fetched_at timestamptz,
  featured_youtube_channels jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_youtube enable row level security;

drop policy if exists "Users can manage own youtube" on public.user_youtube;
create policy "Users can manage own youtube"
  on public.user_youtube for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- YouTube Takeout: watch history import (separate from OAuth API data)
create table if not exists public.user_youtube_takeout (
  user_id uuid primary key references auth.users(id) on delete cascade,
  watch_history_json jsonb not null default '[]',
  video_count integer not null default 0,
  total_watch_minutes numeric not null default 0,
  imported_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_youtube_takeout enable row level security;

drop policy if exists "Users can manage own youtube takeout" on public.user_youtube_takeout;
create policy "Users can manage own youtube takeout"
  on public.user_youtube_takeout for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public view: only featured_youtube_channels for public profiles (no tokens)
create or replace view public.featured_youtube_channels_public as
  select user_id, featured_youtube_channels from public.user_youtube;

alter view public.featured_youtube_channels_public set (security_invoker = false);

grant select on public.featured_youtube_channels_public to anon;
grant select on public.featured_youtube_channels_public to authenticated;

-- Optional: create profile when user signs up (from metadata)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, profiles.display_name),
    username = coalesce(excluded.username, profiles.username),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
