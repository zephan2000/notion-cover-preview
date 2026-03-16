# CLAUDE.md — Notion Cover Preview App

## What this project is

A static React app deployed to GitHub Pages. It is used exclusively by Manus AI
(an autonomous AI agent) to show human users candidate cover images for Notion
workspace pages, collect their selections, and return those selections to Manus
via URL hash.

## Critical architectural constraints

### URL hash handoff — do not change this pattern
Manus reads selections from `window.location.hash` after the user confirms.
This is the ONLY reliable handoff mechanism in Manus's sandboxed browser.
Never replace this with:
- fetch/POST to any server
- localStorage or sessionStorage
- cookies
- postMessage
- WebSockets

The selections are written to hash as: `#selections=[base64-encoded JSON]`
Manus strips the prefix, decodes, and parses.

### No backend, ever
This is a purely static app on GitHub Pages. There is no API, no server,
no edge functions. All state lives in the URL.

### URL length budget
The full URL (config param + hash) must stay under 8000 characters.
The urlEncoding utils must validate this and warn if exceeded.

### Image loading
All images load via <img> tags from external CDNs (Unsplash, Pexels).
Never use canvas, fetch, or blob URLs for images — CORS will block them.

## Component state rules
- No global state management (no Zustand, no Context, no Redux)
- App.tsx owns: currentPageIndex, selections, notionDark, appDark
- All child components receive props only
- useUrlState.ts is the only hook — it handles URL I/O

## Manus integration notes
- Manus passes config via: ?config=[base64(JSON)]
- Manus reads output via: window.location.hash after user confirms
- Demo mode activates automatically when ?config= is absent
- The app must never require user login or any external service

## File naming
- Components: PascalCase.tsx
- Hooks: camelCase.ts with "use" prefix
- Utils: camelCase.ts
- Types: index.ts in /types/

## Tailwind
- Use Tailwind utility classes only — no custom CSS except in index.css (directives)
- Accent colour: #2d6a4f — add to tailwind.config.ts as `accent.DEFAULT`
- Do not use Tailwind's default blue for interactive elements

## When to update CHANGELOG.md
Every PR or meaningful commit. Format: ## [version] - YYYY-MM-DD

## Before every Claude Code session
Re-read this file. Do not make architectural changes without noting the reason
in CHANGELOG.md.
