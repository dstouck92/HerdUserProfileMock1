-- DMs: conversation requests (request/accept) and 1:1 messages.
-- Run in Supabase Dashboard → SQL Editor.
-- For live message updates, enable Realtime for table dm_messages: Database → Replication → dm_messages → Enable.

-- 1) Conversation requests: one user requests to start a DM with another; recipient can accept or decline.
create table if not exists public.dm_conversation_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (from_user_id, to_user_id)
);

alter table public.dm_conversation_requests enable row level security;

create policy "Users can read own sent requests"
  on public.dm_conversation_requests for select
  using (auth.uid() = from_user_id);

create policy "Users can read requests sent to them"
  on public.dm_conversation_requests for select
  using (auth.uid() = to_user_id);

create policy "Users can insert requests (from themselves)"
  on public.dm_conversation_requests for insert
  with check (auth.uid() = from_user_id);

create policy "Recipient can update request (accept/decline)"
  on public.dm_conversation_requests for update
  using (auth.uid() = to_user_id)
  with check (auth.uid() = to_user_id);

-- 2) Conversations: created when a request is accepted. One row per pair (user_a_id < user_b_id).
create table if not exists public.dm_conversations (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references auth.users(id) on delete cascade,
  user_b_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_a_id, user_b_id),
  check (user_a_id < user_b_id)
);

alter table public.dm_conversations enable row level security;

create policy "Participants can read conversation"
  on public.dm_conversations for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

create policy "Participants can insert (when accepting)"
  on public.dm_conversations for insert
  with check (
    (auth.uid() = user_a_id or auth.uid() = user_b_id)
    and user_a_id < user_b_id
  );

create policy "Participants can update (updated_at)"
  on public.dm_conversations for update
  using (auth.uid() = user_a_id or auth.uid() = user_b_id)
  with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- 3) Messages: one row per message in a conversation.
create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  created_at timestamptz not null default now()
);

alter table public.dm_messages enable row level security;

create policy "Participants can read messages"
  on public.dm_messages for select
  using (
    exists (
      select 1 from public.dm_conversations c
      where c.id = conversation_id
      and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
    )
  );

create policy "Participants can insert messages"
  on public.dm_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.dm_conversations c
      where c.id = conversation_id
      and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
    )
  );

-- Index for listing messages by conversation
create index if not exists dm_messages_conversation_id_created_at
  on public.dm_messages (conversation_id, created_at);

-- Index for listing conversations by participant
create index if not exists dm_conversations_user_a_updated
  on public.dm_conversations (user_a_id, updated_at desc);
create index if not exists dm_conversations_user_b_updated
  on public.dm_conversations (user_b_id, updated_at desc);
