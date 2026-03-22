import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { workspace_id } = req.query;

  if (!workspace_id || typeof workspace_id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid workspace_id query parameter' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Missing Supabase env vars' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('workspaces')
      .select('access_token, ig_account_id, client_name')
      .eq('id', workspace_id)
      .single();

    if (error || !data) {
      return res.status(200).json({ verified: false, reason: 'workspace_id not found' });
    }

    if (!data.access_token) {
      return res.status(200).json({ verified: false, reason: 'awaiting_oauth' });
    }

    return res.status(200).json({
      verified: true,
      ig_account_id: data.ig_account_id,
      client_name: data.client_name,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'Function error', detail: message });
  }
}
