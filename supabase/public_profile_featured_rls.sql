-- Run this in Supabase SQL Editor once.
-- Purpose: let public profiles show *featured* concerts / vinyl / merch
-- for other users, without exposing everything.

-- 1) Ensure is_featured columns exist (safe to run multiple times)
alter table public.concerts
  add column if not exists is_featured boolean not null default false;

alter table public.vinyl
  add column if not exists is_featured boolean not null default false;

alter table public.merch
  add column if not exists is_featured boolean not null default false;

-- 2) Allow authenticated users to read ONLY featured rows for public profiles
drop policy if exists "read featured concerts for public profiles" on public.concerts;
create policy "read featured concerts for public profiles"
on public.concerts for select to authenticated
using (is_featured = true);

drop policy if exists "read featured vinyl for public profiles" on public.vinyl;
create policy "read featured vinyl for public profiles"
on public.vinyl for select to authenticated
using (is_featured = true);

drop policy if exists "read featured merch for public profiles" on public.merch;
create policy "read featured merch for public profiles"
on public.merch for select to authenticated
using (is_featured = true);

