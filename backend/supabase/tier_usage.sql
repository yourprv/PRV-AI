-- Persistent per-day model and feature quotas. Daily rows use UTC dates.
-- Apply after invite_codes.sql and the existing chats.sql schema.
create table if not exists public.tier_daily_usage (
  usage_key text not null,
  feature_key text not null,
  usage_date date not null,
  used integer not null default 0 check (used >= 0),
  primary key (usage_key, feature_key, usage_date)
);

create table if not exists public.tier_lifetime_usage (
  usage_key text not null,
  feature_key text not null,
  used integer not null default 0 check (used >= 0),
  primary key (usage_key, feature_key)
);

alter table public.tier_daily_usage enable row level security;
alter table public.tier_lifetime_usage enable row level security;
revoke all on public.tier_daily_usage, public.tier_lifetime_usage from anon, authenticated;
grant all on public.tier_daily_usage, public.tier_lifetime_usage to service_role;

-- The check and increment happen under a row lock, so parallel requests cannot
-- overspend the same account's daily allowance.
create or replace function public.consume_tier_daily_quota(
  p_usage_key text,
  p_feature_key text,
  p_usage_date date,
  p_daily_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_used integer;
begin
  insert into public.tier_daily_usage (usage_key, feature_key, usage_date, used)
  values (p_usage_key, p_feature_key, p_usage_date, 0)
  on conflict (usage_key, feature_key, usage_date) do nothing;

  select used into v_used
  from public.tier_daily_usage
  where usage_key = p_usage_key and feature_key = p_feature_key and usage_date = p_usage_date
  for update;

  if p_daily_limit <= 0 or v_used >= p_daily_limit then
    return jsonb_build_object('allowed', false, 'used', v_used, 'limit', p_daily_limit);
  end if;

  update public.tier_daily_usage
  set used = used + 1
  where usage_key = p_usage_key and feature_key = p_feature_key and usage_date = p_usage_date
  returning used into v_used;

  return jsonb_build_object('allowed', true, 'used', v_used, 'limit', p_daily_limit);
end;
$$;

-- Lifetime counts are independent of existing custom_prvs rows, so creators'
-- previously published assistants do not use the new allowance.
create or replace function public.create_custom_prv_with_quota(
  p_usage_key text,
  p_lifetime_limit integer,
  p_id text,
  p_creator_id uuid,
  p_name text,
  p_description text,
  p_instructions text,
  p_model text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_used integer;
  v_prv public.custom_prvs%rowtype;
begin
  insert into public.tier_lifetime_usage (usage_key, feature_key, used)
  values (p_usage_key, 'custom_prv_create', 0)
  on conflict (usage_key, feature_key) do nothing;

  select used into v_used
  from public.tier_lifetime_usage
  where usage_key = p_usage_key and feature_key = 'custom_prv_create'
  for update;

  if p_lifetime_limit is not null and v_used >= p_lifetime_limit then
    return jsonb_build_object('allowed', false, 'used', v_used, 'limit', p_lifetime_limit);
  end if;

  insert into public.custom_prvs (id, creator_id, name, description, instructions, model, is_public)
  values (p_id, p_creator_id, p_name, p_description, p_instructions, p_model, true)
  returning * into v_prv;

  update public.tier_lifetime_usage
  set used = used + 1
  where usage_key = p_usage_key and feature_key = 'custom_prv_create'
  returning used into v_used;

  return jsonb_build_object('allowed', true, 'used', v_used, 'custom_prv', to_jsonb(v_prv));
end;
$$;

revoke all on function public.consume_tier_daily_quota(text, text, date, integer) from public, anon, authenticated;
revoke all on function public.create_custom_prv_with_quota(text, integer, text, uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.consume_tier_daily_quota(text, text, date, integer) to service_role;
grant execute on function public.create_custom_prv_with_quota(text, integer, text, uuid, text, text, text, text) to service_role;
