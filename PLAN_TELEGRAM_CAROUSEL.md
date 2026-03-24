# Plan: Telegram Notifications + Carousel Support + Error Handling

## Phase A: Telegram Deep Link (do first)

### A1. DB change
```sql
ALTER TABLE workspaces ADD COLUMN telegram_chat_id TEXT;
```

### A2. Vercel endpoint: POST /api/telegram/webhook
- Receives Telegram bot webhook updates
- Parses `/start WORKSPACE_ID` from message text
- Validates workspace exists and has completed Facebook OAuth
- Writes `telegram_chat_id` to the matching workspace row
- Responds to user in Telegram: "Connected! You'll receive updates for [client_name]'s workspace."

### A3. Vercel endpoint: GET /api/telegram/status?workspace_id=UUID
- Returns whether Telegram is connected for a workspace
- Used by skill doc to verify

### A4. Skill doc updates
- Phase 1: add Telegram link step after OAuth verified (before releasing user)
- State block: add `telegram_connected: yes/no`
- Phase 4: mention Telegram in handoff summary

### A5. One-time setup
Register webhook with Telegram Bot API:
```
POST https://api.telegram.org/bot{TOKEN}/setWebhook
  ?url=https://notion-cover-preview.vercel.app/api/telegram/webhook
```

### A6. Env var
- `TELEGRAM_BOT_TOKEN` — added to Vercel

---

## Phase B: Posts Schema + Carousel + Callout

### B1. Update Posts DB schema in Create Posts Database n8n workflow

New schema (replaces current locked schema):
```
Name:           title
Caption:        rich_text
Media:          files         ← replaces Creative Link (supports multi-file for carousel)
Post Type:      select        ← replaces Platform
                  → "Instagram Reel" | "Instagram Image" | "Instagram Carousel"
Post Status:    select
                  → "Ready For Approval" | "Ready To Post" | "Posted" | "Failed"
Posting Date:   date
```

Changes from current:
- `Creative Link` (url) → `Media` (files) — supports multiple files for carousel
- `Platform` (select) → `Post Type` (select) — renamed, added "Instagram Carousel"
- `Post Status` — added "Failed" option for retry logic

### B2. Media requirements callout on month entry page

Add a callout block as a **sibling above the Posts database** on the month entry page
(`MONTH_ENTRY_ID`). This is a single block per month, not per post.

In the n8n workflow, after creating the Posts DB, append a block to `MONTH_ENTRY_ID`:

```js
// Notion API: PATCH /v1/blocks/{MONTH_ENTRY_ID}/children
{
  children: [
    {
      object: 'block',
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '📋' },
        color: 'blue_background',
        rich_text: [{
          type: 'text',
          text: {
            content: 'Media requirements for Instagram posts:\n'
              + '• Reels: .mp4 video only (H.264, max 1GB, 3-60 seconds)\n'
              + '• Images: .jpg or .png only\n'
              + '• Carousels: 2-10 items, mix of images and videos allowed\n'
              + '• All media must be a Google Drive sharing link\n'
              + '• Set link access to "Anyone with the link"\n'
              + '• Example: https://drive.google.com/file/d/xxxxx/view?usp=sharing'
          }
        }]
      }
    }
  ]
}
```

This must be inserted BEFORE the Posts database block so it appears above it.
If the n8n workflow creates the Posts DB first (which adds it as a child of the month entry),
the callout should be prepended by inserting it with `after` param pointing to nothing (first position),
or by creating it before the Posts DB creation step.

### B3. Update Schedule Instagram Post n8n workflow

Replace `Creative Link` (url property) reads with `Media` (files property) reads.

Add a Switch node on `Post Type`:

**Instagram Reel** (current flow):
```
POST /{ig-user-id}/media
  video_url: [first file URL from Media]
  caption: [Caption]
  media_type: REELS
→ POST /{ig-user-id}/media_publish
  creation_id: [container_id]
```

**Instagram Image**:
```
POST /{ig-user-id}/media
  image_url: [first file URL from Media]
  caption: [Caption]
→ POST /{ig-user-id}/media_publish
  creation_id: [container_id]
```

**Instagram Carousel**:
```
For each file in Media:
  POST /{ig-user-id}/media
    image_url or video_url: [file URL]
    is_carousel_item: true
  → collect child container IDs

POST /{ig-user-id}/media
  media_type: CAROUSEL
  caption: [Caption]
  children: [child_id_1, child_id_2, ...]
→ POST /{ig-user-id}/media_publish
  creation_id: [carousel_container_id]
```

### B4. Content-Type detection in upload step
- `.mp4` → `video/mp4`
- `.jpg` / `.jpeg` → `image/jpeg`
- `.png` → `image/png`
- Other → reject with error message

### B5. Update skill doc
- Phase 3 Sub-step F verification: update property checks to match new schema
- SKILL.md: update locked schema reference to new property names
- PHASE3_E_FEEDPLAN.md: update E3 expected schema description

---

## Phase C: Telegram Error Handling in n8n Workflows

### C1. Add retry infrastructure to schedule_post_queue
```sql
ALTER TABLE schedule_post_queue
  ADD COLUMN retry_count INTEGER DEFAULT 0,
  ADD COLUMN last_error TEXT;
```
(workspace_id column should already exist from Phase A/B fixes)

### C2. Telegram notification points in Schedule Instagram Post workflow

| Point in workflow | Telegram message |
|---|---|
| After queue insert (success) | 📋 [client] — "${post_name}" queued for scheduling\nPost Type: ${post_type}\nDate: ${date} |
| Google Drive 403/404 | ⚠️ [client] — "${post_name}" failed: can't download media.\n\nFile isn't accessible. Open Drive link → Share → "Anyone with the link".\nThen set Post Status back to "Ready To Post". |
| Wrong file type | ⚠️ [client] — "${post_name}" failed: unsupported file type (${ext}).\n\nInstagram accepts .mp4 (reels), .jpg/.png (images).\nReplace the file, then set Post Status to "Ready To Post". |
| Instagram API rejection | ⚠️ [client] — "${post_name}" failed: ${error.message}\n\nCommon causes: video too long (60s max), wrong ratio, corrupted file.\nFix and set Post Status to "Ready To Post". |

### C3. Telegram notification points in Scheduled Posts workflow

| Point in workflow | Telegram message |
|---|---|
| Publish success | ✅ [client] — "${post_name}" published to Instagram\nIG Media ID: ${id} |
| First failure (retry_count < 3) | ⏳ [client] — "${post_name}" still processing (attempt ${retry}/3). Will retry. |
| Max retries exceeded | ❌ [client] — "${post_name}" failed after 3 attempts.\nError: ${last_error}\nPost Status set to "Failed". Fix the issue and set to "Ready To Post" to retry. |

### C4. Fix spam: filter query in Scheduled Posts
Change the queue query from:
```
WHERE Post_Status = 'Ready To Schedule' AND container_id IS NOT NULL
```
to:
```
WHERE Post_Status = 'Ready To Schedule' AND container_id IS NOT NULL AND (retry_count IS NULL OR retry_count < 3)
```

### C5. Error diagnosis Code node (shared across workflows)
```js
const error = $input.first().json.error || {};
const msg = (error.message || '').toLowerCase();

if (msg.includes('403') || msg.includes('404') || msg.includes('not found')) {
  return [{ json: { error_type: 'drive_access', fix: 'Set Google Drive link to "Anyone with the link" access.' } }];
}
if (msg.includes('unsupported') || msg.includes('format')) {
  return [{ json: { error_type: 'file_type', fix: 'Instagram only accepts .mp4 (reels), .jpg/.png (images).' } }];
}
if (msg.includes('processing') || msg.includes('not ready')) {
  return [{ json: { error_type: 'processing', fix: 'Media is still processing. Will retry automatically.' } }];
}
if (msg.includes('aspect') || msg.includes('ratio') || msg.includes('duration')) {
  return [{ json: { error_type: 'media_spec', fix: 'Check video length (3-60s) and aspect ratio (9:16 for reels).' } }];
}
return [{ json: { error_type: 'unknown', fix: `Instagram error: ${error.message || 'Unknown'}` } }];
```

### C6. Telegram message routing
Every Telegram send node must use dynamic chat_id:
```
chatId: {{ $json.telegram_chat_id || '589408794' }}
```
Falls back to admin (your) chat ID if user hasn't connected Telegram.

The workspace lookup (JOIN query) must include `telegram_chat_id` in the SELECT:
```sql
SELECT w.id, w.client_name, w.ig_account_id, w.access_token,
       w.page_access_token, w.telegram_chat_id
FROM workspace_databases wd
JOIN workspaces w ON w.id = wd.workspace_id
WHERE wd.posts_database_id = '...'
LIMIT 1
```
