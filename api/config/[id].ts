import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing config ID' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // GET — fetch config (and selections if present)
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('cover_configs')
      .select('config_json, selections_json')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Config not found or expired' });
    }

    return res.status(200).json({
      config: data.config_json,
      selections: data.selections_json,
    });
  }

  // PATCH — write selections
  if (req.method === 'PATCH') {
    const { selections, confirmed_at } = req.body;

    if (!selections || typeof selections !== 'object') {
      return res.status(400).json({ error: 'Invalid selections payload' });
    }

    const { error } = await supabase
      .from('cover_configs')
      .update({
        selections_json: { selections, confirmed_at },
      })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to save selections' });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
