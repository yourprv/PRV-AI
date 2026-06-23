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

The backend reads these environment variables directly. Do not use `VITE_` prefixes in `backend/.env`.
