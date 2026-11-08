-- Run this once in the Supabase SQL editor.
-- Messages intentionally contain text-only fields; attachments are never persisted.
create table if not exists public.chats (
  id text primary key check (id ~ '^c[a-zA-Z0-9_-]{8,100}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  model text not null,
  messages jsonb not null default '[]'::jsonb,
  custom_prv jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chats add column if not exists custom_prv jsonb;

create index if not exists chats_user_updated_idx
  on public.chats (user_id, updated_at desc);

create or replace function public.set_chats_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists chats_set_updated_at on public.chats;
create trigger chats_set_updated_at
before update on public.chats
for each row execute function public.set_chats_updated_at();

alter table public.chats enable row level security;

drop policy if exists "Users can read their own chats" on public.chats;
create policy "Users can read their own chats"
  on public.chats for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own chats" on public.chats;
create policy "Users can insert their own chats"
  on public.chats for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own chats" on public.chats;
create policy "Users can update their own chats"
  on public.chats for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own chats" on public.chats;
create policy "Users can delete their own chats"
  on public.chats for delete using (auth.uid() = user_id);

create table if not exists public.custom_prvs (
  id text primary key,
  creator_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  instructions text not null,
  model text not null check (model in ('prv-v3.2-fire', 'prv-v1-flash')),
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists custom_prvs_public_created_idx
  on public.custom_prvs (is_public, created_at desc);

alter table public.custom_prvs enable row level security;

drop policy if exists "Anyone can read public Custom PRVs" on public.custom_prvs;
create policy "Anyone can read public Custom PRVs"
  on public.custom_prvs for select using (is_public = true or auth.uid() = creator_id);

drop policy if exists "Signed in users can publish Custom PRVs" on public.custom_prvs;
create policy "Signed in users can publish Custom PRVs"
  on public.custom_prvs for insert with check (auth.uid() = creator_id);
