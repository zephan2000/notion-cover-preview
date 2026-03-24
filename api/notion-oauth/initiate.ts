import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const notionClientId = process.env.NOTION_OAUTH_CLIENT_ID;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Missing Supabase env vars' });
    }

    if (!notionClientId) {
      return res.status(500).json({ error: 'Missing NOTION_OAUTH_CLIENT_ID env var' });
    }

    const { workspace_id } = req.body;

    if (!workspace_id || typeof workspace_id !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid workspace_id' });
    }

    // Verify workspace exists AND has completed Facebook OAuth
    // This prevents Notion OAuth from being initiated on orphaned/duplicate rows
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('workspaces')
      .select('id, access_token, client_name')
      .eq('id', workspace_id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Workspace not found', detail: error?.message });
    }

    if (!data.access_token) {
      return res.status(400).json({
        error: 'Facebook OAuth not completed',
        detail: `Workspace "${data.client_name}" (${workspace_id}) has not completed Facebook OAuth yet. Complete Facebook OAuth before initiating Notion OAuth.`,
      });
    }

    const redirectUri = 'https://notion-cover-preview.vercel.app/api/notion-oauth/callback';

    // Notion OAuth — no scope param; capabilities are set in integration settings
    const oauthUrl = new URL('https://api.notion.com/v1/oauth/authorize');
    oauthUrl.searchParams.set('client_id', notionClientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('owner', 'user');
    oauthUrl.searchParams.set('state', workspace_id);

    return res.status(200).json({
      oauth_url: oauthUrl.toString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'Function error', detail: message });
  }
}