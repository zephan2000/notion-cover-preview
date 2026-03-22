-- ============================================================
-- Migration: Create workspaces + workspace_databases tables
-- Replaces: workspace_clients (denormalized, duplicated tokens)
-- Replaces: oauth_tokens (never created — was planned, now unnecessary)
-- ============================================================

-- 1. workspaces — one row per client, single source of truth for credentials
CREATE TABLE public.workspaces (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name     text NOT NULL,
  workspace_name  text,
  ig_account_id   text,
  fb_page_id      text,
  page_access_token text,
  access_token    text,
  google_drive_link text,
  token_expires_at timestamptz,
  is_reauth       boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
-- Service role bypasses RLS by default — no policies needed for server-only access

-- 2. workspace_databases — links Notion Posts database IDs to workspaces
CREATE TABLE public.workspace_databases (
  posts_database_id text PRIMARY KEY,
  workspace_id      uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.workspace_databases ENABLE ROW LEVEL SECURITY;

-- 3. Index for n8n Schedule Post lookup: posts_database_id → workspace_id → workspaces
CREATE INDEX idx_workspace_databases_workspace_id ON public.workspace_databases(workspace_id);

-- ============================================================
-- Migration from workspace_clients (run only if you want to
-- preserve existing data — skip if starting fresh)
-- ============================================================

-- Uncomment the block below to migrate existing workspace_clients data:

-- INSERT INTO public.workspaces (client_name, workspace_name, ig_account_id, fb_page_id, page_access_token, access_token)
-- SELECT DISTINCT ON (workspace_name)
--   workspace_name AS client_name,
--   workspace_name,
--   ig_account_id,
--   fb_page_id,
--   page_access_token,
--   short_lived_instagram_access_token AS access_token
-- FROM public.workspace_clients
-- WHERE workspace_name IS NOT NULL;
--
-- INSERT INTO public.workspace_databases (posts_database_id, workspace_id)
-- SELECT
--   wc.posts_database_id,
--   w.id
-- FROM public.workspace_clients wc
-- JOIN public.workspaces w ON w.workspace_name = wc.workspace_name
-- WHERE wc.posts_database_id IS NOT NULL;
