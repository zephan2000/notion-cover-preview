import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
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
    return res.status(500).json({ error: 'Failed to store config' });
  }

  return res.status(201).json({ id: data.id });
}
