-- Run in Supabase SQL Editor once: Topics (posts, likes, comments) for Herds.

-- 1) Posts in a herd
create table if not exists public.herd_posts (
  id uuid primary key default gen_random_uuid(),
  herd_id uuid not null references public.herds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  image_url text,
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists herd_posts_herd_id_idx on public.herd_posts(herd_id);
alter table public.herd_posts enable row level security;

create policy "read herd_posts"
on public.herd_posts for select to authenticated using (true);

create policy "insert own herd_posts"
on public.herd_posts for insert to authenticated
with check (auth.uid() = user_id);

create policy "delete own herd_posts"
on public.herd_posts for delete to authenticated
using (auth.uid() = user_id);

-- 2) Likes on a post
create table if not exists public.herd_post_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.herd_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.herd_post_likes enable row level security;

create policy "read herd_post_likes"
on public.herd_post_likes for select to authenticated using (true);

create policy "insert own herd_post_likes"
on public.herd_post_likes for insert to authenticated
with check (auth.uid() = user_id);

create policy "delete own herd_post_likes"
on public.herd_post_likes for delete to authenticated
using (auth.uid() = user_id);

-- 3) Comments on a post
create table if not exists public.herd_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.herd_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists herd_post_comments_post_id_idx on public.herd_post_comments(post_id);
alter table public.herd_post_comments enable row level security;

create policy "read herd_post_comments"
on public.herd_post_comments for select to authenticated using (true);

create policy "insert own herd_post_comments"
on public.herd_post_comments for insert to authenticated
with check (auth.uid() = user_id);

create policy "delete own herd_post_comments"
on public.herd_post_comments for delete to authenticated
using (auth.uid() = user_id);
