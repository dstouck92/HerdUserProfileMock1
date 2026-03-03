-- Run in Supabase SQL Editor once: allow reading other users' streaming stats and profiles for herd leaderboards.

-- Allow authenticated users to read all user_streaming_stats (for leaderboard by artist)
create policy "read user_streaming_stats for leaderboard"
on public.user_streaming_stats for select to authenticated
using (true);

-- Allow authenticated users to read all profiles (display names on leaderboard)
create policy "read profiles for leaderboard"
on public.profiles for select to authenticated
using (true);
