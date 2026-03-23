import type { VercelRequest, VercelResponse } from '@vercel/node';

function renderPage(title: string, heading: string, message: string, isError: boolean): string {
  const accentColor = isError ? '#ef4444' : '#22c55e';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: hsl(240 10% 3.9%);
      color: hsl(60 9% 93%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      text-align: center;
      max-width: 480px;
      padding: 2rem;
    }
    .icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: ${accentColor}20;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 28px;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: -0.03em;
      margin-bottom: 0.75rem;
    }
    p {
      color: hsl(240 5% 50%);
      line-height: 1.6;
      font-size: 0.95rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${isError ? '&#10007;' : '&#10003;'}</div>
    <h1>${heading}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error: notionError } = req.query;

  // Handle Notion denial
  if (notionError === 'access_denied') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(
      renderPage(
        'Authorization Denied',
        'Authorization Denied',
        'You declined the Notion authorization. You can close this tab and try again from the link Manus sent you.',
        true,
      ),
    );
  }

  if (!code || typeof code !== 'string' || !state || typeof state !== 'string') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(400).send(
      renderPage(
        'Invalid Request',
        'Invalid Request',
        'Missing authorization code or state parameter. Please try again from the link Manus sent you.',
        true,
      ),
    );
  }

  // state = workspace_id (UUID passed via OAuth state param)
  const workspaceId = state;

  try {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const notionClientId = process.env.NOTION_OAUTH_CLIENT_ID;
    const notionClientSecret = process.env.NOTION_OAUTH_CLIENT_SECRET;

    if (!supabaseUrl || !supabaseServiceKey || !notionClientId || !notionClientSecret) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(500).send(
        renderPage('Server Error', 'Server Error', 'Missing server configuration. Please contact support.', true),
      );
    }

    const redirectUri = 'https://notion-cover-preview.vercel.app/api/notion-oauth/callback';

    // Notion uses HTTP Basic Auth for token exchange: base64(client_id:client_secret)
    const basicAuth = Buffer.from(`${notionClientId}:${notionClientSecret}`).toString('base64');

    const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(
        renderPage(
          'Authorization Failed',
          'Token Exchange Failed',
          `Could not exchange the authorization code. The link may have expired. Please try again from the link Manus sent you. Debug: ${JSON.stringify(tokenData)}`,
          true,
        ),
      );
    }

    // Store Notion OAuth credentials on the existing workspace row
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabase
      .from('workspaces')
      .update({
        notion_access_token: tokenData.access_token,
        notion_refresh_token: tokenData.refresh_token || null,
        notion_bot_id: tokenData.bot_id || null,
        notion_workspace_id: tokenData.workspace_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workspaceId);

    if (updateError) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(500).send(
        renderPage('Server Error', 'Failed to Save', 'Could not save your Notion authorization. Please try again.', true),
      );
    }

    // Success
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(
      renderPage(
        'Notion Connected',
        'Notion is connected!',
        'Your Notion workspace has been linked successfully. You can close this tab and return to your conversation with Manus.',
        false,
      ),
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(
      renderPage('Server Error', 'Something went wrong', `An unexpected error occurred: ${message}. Please try again.`, true),
    );
  }
}