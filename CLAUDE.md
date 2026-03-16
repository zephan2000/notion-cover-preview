# CLAUDE.md — Notion Cover Preview App

## What this project is

A React SPA deployed to Vercel. It is used by Manus AI (an autonomous AI agent)
to show human users candidate cover images for Notion workspace pages, collect
their selections, and return those selections to Manus via URL hash.

## Critical architectural constraints

### Selection handoff via Supabase API
When using the `?id=` path, user selections are written back to Supabase via
`PATCH /api/config/[id]`. Manus reads selections by polling `GET /api/config/[id]`
and checking the `selections` field in the response.

For the `?config=` fallback path, selections are still written to the URL hash
as `#selections=[base64-encoded JSON]`.

### Deployment: Vercel
The frontend is a static Vite build. Vercel serverless functions in `/api`
handle config storage via Supabase. No other backend infrastructure.

### Two config input paths
1. **`?id=`** — Manus POSTs config JSON to `/api/config`, gets back an ID.
   App fetches config from `/api/config/[id]` on mount. No URL length limit.
2. **`?config=`** — Inline base64-encoded config in the query string.
   Works for small payloads. 8000 char URL limit applies.
3. **No param** — Demo mode with hardcoded sample pages.

### Config storage: Supabase
Configs are stored in `public.cover_configs` table in the shared Supabase
instance (same as pergroup-web). Rows auto-expire after 1 hour via pg_cron.
- Service role key: used for all API operations (POST, GET, PATCH)
- Table has `config_json` (input) and `selections_json` (output) columns

### Image loading
All images load via <img> tags from external CDNs (Unsplash, Pexels).
Never use canvas, fetch, or blob URLs for images — CORS will block them.

## Component state rules
- No global state management (no Zustand, no Context, no Redux)
- App.tsx owns: currentPageIndex, selections, notionDark, appDark
- All child components receive props only
- useUrlState.ts is the only hook — it handles URL I/O

## Manus integration notes
- Preferred: Manus POSTs config to /api/config, gets ID, opens /?id=[id]
- Fallback: Manus encodes config as base64, opens /?config=[base64]
- Manus reads output via: GET /api/config/[id] — polls until `selections` is non-null
- Demo mode activates automatically when neither param is present
- The app must never require user login or any external service

## Environment variables (Vercel)
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — public/anon key (for reads)
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (for writes, server-only)

## File naming
- Components: PascalCase.tsx
- Hooks: camelCase.ts with "use" prefix
- Utils: camelCase.ts
- Types: index.ts in /types/
- API routes: /api/ directory (Vercel serverless functions)

## Tailwind
- Use Tailwind utility classes only — no custom CSS except in index.css (directives)
- Accent colour: #2d6a4f — defined in tailwind.config.js as `accent.DEFAULT`
- Do not use Tailwind's default blue for interactive elements

## When to update CHANGELOG.md
Every PR or meaningful commit. Format: ## [version] - YYYY-MM-DD

## Before every Claude Code session
Re-read this file. Do not make architectural changes without noting the reason
in CHANGELOG.md.
