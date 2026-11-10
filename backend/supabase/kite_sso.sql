-- One-time authorization codes for PRV AI -> Kite Studio sign-in.
-- Apply to the PRV AI Supabase project. Raw codes are never stored.
create table if not exists public.kite_sso_codes (
  code_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists kite_sso_codes_expiry_idx
  on public.kite_sso_codes (expires_at);

alter table public.kite_sso_codes enable row level security;
revoke all on public.kite_sso_codes from public, anon, authenticated;
grant all on public.kite_sso_codes to service_role;
