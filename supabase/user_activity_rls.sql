-- Run in Supabase SQL Editor once.
-- Lets the app show: (1) your own activity, (2) "Alice joined Y fan club" for users you follow.

-- Ensure RLS is on
alter table public.user_activity enable row level security;

-- 1) Allow inserting your own activity rows
create policy "insert own user_activity"
on public.user_activity for insert to authenticated
with check (actor_id = auth.uid());

-- 2) Read your own activity (e.g. "You joined X fan club")
create policy "read own user_activity"
on public.user_activity for select to authenticated
using (actor_id = auth.uid());

-- 3) Read follow_herd activity from people you follow (e.g. "Alice joined Y fan club")
create policy "read follow_herd from followed users"
on public.user_activity for select to authenticated
using (
  type = 'follow_herd'
  and actor_id in (
    select followed_id from public.user_follows where follower_id = auth.uid()
  )
);
