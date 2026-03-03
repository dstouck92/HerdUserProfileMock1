-- Run this in Supabase SQL Editor (once) to create Herds (Fan Clubs) support.

-- 1) Herds table: one row per artist fan club
create table if not exists public.herds (
  id uuid primary key default gen_random_uuid(),
  spotify_artist_id text unique,
  name text not null,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.herds enable row level security;

create policy "read herds"
on public.herds for select to authenticated using (true);

create policy "insert herds"
on public.herds for insert to authenticated with check (true);

-- 2) Herd follows: which users follow which herds
create table if not exists public.herd_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  herd_id uuid not null references public.herds(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, herd_id)
);

alter table public.herd_follows enable row level security;

create policy "read herd_follows"
on public.herd_follows for select to authenticated using (true);

create policy "insert own herd_follows"
on public.herd_follows for insert to authenticated
with check (auth.uid() = user_id);

create policy "delete own herd_follows"
on public.herd_follows for delete to authenticated
using (auth.uid() = user_id);

-- 3) Seed Bad Bunny (Spotify artist id: 4q3ewBCX7sLwd24euuV69X)
insert into public.herds (spotify_artist_id, name, image_url)
values ('4q3ewBCX7sLwd24euuV69X', 'Bad Bunny', null)
on conflict (spotify_artist_id) do update set name = excluded.name;
