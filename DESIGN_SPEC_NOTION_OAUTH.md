# Design Spec: Notion OAuth for n8n Integration Access

## Problem

Phase 3 Step E3 calls n8n to create the Posts database inside the user's Notion workspace. n8n currently uses a static internal integration token. Notion requires the workspace owner to manually assign internal integrations to pages before API calls can touch them. This manual step is the #1 failure point in the build pipeline.

## Solution

Replace the static n8n Notion credential with a per-workspace OAuth token. The user authorizes via Notion's OAuth flow, which includes a built-in page picker. The token is stored in the `workspaces` table and passed to n8n at E3 time.

## Placement: Phase 3, between Step D and E

**Why not Phase 1:** Pages don't exist yet. The user can't select them in Notion's page picker.
**Why after Step D:** By this point, the root page and all children exist. The user selects the exact workspace root page they can see in Notion.

### Updated Phase 3 execution order

```
A  → Root page                    (Notion MCP — unchanged)
B  → Root dashboard DB            (Notion MCP — unchanged)
C  → Top-level pages + callouts   (Notion MCP — unchanged)
D  → Nested databases + months    (Notion MCP — unchanged)
D+ → Notion OAuth                 (NEW — user authorizes, selects root page)
E1 → months! DB                   (Notion MCP — unchanged)
E2 → Month entry                  (Notion MCP — unchanged)
E3 → Posts DB via n8n             (n8n — now uses per-workspace OAuth token)
F  → Verification                 (unchanged, plus new Check 9)
```

D+ is a user interaction checkpoint, not a Notion API call. Manus sends a link, user clicks, callback handles storage, Manus polls verify.

---

## Notion OAuth API Reference (verified from docs)

These are the real API contracts. Do not deviate.

### Authorization URL

```
GET https://api.notion.com/v1/oauth/authorize
  ?client_id=<NOTION_OAUTH_CLIENT_ID>
  &redirect_uri=https://notion-cover-preview.vercel.app/api/notion-oauth/callback
  &response_type=code
  &owner=user
  &state=<workspace_id>
```

- No `scope` parameter — Notion capabilities are set in the integration settings, not per-request
- `owner=user` is required (always)
- `state` carries `workspace_id` for CSRF + routing (same pattern as Facebook flow)

### Token Exchange

```
POST https://api.notion.com/v1/oauth/token
Authorization: Basic base64(NOTION_OAUTH_CLIENT_ID:NOTION_OAUTH_CLIENT_SECRET)
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "<code from callback>",
  "redirect_uri": "https://notion-cover-preview.vercel.app/api/notion-oauth/callback"
}
```

- Auth is HTTP Basic (base64 of client_id:client_secret) — NOT query params like Facebook
- Single call — no short-lived → long-lived exchange like Facebook
- `redirect_uri` is required if multiple URIs configured in integration settings

### Token Response

```json
{
  "access_token": "ntn_...",
  "token_type": "bearer",
  "refresh_token": "nrt_...",
  "bot_id": "uuid",
  "workspace_id": "uuid",
  "workspace_name": "string|null",
  "workspace_icon": "string|null",
  "owner": { "type": "user", "user": { "id": "...", "name": "..." } },
  "duplicated_template_id": null,
  "request_id": "uuid"
}
```

### Token Refresh

```
POST https://api.notion.com/v1/oauth/token
Authorization: Basic base64(NOTION_OAUTH_CLIENT_ID:NOTION_OAUTH_CLIENT_SECRET)
Content-Type: application/json

{
  "grant_type": "refresh_token",
  "refresh_token": "nrt_..."
}
```

- Expiration duration is not documented — handle refresh on 401 in n8n, not on a timer
- Response shape is identical to initial token exchange

### Error on User Denial

Redirect to: `<redirect_uri>?error=access_denied&state=<workspace_id>`

---

## Files to Create

### 1. `api/notion-oauth/initiate.ts`

**Pattern:** Mirror `api/oauth/initiate.ts` lines 1-65

**Key differences from Facebook initiate:**
- Does NOT create a workspace row (already exists from Phase 1 Facebook OAuth)
- Reads `workspace_id` from request body, verifies it exists in `workspaces` table
- Reads `NOTION_OAUTH_CLIENT_ID` from env (not `FACEBOOK_APP_ID`)
- Auth URL is `https://api.notion.com/v1/oauth/authorize` (not facebook.com)
- Params: `client_id`, `redirect_uri`, `response_type=code`, `owner=user`, `state=workspace_id`
- No `scope` param

**Request:**
```
POST /api/notion-oauth/initiate
Body: { "workspace_id": "uuid" }
```

**Response:**
```json
{ "oauth_url": "https://api.notion.com/v1/oauth/authorize?..." }
```

**Error cases:**
- 400: Missing workspace_id
- 404: workspace_id not found in Supabase
- 500: Missing NOTION_OAUTH_CLIENT_ID env var

### 2. `api/notion-oauth/callback.ts`

**Pattern:** Mirror `api/oauth/callback.ts` lines 1-255

**Key differences from Facebook callback:**
- Token exchange is a single POST to `https://api.notion.com/v1/oauth/token`
- Uses HTTP Basic Auth: `Authorization: Basic ${btoa(clientId + ':' + clientSecret)}`
- Body: `{ "grant_type": "authorization_code", "code": "...", "redirect_uri": "..." }`
- No multi-step exchange (no short→long-lived dance)
- No Facebook Pages resolution or Instagram account lookup
- Stores: `notion_access_token`, `notion_refresh_token`, `notion_bot_id`, `notion_workspace_id`
- Reuse the exact `renderPage()` helper from Facebook callback (copy it)
- Success message references Notion, not Instagram

**Query params from Notion redirect:**
- Success: `?code=<code>&state=<workspace_id>`
- Denial: `?error=access_denied&state=<workspace_id>`

### 3. `api/notion-oauth/verify.ts`

**Pattern:** Mirror `api/oauth/verify.ts` lines 1-49

**Key differences from Facebook verify:**
- Checks `notion_access_token` instead of `access_token`
- Returns `notion_bot_id` and `notion_workspace_id` on success
- Awaiting reason: `"awaiting_notion_oauth"` (not `"awaiting_oauth"`)

**Request:**
```
GET /api/notion-oauth/verify?workspace_id=<uuid>
```

**Responses:**
```json
{ "verified": true, "notion_bot_id": "...", "notion_workspace_id": "..." }
{ "verified": false, "reason": "awaiting_notion_oauth" }
{ "verified": false, "reason": "workspace_id not found" }
```

---

## Files to Modify

### 4. Supabase Migration: `supabase/migration_notion_oauth.sql`

```sql
ALTER TABLE public.workspaces
  ADD COLUMN notion_access_token  text,
  ADD COLUMN notion_refresh_token text,
  ADD COLUMN notion_bot_id        text,
  ADD COLUMN notion_workspace_id  text;
```

Four nullable columns. No new table. Same row, same workspace_id key.

### 5. Phase Protocol: `PHASE3_E_FEEDPLAN.md`

Insert new section "D+ — Notion OAuth" before E1. Add:
- Initiate call: `POST /api/notion-oauth/initiate` with `{ workspace_id: WORKSPACE_ID }`
- User instruction copy
- Poll: `GET /api/notion-oauth/verify?workspace_id=WORKSPACE_ID`
- Failure handling
- STATE BLOCK write with `notion_oauth_verified: yes`

### 6. Phase Protocol: `PHASE3_ENTRY.md`

Update ID dependency table:
- Before Sub-step E: add `notion_oauth_verified: yes` to required state

### 7. Phase Protocol: `STATE_PROTOCOL.md`

Add to Phase 3 section:
```
notion_oauth_verified: [yes / no]
```

### 8. Phase Protocol: `PHASE3_F_VERIFY.md`

Add Check 9:
- `notion_access_token` exists in workspaces table for this workspace_id
- Validate by making a lightweight Notion API call (e.g., GET /v1/users/me with the token)

### 9. n8n Workflow

Modify the workflow to:
1. Accept `workspace_id` (already does)
2. Query Supabase: `SELECT notion_access_token FROM workspaces WHERE id = workspace_id`
3. Use that token as `Authorization: Bearer <token>` for Notion API calls
4. On 401: attempt refresh using `notion_refresh_token`, update Supabase, retry once

---

## Environment Variables (Vercel)

```
NOTION_OAUTH_CLIENT_ID=<from Notion developer portal>
NOTION_OAUTH_CLIENT_SECRET=<from Notion developer portal>
```

## Notion Developer Portal Setup (manual, pre-build)

1. Go to https://www.notion.so/my-integrations
2. Create new integration → select "Public" type
3. Set redirect URI: `https://notion-cover-preview.vercel.app/api/notion-oauth/callback`
4. Capabilities: Read content, Update content, Insert content (required for Posts DB creation)
5. Copy OAuth client ID and secret → set as Vercel env vars

---

## Manus-Facing Copy (Phase 3, after Step D)

```
Your workspace structure is built! One more step before we set up the posting automation.

Click the link below to connect Notion — when it asks which pages to share,
select your "[client_name]" workspace page:

→ [oauth_url]

Come back here once you're done.
```

---

## What NOT to build

- No combined Facebook+Notion auth page
- No token refresh cron job — handle on 401 in n8n
- No replacement of Claude's Notion MCP — OAuth token is for n8n only
- No frontend UI — this is Manus-to-user via link, same as Facebook OAuth
- No Notion OAuth reauth flow yet — build when needed (tokens last longer than Facebook's 60 days)
- No new Supabase table — columns go on existing `workspaces` row