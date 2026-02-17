-- Herd MVP3 — run this in Supabase Dashboard → SQL Editor

-- Profiles (extends auth.users with display_name, username)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  username text not null default '',
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

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
  updated_at timestamptz default now()
);

alter table public.user_streaming_stats enable row level security;

create policy "Users can manage own streaming stats"
  on public.user_streaming_stats for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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
