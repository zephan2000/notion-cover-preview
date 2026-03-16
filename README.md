# Notion Cover Preview

A static React app that lets users preview and select cover images for Notion workspace pages. Built for use with [Manus AI](https://manus.im) agent workflows.

## How it works

1. **Manus** encodes workspace page data (names, icons, candidate image URLs) into a base64 `?config=` query parameter
2. **User** opens the URL and sees Notion-faithful cover mockups for each page
3. **User** selects one image per page (Option A, Option B, or a custom URL)
4. **User** clicks Confirm — selections are written to the URL hash as `#selections=[base64 JSON]`
5. **Manus** reads `window.location.hash` and extracts the selections

## URL Schema

### Input — `?config=`

Base64-encoded JSON:

```json
{
  "workspace_name": "My Workspace",
  "pages": [
    {
      "id": "admin",
      "name": "Admin",
      "icon": "📄",
      "option_a": "https://images.unsplash.com/photo-xxx?w=1920",
      "option_b": "https://images.unsplash.com/photo-yyy?w=1920"
    }
  ]
}
```

### Output — `#selections=`

Base64-encoded JSON:

```json
{
  "selections": { "admin": "https://images.unsplash.com/photo-xxx?w=1920" },
  "confirmed_at": "2026-03-16T10:00:00.000Z"
}
```

### Demo mode

If no `?config=` parameter is present, the app loads with 3 sample pages.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173/notion-cover-preview/

## Deploy to GitHub Pages

```bash
npm run deploy
```

Or push to `main` — GitHub Actions will auto-deploy.

## Tech stack

- React 18 + TypeScript (strict)
- Vite
- Tailwind CSS v3
- Deployed to GitHub Pages (pure static, no backend)
