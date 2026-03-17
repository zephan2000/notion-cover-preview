# Changelog

All notable changes to this project will be documented here.
Format: [Semantic Versioning](https://semver.org/)

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
