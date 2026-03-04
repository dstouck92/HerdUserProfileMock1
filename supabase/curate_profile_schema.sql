-- Curate / Public Profile 5-card system
-- Run in Supabase Dashboard → SQL Editor after schema.sql and profile_pictures_storage.sql.
--
-- Tables: curate_prompt_categories, curate_prompts, user_curate_cards.
-- Profiles: adds public_profile_theme for per-user theme selection.
-- Storage: policies for bucket "curate-card-media" (create bucket in Dashboard first).

-- 1) Add theme to profiles (Option A from plan)
alter table public.profiles
  add column if not exists public_profile_theme text not null default 'default';

comment on column public.profiles.public_profile_theme is 'One of: default, white_red, orange_blue, black_purple, green_purple';

-- 2) Prompt categories (read-only for app; seed via migrations)
create table if not exists public.curate_prompt_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order smallint not null default 0
);

alter table public.curate_prompt_categories enable row level security;

drop policy if exists "Anyone can read curate prompt categories" on public.curate_prompt_categories;
create policy "Anyone can read curate prompt categories"
  on public.curate_prompt_categories for select
  using (true);

-- 3) Prompts (read-only for app; seed via seed file)
create table if not exists public.curate_prompts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.curate_prompt_categories(id) on delete cascade,
  slug text not null unique,
  prompt_text text not null,
  max_characters integer,
  answer_config jsonb not null default '{}',
  sort_order smallint not null default 0
);

comment on column public.curate_prompts.answer_config is 'allowed_answer_types[], data_sources[], supports_spotify_search, supports_manual_artist_entry, text_template, text_input_count, text_input_labels[]';

alter table public.curate_prompts enable row level security;

drop policy if exists "Anyone can read curate prompts" on public.curate_prompts;
create policy "Anyone can read curate prompts"
  on public.curate_prompts for select
  using (true);

-- 4) User's 5 curated cards (one row per card slot per user)
create table if not exists public.user_curate_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_index smallint not null,
  prompt_id uuid references public.curate_prompts(id) on delete set null,
  answer jsonb not null default '{}',
  updated_at timestamptz default now(),
  constraint user_curate_cards_card_index_unique unique (user_id, card_index),
  constraint user_curate_cards_card_index_range check (card_index between 1 and 5)
);

comment on column public.user_curate_cards.answer is 'texts[], images[], data_refs[], badges[], artists[]';

create index if not exists idx_user_curate_cards_user_id on public.user_curate_cards(user_id);
create index if not exists idx_user_curate_cards_card_index on public.user_curate_cards(user_id, card_index);

alter table public.user_curate_cards enable row level security;

-- Anyone can read user_curate_cards (for public profile views by username)
drop policy if exists "Public can read user curate cards" on public.user_curate_cards;
create policy "Public can read user curate cards"
  on public.user_curate_cards for select
  using (true);

-- Only owner can insert/update/delete their cards
drop policy if exists "Users can manage own curate cards" on public.user_curate_cards;
create policy "Users can manage own curate cards"
  on public.user_curate_cards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5) Storage: curate-card-media bucket policies
-- Prerequisite: Create bucket in Dashboard → Storage → New bucket:
--   Name: curate-card-media
--   Public: ON (for public profile image display)

drop policy if exists "Users can upload own curate card media" on storage.objects;
create policy "Users can upload own curate card media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'curate-card-media'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

drop policy if exists "Users can update own curate card media" on storage.objects;
create policy "Users can update own curate card media"
on storage.objects for update to authenticated
using (
  bucket_id = 'curate-card-media'
  and (storage.foldername(name))[1] = (auth.uid())::text
)
with check (
  bucket_id = 'curate-card-media'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

drop policy if exists "Curate card media are readable" on storage.objects;
create policy "Curate card media are readable"
on storage.objects for select to public
using (bucket_id = 'curate-card-media');

drop policy if exists "Users can delete own curate card media" on storage.objects;
create policy "Users can delete own curate card media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'curate-card-media'
  and (storage.foldername(name))[1] = (auth.uid())::text
);
