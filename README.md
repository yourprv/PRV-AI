# PRV AI

PRV AI is a responsive AI workspace for chat, research, image creation, and reusable assistants. It pairs a warm, low-glare interface with conversation continuity, account-based history, chat export, and invite-only access tiers. The production web app is available at [prvai.vercel.app](https://prvai.vercel.app).

This repository contains the web client, API server, Supabase SQL setup, and invite-code administration utility. The browser calls the API server; private provider credentials remain on the server.

## Contents

```text
PRV-AI-main/
├── app/                         React + TypeScript + Vite web client
│   ├── public/                  Static images and icons
│   └── src/
│       ├── components/          Chat, account, settings, plans, and UI components
│       ├── hooks/               Authentication, theme, and reusable hooks
│       ├── lib/                 API, streaming, and search clients
│       ├── pages/               Home, settings, and authentication callback
│       └── types/               Shared client-side data types
├── backend/                     Express + TypeScript API server
│   ├── src/                     API routes, auth, quotas, and invite CLI
│   └── supabase/                Database setup SQL
├── LICENSE                      Apache License, Version 2.0
├── Features.md                 Product feature guide
└── README.md                   Project setup and operator guide
```

## Chat continuity and export

Each new response includes the earlier user and assistant turns from the active conversation, so follow-up questions can build on what was already discussed. Context is limited by the selected model and provider. Signed-in users can reopen saved text conversations; guest and incognito conversations are temporary.

From the chat workspace, export the current conversation as Markdown or download all available chats as JSON. Chat records saved to an account contain text conversation fields; attachments and generated image data are not included in PRV AI’s saved text-chat records.

The interface adapts to phone, tablet, and desktop widths, with light and dark themes designed around warm paper and deep, low-glare tones. It follows the browser’s color-scheme preference and responds when that preference changes; a manual switch lasts for the current browser session.

## Requirements

- Node.js 20 or newer and npm
- A Supabase project with Authentication enabled
- Server-side credentials for the AI, search, Turnstile, and image services you enable
- A public Turnstile site key for the web client and its private secret for the API server

## Run locally

### 1. Configure the API server

From the repository root:

```sh
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your Supabase project URL, Supabase **service-role** key, provider credentials, Turnstile secret, and a long random `INVITE_RATE_LIMIT_SECRET`. Keep this file private. Never put a service-role key or provider secret in a `VITE_` variable.

Install dependencies and start the API in one terminal:

```sh
cd backend
npm install
npm run dev
```

The API listens on `http://localhost:5000` by default. `GET /health` reports whether the process is responding.

### 2. Configure and start the web client

In another terminal, from the repository root:

```sh
cp app/.env.example app/.env.local
```

Set `VITE_API_BASE_URL=http://localhost:5000` and a public `VITE_TURNSTILE_SITE_KEY` in `app/.env.local`. Then run:

```sh
cd app
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). Add the local authentication callback URL, such as `http://localhost:5173/auth/callback`, to the allowed redirect URLs in your Supabase Auth configuration.

To build the client or API server:

```sh
(cd app && npm run build)
(cd backend && npm run build)
```

## Supabase setup

Run these SQL files in the Supabase SQL editor, in order:

1. `backend/supabase/chats.sql` — saved chats and published Custom PRVs.
2. `backend/supabase/invite_codes.sql` — invite codes, tier entitlements, and redemption-attempt limits.
3. `backend/supabase/tier_usage.sql` — persistent daily and lifetime quotas, plus the atomic Custom PRV creation function.

The API uses the service-role credential on the server. Tables are not intended for direct browser writes. Do not expose the service-role key to the client.

## Authentication, tiers, and usage

Email-link and OAuth authentication are handled through Supabase Auth. The API validates bearer tokens and derives account IDs on the server. Free access is the default; Go, Plus, and Pro entitlements are granted from valid invite codes. The web app shows plans under **Settings → Plans** and sends redemptions to `POST /api/redeem-invite`.

Per-model and feature quotas are stored in Postgres and enforced before provider calls. Daily quotas reset at midnight UTC. Lifetime Custom PRV counters start at zero when this quota system is introduced, so existing published assistants do not count against the new allowance. The `/api/usage` endpoint returns the current account or guest usage summary.

See [Features.md](Features.md) for the published tier allowances and product capabilities.

## Create an invite code

From the backend directory, generate a single-use Pro code that expires at the given UTC timestamp:

```sh
npm run invite:create -- --tier pro --max-uses 1 --expires-at 2027-01-01T00:00:00Z
```

Supported tiers are `go`, `plus`, and `pro`. `--max-uses` defaults to one; `--expires-at` is optional. The CLI generates 16 uppercase alphanumeric characters, formats them into four groups, and stores only a SHA-256 hash. The plaintext code is printed once after storage succeeds; distribute and retain it securely.

## API capabilities

- `POST /api/chat/stream` — authenticated or guest chat with streamed responses and server-side model quotas.
- `POST /api/search/tavily` — web search with a daily tier allowance.
- `POST /api/images/generate` — image creation with a daily quota and Turnstile verification.
- `POST /api/custom-prv/enhance` — prompt enhancement with a daily quota.
- `GET`, `PUT`, and `DELETE /api/chats` routes — account-scoped saved chat history.
- `GET` and `POST /api/custom-prvs` — browse and publish custom assistants.
- `POST /api/redeem-invite` — atomic invite redemption and tier assignment.
- `GET /api/usage` — current daily and lifetime usage.

## Deployment notes

- Deploy `app/` as a Vite static site (the production URL is `prvai.vercel.app`) and `backend/` as a Node service.
- Configure `VITE_API_BASE_URL` and `VITE_TURNSTILE_SITE_KEY` in the web deployment. In the Render API service, configure all private credentials and set `FRONTEND_URL=https://prvai.vercel.app`.
- Add production and local callback URLs to the Supabase Auth allowlist.
- `INVITE_RATE_LIMIT_SECRET` must be a long, random server-only value. Keep it stable so guest usage keys remain stable.
- Daily and lifetime quotas are database-backed and shared across API instances. Invite redemption attempts are also database-backed.
- Image, search, and AI services may have their own availability, latency, and provider-side limits in addition to PRV tier quotas.

## Security and data handling

The UI’s Terms and Conditions and Privacy Policy are displayed in the sign-in flow. Chat history saves text fields to the account; attachments and generated image data are not included in PRV AI’s saved text-chat records. Requests may be processed by external service providers as described in the in-app Privacy Policy. Review that policy and the deployment’s provider terms before launch.

Environment files, dependencies, and build output should not be committed. The root `.gitignore` excludes local `.env` files, `node_modules`, and build directories.

## License

This project is distributed under the standard [Apache License, Version 2.0](LICENSE). The repository license contains no custom commercial-use restriction.
