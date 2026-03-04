-- Run this in Supabase Dashboard → SQL Editor.
-- Creates user_follows table (if missing) and RLS so profile/search can show followers and following.
-- Required for: App profile tab, PublicProfile, SearchPage, and user_activity "followed users" feed.

-- 1) Table: who follows whom
create table if not exists public.user_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, followed_id),
  constraint user_follows_no_self check (follower_id <> followed_id)
);

-- 2) RLS
alter table public.user_follows enable row level security;

-- Select: see rows where you are the follower OR the followed (so you see your followers and following)
drop policy if exists "Users can view own follow relationships" on public.user_follows;
create policy "Users can view own follow relationships"
  on public.user_follows for select to authenticated
  using (auth.uid() = follower_id or auth.uid() = followed_id);

-- Insert: only as follower (you can only add "I follow X")
drop policy if exists "Users can insert own follow" on public.user_follows;
create policy "Users can insert own follow"
  on public.user_follows for insert to authenticated
  with check (auth.uid() = follower_id);

-- Delete: only rows where you are the follower (unfollow)
drop policy if exists "Users can delete own follow" on public.user_follows;
create policy "Users can delete own follow"
  on public.user_follows for delete to authenticated
  using (auth.uid() = follower_id);

-- Allow authenticated users to read any follow row (so public profile /u/:username can show that user's follower and following counts)
drop policy if exists "Authenticated can read all for profile counts" on public.user_follows;
create policy "Authenticated can read all for profile counts"
  on public.user_follows for select to authenticated
  using (true);
