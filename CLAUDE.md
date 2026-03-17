# CLAUDE.md — Notion Cover Preview App

## What this project is

A React SPA deployed to Vercel. It is used by Manus AI (an autonomous AI agent)
to show human users candidate cover images for Notion workspace pages, collect
their selections, and return those selections to Manus via a Supabase-backed API.

## Critical architectural constraints

### Selection handoff via Supabase API
Manus POSTs config to `/api/config`, gets an ID. User opens `/?id=[id]`.
After the user confirms, selections are written to Supabase via `PATCH /api/config/[id]`.
Manus reads selections by polling `GET /api/config/[id]`.

### Image Pool model
Manus collects 15-20 diverse candidate images into a pool. The user assigns
images from the pool to pages. This replaces the old Option A/B model.

Config shape:
```json
{
  "config": {
    "workspace_name": "...",
    "pages": [{ "id": "...", "name": "...", "icon": "..." }],
    "image_pool": [{ "url": "...", "tags": ["..."] }]
  }
}
```

### Deployment: Vercel
The frontend is a static Vite build. Vercel serverless functions in `/api`
handle config storage via Supabase. No other backend infrastructure.

### Config storage: Supabase
Configs are stored in `public.cover_configs` table in the shared Supabase
instance. Rows auto-expire after 1 hour via pg_cron.
- Service role key: used for all API operations (POST, GET, PATCH)
- Table has `config_json` (input) and `selections_json` (output) columns

### Image loading
All images load via <img> tags from external CDNs (Unsplash, Pexels).
Never use canvas, fetch, or blob URLs for images — CORS will block them.

## Component architecture
- App.tsx owns: selections, mode (browse/review), selectedImageUrl, notionDark, saving
- All child components receive props only
- useUrlState.ts handles URL I/O and API communication
- No global state management (no Zustand, no Context, no Redux)

### Components
- TopBar: workspace name, page chips, mode toggle, confirm button (Linear-style)
- ImageGrid: filterable grid of pool images with tag pills
- ImageCard: single image with hover preview, assigned badge
- AssignModal: NotionMock preview + page assignment buttons
- ReviewPanel: all pages with their assigned covers as NotionMock cards
- NotionMock: faithful Notion cover + page title render
- PageChip: status pill in TopBar showing assignment state
- SuccessOverlay: confirmation modal

## Design system
- Styling follows Linear's design language (dark-first, layered surfaces)
- Font: Inter
- Palette: `linear-bg`, `linear-panel`, `linear-surface`, `linear-border` etc.
- Accent: Indigo-violet `#5e6ad2`
- Success: Emerald `#10b981`
- Animations: modal-in, badge-pop, fade-in (subtle, purposeful)
- Dark mode is the default

## Manus integration notes
- Preferred: Manus POSTs config to /api/config, gets ID, opens /?id=[id]
- Manus reads output via: GET /api/config/[id] — polls until `selections` is non-null
- Demo mode activates automatically when no params present
- The app must never require user login or any external service

## Environment variables (Vercel)
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — public/anon key
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (for writes, server-only)

## File naming
- Components: PascalCase.tsx
- Hooks: camelCase.ts with "use" prefix
- Utils: camelCase.ts
- Types: index.ts in /types/
- API routes: /api/ directory (Vercel serverless functions)

## When to update CHANGELOG.md
Every PR or meaningful commit. Format: ## [version] - YYYY-MM-DD

## Before every Claude Code session
Re-read this file. Do not make architectural changes without noting the reason
in CHANGELOG.md.
