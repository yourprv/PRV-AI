# PRV AI Backend

This Express + TypeScript backend hosts the API routes that were previously executed directly in the frontend.

## Local development

1. Copy .env.example to .env and fill in the real values.
2. Install dependencies with `npm install`.
3. Start the server with `npm run dev`.

## Render deployment

- Build command: `npm install && npm run build`
- Start command: `npm start`

## Required environment variables

- `PORT`
- `FRONTEND_URL`
- `GEMINI_API_KEY`
- `TAVILY_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INVITE_RATE_LIMIT_SECRET` (required for invite redemption and guest usage tracking; use a long random value)
- `TURNSTILE_SECRET_KEY`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN` (Workers AI token with Workers AI Read and Edit permissions)

The backend reads these environment variables directly. Do not use `VITE_` prefixes in `backend/.env`.

Set `VITE_TURNSTILE_SITE_KEY` in the frontend deployment. It is the public
Cloudflare site key; the secret key belongs only on the backend.

## Invite codes and paid tiers

1. Apply `backend/supabase/invite_codes.sql`, `backend/supabase/tier_usage.sql`,
   and the existing `backend/supabase/chats.sql` to the Supabase project. These
   create invite, entitlement, daily usage, and Custom PRV tables/functions.
2. Set `INVITE_RATE_LIMIT_SECRET` on the backend to a long random secret. The
   API hashes IP and user identifiers with this key before using the durable
   5-attempt-per-15-minute limiter.
3. Generate an invite from the `backend` directory:

   ```sh
   npm run invite:create -- --tier pro --max-uses 1 --expires-at 2027-01-01T00:00:00Z
   ```

   `--tier` accepts `go`, `plus`, or `pro`; `--max-uses` defaults to 1 and `--expires-at` is optional. The plaintext
   code is printed only after its SHA-256 digest is stored; share it securely.
4. Send `POST /api/redeem-invite` with `{ "code": "ABCD-1234-EFGH-5678" }`
   and the signed-in user's bearer token. The backend derives the user ID from
   Supabase Auth; clients cannot redeem on behalf of another account.
5. Store paid access in `user_entitlements`, which is never writable by the
   browser. Apply `requireTier('plus')` or `requireTier('pro')` to each paid
   feature API route. Example access-check routes are included in `server.ts`.

Codes contain 16 uppercase alphanumeric symbols, displayed as four groups of
four with three hyphens (19 visible characters). The database stores only a
hash, while the CLI displays the plaintext once.

Tier limits are persistent and enforced in Postgres, with all daily counters
reset at midnight UTC. Fire, V1 Pro, and V1 Base have no daily cap. Earth is
limited to 30/300/1,000/5,000 per day on Free/Go/Plus/Pro. Lightning is
unavailable on Free, then 20/100/500 per day. V1 Pro Max allows
40/200/800/3,000 per day. Image generation allows 10/50/150/500 per day;
prompt enhancement 100/500/1,500/5,000; web search 30/100/300/1,000.
Custom PRV creation allows 1/5/25/Unlimited for life. The new lifetime counter
starts at zero for everyone, so Custom PRVs published before this quota change
do not count. Limited responses include `X-RateLimit-Limit`,
`X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.
