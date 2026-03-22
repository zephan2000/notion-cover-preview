import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const facebookAppId = process.env.FACEBOOK_APP_ID;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Missing Supabase env vars' });
    }

    if (!facebookAppId) {
      return res.status(500).json({ error: 'Missing FACEBOOK_APP_ID env var' });
    }

    const { client_name, google_drive_link } = req.body;

    if (!client_name || typeof client_name !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid client_name' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create workspace row — the returned id becomes the system-wide workspace_id
    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        client_name,
        google_drive_link: google_drive_link || null,
      })
      .select('id')
      .single();

    if (error || !data) {
      return res.status(500).json({ error: 'Failed to create workspace row', detail: error?.message });
    }

    const workspaceId = data.id;

    const redirectUri = 'https://notion-cover-preview.vercel.app/api/oauth/callback';
    const scope = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement';

    const oauthUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
    oauthUrl.searchParams.set('client_id', facebookAppId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('scope', scope);
    oauthUrl.searchParams.set('state', workspaceId);
    oauthUrl.searchParams.set('response_type', 'code');

    return res.status(200).json({
      workspace_id: workspaceId,
      oauth_url: oauthUrl.toString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'Function error', detail: message });
  }
}
