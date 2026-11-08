-- Invite entitlements for Supabase Auth users. Apply this migration using the
-- Supabase SQL editor or your normal migration workflow.
create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  tier text not null check (tier in ('go', 'plus', 'pro')),
  max_uses integer not null check (max_uses > 0),
  times_used integer not null default 0 check (times_used >= 0 and times_used <= max_uses),
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.invite_codes drop constraint if exists invite_codes_tier_check;
alter table public.invite_codes add constraint invite_codes_tier_check check (tier in ('go', 'plus', 'pro'));
create index if not exists invite_codes_active_expiry_idx
  on public.invite_codes (expires_at) where is_active;

-- Paid access is stored server-side, separate from user-editable auth metadata.
create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null check (tier in ('go', 'plus', 'pro')),
  updated_at timestamptz not null default now()
);
alter table public.user_entitlements drop constraint if exists user_entitlements_tier_check;
alter table public.user_entitlements add constraint user_entitlements_tier_check check (tier in ('go', 'plus', 'pro'));

-- A durable fixed-window limiter works across multiple backend instances.
create table if not exists public.invite_rate_limits (
  bucket_key text primary key,
  window_start timestamptz not null,
  attempts integer not null check (attempts > 0),
  updated_at timestamptz not null default now()
);

alter table public.invite_codes enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.invite_rate_limits enable row level security;
-- No client-facing policies: these tables can only be accessed by backend
-- service-role requests and the restricted functions below.

create or replace function public.consume_invite_attempt(p_ip_key text, p_user_key text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / 900) * 900);
  v_ip_attempts integer;
  v_user_attempts integer;
begin
  insert into public.invite_rate_limits (bucket_key, window_start, attempts)
  values ('ip:' || p_ip_key, v_window, 1)
  on conflict (bucket_key) do update
    set window_start = excluded.window_start,
        attempts = case when public.invite_rate_limits.window_start = excluded.window_start
          then public.invite_rate_limits.attempts + 1 else 1 end,
        updated_at = now()
  returning attempts into v_ip_attempts;

  insert into public.invite_rate_limits (bucket_key, window_start, attempts)
  values ('user:' || p_user_key, v_window, 1)
  on conflict (bucket_key) do update
    set window_start = excluded.window_start,
        attempts = case when public.invite_rate_limits.window_start = excluded.window_start
          then public.invite_rate_limits.attempts + 1 else 1 end,
        updated_at = now()
  returning attempts into v_user_attempts;

  return v_ip_attempts <= 5 and v_user_attempts <= 5;
end;
$$;

-- Lock the invite row, consume one use and upsert the entitlement in the same
-- Postgres transaction. Concurrent final-use redemptions cannot both succeed.
create or replace function public.redeem_invite_code(p_code_hash text, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite public.invite_codes%rowtype;
  v_tier text;
begin
  select * into v_invite
  from public.invite_codes
  where code_hash = p_code_hash
    and is_active
    and (expires_at is null or expires_at > now())
    and times_used < max_uses
  for update;

  if not found then
    return jsonb_build_object('redeemed', false);
  end if;

  update public.invite_codes
  set times_used = times_used + 1
  where id = v_invite.id;

  insert into public.user_entitlements (user_id, tier, updated_at)
  values (p_user_id, v_invite.tier, now())
  on conflict (user_id) do update
    set tier = case
      when public.user_entitlements.tier = 'pro' or excluded.tier = 'pro' then 'pro'
      when public.user_entitlements.tier = 'plus' or excluded.tier = 'plus' then 'plus'
      else 'go'
    end,
    updated_at = now()
  returning tier into v_tier;

  return jsonb_build_object('redeemed', true, 'tier', v_tier);
end;
$$;

revoke all on function public.consume_invite_attempt(text, text) from public, anon, authenticated;
revoke all on function public.redeem_invite_code(text, uuid) from public, anon, authenticated;
grant execute on function public.consume_invite_attempt(text, text) to service_role;
grant execute on function public.redeem_invite_code(text, uuid) to service_role;
revoke all on public.invite_codes, public.user_entitlements, public.invite_rate_limits from anon, authenticated;
grant all on public.invite_codes, public.user_entitlements, public.invite_rate_limits to service_role;

-- Periodically remove old rate-limit buckets (for example, with pg_cron):
-- delete from public.invite_rate_limits where window_start < now() - interval '1 day';
