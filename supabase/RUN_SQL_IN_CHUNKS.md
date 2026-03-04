# Avoid "Connection timeout" in Supabase SQL Editor

Run **one block at a time** in the SQL Editor. Click **Run** after each block, wait for success, then run the next.

---

## user_follows (profile followers/following)

**Block 1 — Table**
```sql
create table if not exists public.user_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, followed_id),
  constraint user_follows_no_self check (follower_id <> followed_id)
);
alter table public.user_follows enable row level security;
```

**Block 2 — SELECT policies**
```sql
drop policy if exists "Users can view own follow relationships" on public.user_follows;
create policy "Users can view own follow relationships"
  on public.user_follows for select to authenticated
  using (auth.uid() = follower_id or auth.uid() = followed_id);

drop policy if exists "Authenticated can read all for profile counts" on public.user_follows;
create policy "Authenticated can read all for profile counts"
  on public.user_follows for select to authenticated
  using (true);
```

**Block 3 — INSERT and DELETE**
```sql
drop policy if exists "Users can insert own follow" on public.user_follows;
create policy "Users can insert own follow"
  on public.user_follows for insert to authenticated
  with check (auth.uid() = follower_id);

drop policy if exists "Users can delete own follow" on public.user_follows;
create policy "Users can delete own follow"
  on public.user_follows for delete to authenticated
  using (auth.uid() = follower_id);
```

---

## profile-pictures storage (avatar uploads)

**Block 1 — INSERT**
```sql
drop policy if exists "Users can upload own profile picture" on storage.objects;
create policy "Users can upload own profile picture"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = (auth.uid())::text
);
```

**Block 2 — UPDATE**
```sql
drop policy if exists "Users can update own profile picture" on storage.objects;
create policy "Users can update own profile picture"
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = (auth.uid())::text
)
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = (auth.uid())::text
);
```

**Block 3 — SELECT and DELETE**
```sql
drop policy if exists "Profile pictures are readable" on storage.objects;
create policy "Profile pictures are readable"
on storage.objects for select to public
using (bucket_id = 'profile-pictures');

drop policy if exists "Users can delete own profile picture" on storage.objects;
create policy "Users can delete own profile picture"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = (auth.uid())::text
);
```

---

## If you still timeout

- Run **one policy at a time** (each `drop policy` + `create policy` pair).
- Use a stable connection (avoid VPN drops).
- Retry during off-peak times.
