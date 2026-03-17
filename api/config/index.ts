import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Missing env vars', hasUrl: !!supabaseUrl, hasKey: !!supabaseServiceKey });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { config } = req.body;

    if (!config || !config.workspace_name || !Array.isArray(config.pages)) {
      return res.status(400).json({ error: 'Invalid config: requires workspace_name and pages array' });
    }

    const { data, error } = await supabase
      .from('cover_configs')
      .insert({ config_json: config })
      .select('id')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to store config', detail: error.message });
    }

    return res.status(201).json({ id: data.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'Function error', detail: message });
  }
}