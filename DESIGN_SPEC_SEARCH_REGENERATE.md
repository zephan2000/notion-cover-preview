# Design Spec: In-App Image Search & Regeneration

## Core Concept
A conversational search drawer anchored to a floating, snappable refine toolbar that lets users find better cover images without leaving Cover Studio. Two entry points, one unified system.

## Toolbar Behavior
The existing refine toolbar becomes a floating pill that:
- **Default**: centered at bottom (current position)
- **Snappable**: user can drag it to snap to left edge, right edge, or back to center (3 positions only — no free-float)
- **Styling**: identical to current — no visual redesign
- **New element**: a search icon added to the toolbar, available in both browse and refine modes

## Two Entry Points

### Search icon (browse or refine mode)
- Tapping the search icon slides up a search drawer from the toolbar
- Behavior: **additive merge** — new images join the grid with a subtle glow ("New" state clears on first hover/click)
- Drawer prompt: "Search for more cover images"

### "Regenerate Others" button (refine mode only, after locking)
- Opens the same search drawer, but in **swap mode** — new images replace unlocked ones
- Drawer is pre-contextualized: "Replacing {N} images — what should I look for?"
- Context-aware chips appear based on locked vs. unlocked tag delta

## Search Drawer UI

```
┌──────────────────────────────────────────────────────┐
│  × Close                                    Swap mode│
│                                              (or Add)│
│                                                      │
│  🔍 [                                              ] │
│                                                      │
│  [Less corporate] [Warmer tones] [More natural]      │
│                                                      │
│  ┌ Conversation history (scrollable) ──────────────┐ │
│  │ You: "warm lifestyle photos"                    │ │
│  │ → Added 10 images                               │ │
│  │ You: "less saturated, more muted tones"         │ │
│  │ → Added 8 images                                │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  [Search · up to 12 new images]                      │
└──────────────────────────────────────────────────────┘
```

- **Free-text input** is the primary interaction
- **Chips** appear below input — generated from tag delta (refine mode) or brand_vibe fallback (browse mode). Clicking a chip appends its text to the input
- **Conversation history** shows prior rounds so user sees progression. History is also sent to the AI so it learns from previous rounds
- **Mode indicator**: subtle label showing "Adding to pool" vs "Replacing {N} images"

## Context-Aware Chips (frontend-only, zero API cost)

```
lockedTags   = frequency count of tags on locked images
unlockedTags = frequency count of tags on unlocked images

gap      = tags in unlocked but not/less in locked
affinity = tags in locked but not/less in unlocked

chips = [
  "Less {gap[0]}"       →  e.g. "Less corporate"
  "Less {gap[1]}"       →  e.g. "Less abstract"
  "More {affinity[0]}"  →  e.g. "More warm"
  "More {affinity[1]}"  →  e.g. "More natural"
]
```

Fallback (no locks): chips from `brand_context.brand_vibe`.

## Backend Architecture

### New endpoint: POST /api/search-images

```
Request:
{
  "query": "warm lifestyle photos, less corporate",
  "history": [
    { "query": "...", "returned_urls": ["..."] }
  ],
  "brand_context": {
    "business_type": "skincare brand",
    "brand_vibe": ["warm", "minimal", "organic"]
  },
  "existing_urls": ["...all current pool URLs..."],
  "count": 12
}

Response:
{
  "images": [
    { "url": "https://images.unsplash.com/photo-xxx?w=1920", "tags": ["warm", "lifestyle"], "source": "unsplash" }
  ],
  "search_queries_used": ["warm lifestyle skincare", "muted organic aesthetic"]
}
```

### Internal flow:
1. Claude Haiku receives user query + history + brand context
2. Generates 3-5 keyword queries optimized for stock image APIs
3. Pexels API + Unsplash API + Pixabay API execute queries in parallel (free)
4. Claude Haiku filters: dedupes against existing_urls, validates URLs, assigns tags
5. Returns up to `count` images

### Cost per round: ~$0.001-0.002 (two Haiku calls) + free stock API calls

## Config Schema Change

Manus includes brand context in config POST:
```json
{
  "config": {
    "workspace_name": "...",
    "brand_context": {
      "business_type": "skincare brand",
      "brand_vibe": ["warm", "minimal", "organic"]
    },
    "pages": [...],
    "image_pool": [...]
  }
}
```

## Frontend State Changes

New additions to AppState:
- `searchDrawerOpen: boolean`
- `searchMode: 'add' | 'swap'`
- `searchHistory: { query: string, resultCount: number }[]`
- `newImageIds: string[]` — tracks which images have the "new" glow (cleared on hover)

New reducer actions:
- `OPEN_SEARCH` (with mode)
- `CLOSE_SEARCH`
- `SEARCH_RESULTS_RECEIVED` (merges or swaps images into pool)
- `CLEAR_NEW_BADGE` (on hover/click)

## Environment Variables (Vercel, server-side only)
- `PEXELS_API_KEY`
- `UNSPLASH_ACCESS_KEY`
- `UNSPLASH_SECRET_KEY`
- `PIXABAY_API_KEY`
- `OPENROUTER_API_KEY` (for Claude Haiku calls via OpenRouter)

## Implementation Priority
1. Config schema change (brand_context) + .gitignore + env var setup
2. POST /api/search-images endpoint
3. Floating snappable toolbar
4. Search drawer UI + conversational history
5. Context-aware chips
6. New-image glow treatment

## What Stays The Same
- Locking UX in refine mode — unchanged
- Image assignment to pages — unchanged
- Finalize flow — unchanged
- Supabase config/selections handoff — unchanged
- All existing components — no deletions

## What Changes in Manus Skill Doc
- Phase 2 Step 2.4 messaging: mention in-app search capability
- Step 2.4a (expand pool manually): becomes fallback only
- Step 2.4b (Keep & Regenerate handler): simplified — app handles it
- Config schema in Step 2.2: adds brand_context
