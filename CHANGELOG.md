# Changelog

All notable changes to this project will be documented here.
Format: [Semantic Versioning](https://semver.org/)

## [2.4.0] - 2026-03-24

### Added — Notion OAuth flow for n8n integration access
- POST /api/notion-oauth/initiate — generates Notion OAuth URL for an existing workspace
- GET /api/notion-oauth/callback — exchanges code for access + refresh token via Notion's OAuth, stores on workspace row
- GET /api/notion-oauth/verify — Manus polls to confirm Notion OAuth completed
- New columns on `workspaces` table: `notion_access_token`, `notion_refresh_token`, `notion_bot_id`, `notion_workspace_id`
- Placed in Phase 3 as Sub-step D+ (after workspace structure is built, before Posts DB creation)
- Eliminates manual Notion integration assignment — user authorizes via OAuth page picker instead
- Phase protocol updates: PHASE3_ENTRY routing table, PHASE3_E_FEEDPLAN (D+ section), STATE_PROTOCOL (notion_oauth_verified field), PHASE3_F_VERIFY (Check 9)
- Required env vars: NOTION_OAUTH_CLIENT_ID, NOTION_OAUTH_CLIENT_SECRET (set in Vercel)

## [2.3.0] - 2026-03-22

### Added — Facebook OAuth flow + workspace identity system
- POST /api/oauth/initiate — creates a `workspaces` row, returns `workspace_id` (UUID) + Facebook OAuth URL
- GET /api/oauth/callback — exchanges code for long-lived token, resolves IG account + FB page credentials, stores all in `workspaces` table
- GET /api/oauth/verify — Manus polls `?workspace_id=` to confirm OAuth completed
- New Supabase tables replacing `workspace_clients`:
  - `workspaces` — one row per client (id, client_name, access_token, ig_account_id, page_access_token, fb_page_id, google_drive_link, token_expires_at)
  - `workspace_databases` — one row per Posts database (posts_database_id → workspace_id FK)
- `workspace_id` (UUID) is the system-wide identity key, generated at initiate time, used across all phases
- Callback stores page_access_token and fb_page_id alongside the user-level long-lived token
- Callback renders dark-themed success/error HTML pages matching the app's design system
- Required env vars: FACEBOOK_APP_ID, FACEBOOK_APP_SECRET (set in Vercel)

## [2.2.2] - 2026-03-18

### Fixed
- Selections not working: reducer state was never initialized with config data — added INIT_CONFIG action to properly set images, pages, and selectedIds inside the reducer on config load
- Demo data switched to picsum.photos seeds matching vibe-weave-select reference (20 images, 5 pages)

## [2.2.0] - 2026-03-18

### Changed — Complete frontend port from vibe-weave-select reference
- Full frontend replaced with vibe-weave-select reference project UI
- Refine mode: lock images to keep, regenerate others, payload shown as dismissible toast
- Reposition: drag focal point in NotionMockup, saves to state and DB via repositions field
- Dynamic pages/workspace: all PAGES/PAGE_ICONS constants removed, replaced with state.pages from config
- FinalizeView: two-phase flow — review (confirm button) then saved (Manus handoff message + JSON output)
- writeSelections now includes repositions in PATCH payload body
- New components: RefineModeBar, CoverCard (with lock/refine), SelectionDock (with refine button)
- Updated types: Added RepositionConfig, updated SelectionsOutput with optional repositions field
- CoverImage type now includes width, height, seed fields (from reference)
- AppState includes lockedIds, regeneratePayload, saving, saved, isDemo

## [2.1.0] - 2026-03-17
### Changed
- CLAUDE.md rewritten to reflect v2.0.0 architecture accurately
- Removed all references to deleted components and old Option A/B model
- Added complete AppState documentation, mode descriptions, and hard constraints

## [1.0.0] - 2026-03-17

### Changed — Cover Studio redesign
- **New image pool model**: Manus sends 15-20 candidate images as a pool; users assign images to pages (replaces Option A/B per-page model)
- **Linear-inspired design**: Dark-first UI with layered surfaces, Inter font, indigo-violet accent, subtle animations
- **New components**: ImageGrid (filterable masonry), ImageCard (hover preview + assigned badge), AssignModal (NotionMock preview + page buttons), PageChip (status pill), ReviewPanel (side-by-side NotionMock review)
- **Two modes**: Browse (image pool grid) and Review (assigned covers as NotionMock cards)
- **Tag filtering**: Images tagged by Manus; users filter pool by tag
- **Removed**: OptionCard, CustomUrlCard, Sidebar — replaced by pool-based browsing
- **Updated types**: PreviewConfig now has `image_pool: ImageCandidate[]` instead of `option_a/option_b` per page

## [0.3.0] - 2026-03-17

### Changed
- Selections now written to Supabase via PATCH /api/config/[id] instead of URL hash
- Manus reads selections by polling GET /api/config/[id] instead of reading URL hash
- URL hash fallback retained only for ?config= (inline base64) path
- GET /api/config/[id] now returns both config and selections
- Added `selections_json` column to cover_configs table
- Confirm button shows "Saving..." state during API write
- Updated CLAUDE.md to reflect API-based handoff

## [0.2.0] - 2026-03-16

### Changed
- Switched deployment from GitHub Pages to Vercel
- Config input now supports two paths: `?id=` (Supabase-backed) and `?config=` (inline base64)
- useUrlState hook now async — fetches config from `/api/config/[id]` when `?id=` is present
- Removed GitHub Actions deploy workflow
- Removed gh-pages dependency
- Updated CLAUDE.md to reflect Vercel + Supabase architecture

### Added
- Vercel serverless API routes: POST /api/config, GET /api/config/[id]
- Supabase integration for ephemeral config storage (public.cover_configs table)
- vercel.json with SPA rewrites
- Loading state in App.tsx while fetching config

## [0.1.0] - 2026-03-16

### Added
- Initial project scaffolding (Vite + React 18 + TypeScript + Tailwind)
- URL schema: ?config= input, #selections= output
- useUrlState hook for URL encode/decode
- Components: TopBar, Sidebar, OptionCard, NotionMock, CustomUrlCard, SuccessOverlay
- Demo mode fallback when ?config= is absent
- CLAUDE.md with full architectural constraints
