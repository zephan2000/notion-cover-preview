import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { workspace_id } = req.query;

  if (!workspace_id || typeof workspace_id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid workspace_id' });
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
      .select('telegram_chat_id')
      .eq('id', workspace_id)
      .single();

    if (error || !data) {
      return res.status(200).json({ connected: false, reason: 'workspace_id not found' });
    }

    if (!data.telegram_chat_id) {
      return res.status(200).json({ connected: false, reason: 'awaiting_telegram' });
    }

    return res.status(200).json({ connected: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'Function error', detail: message });
  }
}
