-- Run this in Supabase Dashboard → SQL Editor.
-- Badges system: master badge definitions + user-earned badges + public view.

-- 1) Master list of badges (one row per badge type)
create table if not exists public.badges (
  key text primary key,
  name text not null,
  category text not null,
  description text,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.badges enable row level security;

drop policy if exists "Badges are readable by all" on public.badges;
create policy "Badges are readable by all"
  on public.badges for select
  using (true);

-- 2) User-earned badges (joins a user to a badge key)
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null references public.badges(key) on delete cascade,
  earned_at timestamptz not null default now(),
  is_public boolean not null default false,
  metadata jsonb
);

alter table public.user_badges enable row level security;

drop policy if exists "Users can manage own badges" on public.user_badges;
create policy "Users can manage own badges"
  on public.user_badges for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3) Public view: only badges a user has chosen to show on their public profile
create or replace view public.user_badges_public as
  select user_id, badge_key, earned_at, metadata
  from public.user_badges
  where is_public = true;

alter view public.user_badges_public set (security_invoker = false);

grant select on public.user_badges_public to anon;
grant select on public.user_badges_public to authenticated;

-- 4) Seed / upsert core badge definitions so the app has a stable set of keys.
insert into public.badges (key, name, category, description, icon, sort_order)
values
  -- Fan Tier / streaming-based fan depth (placeholders for future platform-wide logic)
  ('fan_superfan_all_users_top_10', 'Top 10% Superfan (All Fans)', 'Fan Tier', 'In the top 10% of listeners for an artist across Herd.', '🏆', 10),
  ('fan_superfan_fan_club_top_10', 'Top 10% Superfan (Fan Club)', 'Fan Tier', 'In the top 10% of listeners for an artist inside their fan club.', '🏅', 11),

  -- Streaming (per-user only; computed from user_streaming_stats)
  ('streams_most_streamed_artist', 'Most Streamed Artist', 'Streams', 'Your #1 artist from your streaming history.', '🎧', 20),
  ('streams_most_streamed_song', 'Most Streamed Song', 'Streams', 'Your #1 song from your streaming history.', '🎵', 21),
  ('streams_100_hours', '100 Hours Listened', 'Streams', 'Listened to at least 100 hours of music.', '⏱️', 22),
  ('streams_500_hours', '500 Hours Listened', 'Streams', 'Listened to at least 500 hours of music.', '🔥', 23),

  -- YouTube (per-user; computed from Takeout / API aggregates)
  ('yt_most_viewed_channel', 'Most Viewed Channel', 'YouTube', 'Your most watched YouTube channel.', '▶️', 30),
  ('yt_most_viewed_video', 'Most Viewed Video', 'YouTube', 'Your most watched YouTube video.', '📺', 31),
  ('yt_binge_watcher', 'Binge Watcher', 'YouTube', 'Watched at least 1,000 minutes of YouTube.', '🍿', 32),

  -- Tickets / Live (from concerts table)
  ('tickets_first_concert', 'First Concert', 'Tickets', 'Added your first concert.', '🎫', 40),
  ('tickets_5_concerts', '5 Concerts', 'Tickets', 'Added 5 concerts.', '🎟️', 41),
  ('tickets_10_concerts', '10 Concerts', 'Tickets', 'Added 10 concerts.', '🏟️', 42),
  ('tickets_groupie', 'Groupie', 'Tickets', 'Seen the same artist live at least 3 times.', '🤘', 43),

  -- Merch / Physical (from merch table)
  ('merch_first_item', 'First Merch', 'Merch', 'Added your first piece of merch.', '👕', 50),
  ('merch_5_items', '5 Merch Items', 'Merch', 'Added 5 pieces of merch.', '🛍️', 51),
  ('merch_10_items', '10 Merch Items', 'Merch', 'Added 10 pieces of merch.', '📦', 52),
  ('merch_collector', 'Collector', 'Merch', 'Own at least 3 pieces of merch from the same artist.', '💎', 53),

  -- Social / Friends (from user_follows follower counts)
  ('social_first_friend', 'First Friend', 'Social', 'Followed by your first friend on Herd.', '🤝', 60),
  ('social_10_friends', '10 Friends', 'Social', 'Followed by 10 friends on Herd.', '👥', 61),
  ('social_50_friends', '50 Friends', 'Social', 'Followed by 50 friends on Herd.', '🌟', 62),
  ('social_100_friends', '100 Friends', 'Social', 'Followed by 100 friends on Herd.', '🚀', 63),
  ('social_1000_friends', '1000 Friends', 'Social', 'Followed by 1000 friends on Herd.', '🌎', 64)
on conflict (key) do update
set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  updated_at = now();

