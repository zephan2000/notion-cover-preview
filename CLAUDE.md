# CLAUDE.md — Notion Cover Preview App

## What this project is

A React SPA deployed to Vercel. Used by Manus AI to show users candidate
cover images for Notion workspace pages, collect selections with optional
focal point repositioning, and return results to Manus via Supabase.

## Critical architectural constraints

### Selection handoff via Supabase API
Manus POSTs config to `/api/config`, gets an ID. User opens `/?id=[id]`.
After confirming, selections + repositions are written via PATCH /api/config/[id].
Manus reads by polling GET /api/config/[id] until selections is non-null.

### Image Pool model
Manus sends 15–20 candidate images as a pool. The user assigns images to
pages (one image per page). There is no Option A/B model. Pages and images
both come from the API config — nothing is hardcoded.

Config input shape:
```json
{
  "config": {
    "workspace_name": "...",
    "pages": [{ "id": "...", "name": "...", "icon": "..." }],
    "image_pool": [{ "url": "...", "tags": ["..."] }]
  }
}
```

Selections output shape (written to Supabase):
```json
{
  "selections": { "page_id": "image_url" },
  "repositions": { "page_id": { "x": 0.5, "y": 0.3 } },
  "confirmed_at": "ISO timestamp"
}
```

### Deployment: Vercel
Static Vite build. Serverless functions in /api handle Supabase.

### Config storage: Supabase
Table: public.cover_configs with config_json and selections_json columns.
Rows auto-expire after 1 hour. Service role key used server-side only.

### Image loading
All images load via <img> tags from external CDNs. Never use canvas,
fetch, or blob URLs — CORS will block them.

## App modes
The app has three modes managed in reducer state:
- browse — main image grid, selection dock, optional refine mode
- refine — overlay on browse where user locks images to keep and
  triggers regeneration of the rest (sends payload to Supabase)
- finalized — two-phase completion screen (review → confirm → saved)

## Component architecture

App.tsx owns all state via useReducer. Children receive props only.
useUrlState.ts handles all API communication with Supabase.

### State shape (AppState)
- mode: 'browse' | 'refine' | 'finalized'
- images: CoverImage[] — derived from config.image_pool
- pages: PageConfig[] — from config
- workspaceName: string — from config
- selectedIds: (string | null)[] — one slot per page, indexed by page order
- repositionData: Record<imageId, {x, y}> — saved focal points
- lockedIds: string[] — images marked to keep in refine mode
- previewSlots: [string|null, string|null] — A/B comparison
- previewPageIndex: number — which page the comparison is for
- abCandidates: Record<pageIndex, [string|null, string|null]>
- showPreview: boolean
- disclaimerDismissed: boolean — reposition disclaimer shown once per session
- regeneratePayload: object|null — shown as toast after regenerate
- saving: boolean
- saved: boolean
- isDemo: boolean

### Key components
- ImageGrid — react-masonry-css grid of CoverCard components
- CoverCard — single image with hover overlay, page icon badge, refine lock badge
- SelectionDock — floating pill bottom-center: count, filmstrip, compare, finalize
- RefineModeBar — replaces dock in refine mode: lock count, Regenerate Others button
- ComparisonView — full-screen A/B preview with thumbnail filmstrip
- NotionMockup — Notion-faithful cover render with reposition drag interaction
- FinalizeView — two-phase: review (confirm button) → saved (Manus handoff message)
- JsonOutput — code block with scrollable/expandable toggle and copy button

### Deleted components (do not recreate)
TopBar, Sidebar, OptionCard, CustomUrlCard, AssignModal, ReviewPanel,
NotionMock, PageChip, SuccessOverlay — all removed in v2.0.0

## Design system
- Dark-first, charcoal background (#0B0B0D range)
- Font: Inter
- Accent: foreground/background tokens (no hardcoded indigo)
- Animations: Framer Motion throughout — modal-in, badge-pop, stagger
- Masonry grid: react-masonry-css, natural image proportions (no forced ratio)
- All CSS via Tailwind using HSL CSS variables defined in index.css

## Manus integration notes
- Demo mode: activates automatically when no ?id= or ?config= param present
- Never require login or any external auth service
- Reposition data is a visual reference only — Notion API does not support
  programmatic repositioning. The saved configs help Manus guide users manually.

## Refine / Keep & Regenerate flow
When user enters refine mode:
1. Grid dims to 40% opacity
2. Clicking a card toggles it as "locked" (green ring, lock icon, full opacity)
3. RefineModeBar shows count and Regenerate Others button
4. On confirm: payload sent to Supabase, unlocked images swap to new seeds,
   toast shows the regenerate JSON payload

## Environment variables (Vercel)
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server-only, never exposed to client)

## File naming
- Components: PascalCase.tsx
- Hooks: camelCase.ts with "use" prefix
- Types: src/types/index.ts and src/lib/cover-picker-types.ts
- API routes: /api/ (Vercel serverless)

## Never do these things
- Never modify /api/ files without explicit instruction
- Never modify useUrlState.ts without explicit instruction
- Never recreate deleted components (TopBar, Sidebar, etc.)
- Never hardcode PAGES, PAGE_ICONS, or image seeds — everything comes from config
- Never use canvas or blob URLs for images
- Never add global state management (no Zustand, Context, Redux)
- Never make architectural changes without updating CHANGELOG.md

## Before every Claude Code session
Re-read this file entirely. The component list and state shape above are
authoritative. If you see imports referencing deleted components, remove them.