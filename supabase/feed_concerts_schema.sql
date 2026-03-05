-- Feed "Concerts recommended for you" cache: one row per user, updated on first load or when user clicks Update.
-- Run in Supabase Dashboard → SQL Editor.

create table if not exists public.feed_concerts_cache (
  user_id uuid primary key references auth.users(id) on delete cascade,
  events_json jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.feed_concerts_cache enable row level security;

drop policy if exists "Users can read own feed_concerts_cache" on public.feed_concerts_cache;
create policy "Users can read own feed_concerts_cache"
  on public.feed_concerts_cache for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own feed_concerts_cache" on public.feed_concerts_cache;
create policy "Users can insert own feed_concerts_cache"
  on public.feed_concerts_cache for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own feed_concerts_cache" on public.feed_concerts_cache;
create policy "Users can update own feed_concerts_cache"
  on public.feed_concerts_cache for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
