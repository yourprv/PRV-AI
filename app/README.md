# PRV AI Chatbot UI

A React + TypeScript + Vite frontend for a modern AI chatbot interface.

This app includes:

- Supabase authentication for email login and Google OAuth
- Google Gemini API streaming responses
- Tavily web search integration for richer answers
- Local browser storage for chat history and settings
- Responsive UI with a sidebar, chat panel, and settings page

## Requirements

- Node.js 18 or newer
- npm
- A Supabase project with auth enabled
- Google Gemini API key
- Tavily API key (optional, only for web search capabilities)

## Setup

1. Open the app folder:

```bash
cd app
```

2. Install dependencies:

```bash
npm install
```

3. Copy the example env file:

```bash
cp .env.example .env
```

4. Update `.env` with the backend API URL only:

```env
VITE_API_BASE_URL=http://localhost:5000
```

5. Start development:

```bash
npm run dev
```

6. Open the app at the local URL shown by Vite.

## Environment Variables

The frontend expects these values in `.env`:

- `VITE_API_BASE_URL` — Backend API URL, for example `http://localhost:5000`

The backend hosts all sensitive integrations for Supabase auth, Gemini, and Tavily. No API keys should be stored in the frontend.

> Do not commit `.env` or any private keys to source control. This repository already ignores `.env` and other local secrets.

## Available Scripts

- `npm run dev` — start the development server
- `npm run build` — build production assets
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint across source files

## Project Structure

- `src/` — application source code
- `src/lib/` — API helpers for Supabase, Gemini, and Tavily
- `src/hooks/` — reusable state and auth hooks
- `src/components/` — UI components and layout
- `src/pages/` — route pages like `Home`, `Settings`, and `AuthCallback`

## Notes

- Chat history is stored locally in browser storage
- Supabase auth requires `http://localhost:5173/auth/callback` as a redirect URL if using OAuth
- The `Gemini` and `Tavily` keys are used by client-side fetch calls, so keep them private
- `.env.example` is safe to commit as a sample configuration

## Security & Privacy

- Secrets should remain in `.env` only
- `.env` and `.npmrc` are ignored by `.gitignore`
- `node_modules/` and build directories are also ignored

## License

No license file is included. Add one if you plan to share this project publicly.
