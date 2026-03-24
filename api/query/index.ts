import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { table } = req.query;

  if (!table || typeof table !== 'string') {
    return res.status(400).json({ error: 'Provide ?table=workspaces or ?table=workspace-databases' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Missing Supabase env vars' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (table === 'workspaces') {
      const { id, name } = req.query;

      if (!id && !name) {
        return res.status(400).json({ error: 'Provide ?id= or ?name= query parameter' });
      }

      // Safe columns — exclude access_token, page_access_token
      const columns = 'id, client_name, workspace_name, ig_account_id, fb_page_id, google_drive_link, token_expires_at, is_reauth, created_at, updated_at';

      let query = supabase.from('workspaces').select(columns);

      if (id && typeof id === 'string') {
        query = query.eq('id', id);
      } else if (name && typeof name === 'string') {
        query = query.ilike('client_name', `%${name}%`);
      }

      const { data, error } = await query;

      if (error) {
        return res.status(500).json({ error: 'Query failed', detail: error.message });
      }

      return res.status(200).json({ count: data?.length ?? 0, data: data ?? [] });
    }

    if (table === 'workspace-databases') {
      const { workspace_id } = req.query;

      if (!workspace_id || typeof workspace_id !== 'string') {
        return res.status(400).json({ error: 'Provide ?workspace_id= query parameter' });
      }

      const { data, error } = await supabase
        .from('workspace_databases')
        .select('*')
        .eq('workspace_id', workspace_id);

      if (error) {
        return res.status(500).json({ error: 'Query failed', detail: error.message });
      }

      return res.status(200).json({ count: data?.length ?? 0, data: data ?? [] });
    }

    return res.status(400).json({ error: `Unknown table: ${table}. Use "workspaces" or "workspace-databases".` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'Function error', detail: message });
  }
}
