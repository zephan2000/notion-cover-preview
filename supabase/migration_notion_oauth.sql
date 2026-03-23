-- ============================================================
-- Migration: Add Notion OAuth columns to workspaces table
-- Purpose: Store per-workspace Notion OAuth tokens so n8n can
--          use them instead of a static internal integration key
-- ============================================================

ALTER TABLE public.workspaces
  ADD COLUMN notion_access_token  text,
  ADD COLUMN notion_refresh_token text,
  ADD COLUMN notion_bot_id        text,
  ADD COLUMN notion_workspace_id  text;