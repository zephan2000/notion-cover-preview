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

  const { code, state, error: fbError, error_description } = req.query;

  // Handle Facebook denial / error
  if (fbError) {
    const desc = typeof error_description === 'string' ? error_description : 'Authorization was denied.';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(
      renderPage(
        'Authorization Failed',
        'Authorization Failed',
        `Facebook returned an error: ${desc}. You can close this tab and try again from the link Manus sent you.`,
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
    const facebookAppId = process.env.FACEBOOK_APP_ID;
    const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;

    if (!supabaseUrl || !supabaseServiceKey || !facebookAppId || !facebookAppSecret) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(500).send(
        renderPage('Server Error', 'Server Error', 'Missing server configuration. Please contact support.', true),
      );
    }

    const redirectUri = 'https://notion-cover-preview.vercel.app/api/oauth/callback';

    // Step 1: Exchange code for short-lived token
    const tokenUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', facebookAppId);
    tokenUrl.searchParams.set('client_secret', facebookAppSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(
        renderPage(
          'Authorization Failed',
          'Token Exchange Failed',
          'Could not exchange the authorization code. The link may have expired. Please try again from the link Manus sent you.',
          true,
        ),
      );
    }

    // Step 2: Exchange short-lived for long-lived user token
    const longTokenUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
    longTokenUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longTokenUrl.searchParams.set('client_id', facebookAppId);
    longTokenUrl.searchParams.set('client_secret', facebookAppSecret);
    longTokenUrl.searchParams.set('fb_exchange_token', tokenData.access_token);

    const longTokenRes = await fetch(longTokenUrl.toString());
    const longTokenData = await longTokenRes.json();

    if (!longTokenRes.ok || !longTokenData.access_token) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(
        renderPage(
          'Token Exchange Failed',
          'Long-Lived Token Exchange Failed',
          `Could not exchange for a long-lived token. Debug: ${JSON.stringify(longTokenData)}`,
          true,
        ),
      );
    }

    const accessToken = longTokenData.access_token;

    // Step 3: Get user's Facebook pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${encodeURIComponent(accessToken)}`,
    );
    const pagesData = await pagesRes.json();

    if (!pagesData.data || !Array.isArray(pagesData.data) || pagesData.data.length === 0) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(
        renderPage(
          'No Pages Found',
          'No Facebook Pages Found',
          'Your Facebook account does not have any Pages. An Instagram Business or Creator account must be connected to a Facebook Page. Please set one up and try again.',
          true,
        ),
      );
    }

    // Step 4: Find connected Instagram account + capture page token and page ID
    let igAccountId: string | null = null;
    let pageAccessToken: string | null = null;
    let fbPageId: string | null = null;
    const debugPages: Array<{ id: string; name: string; igResponse: unknown }> = [];

    for (const page of pagesData.data) {
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${encodeURIComponent(page.access_token || accessToken)}`,
      );
      const igData = await igRes.json();

      debugPages.push({ id: page.id, name: page.name, igResponse: igData });

      if (igData.instagram_business_account?.id) {
        igAccountId = igData.instagram_business_account.id;
        pageAccessToken = page.access_token;
        fbPageId = page.id;
        break;
      }
    }

    if (!igAccountId) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(
        renderPage(
          'No Instagram Account',
          'No Instagram Account Found',
          `Debug info — Pages found: ${JSON.stringify(debugPages, null, 2)}`,
          true,
        ),
      );
    }

    // Step 5: Store all credentials in workspaces table
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from('workspaces')
      .update({
        access_token: accessToken,
        ig_account_id: igAccountId,
        page_access_token: pageAccessToken,
        fb_page_id: fbPageId,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workspaceId);

    if (updateError) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(500).send(
        renderPage('Server Error', 'Failed to Save', 'Could not save your authorization. Please try again.', true),
      );
    }

    // Success
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(
      renderPage(
        'Authorization Complete',
        'You\'re all set!',
        `Your Instagram account has been connected successfully. Token type: long-lived (expires ${expiresAt}). You can close this tab and return to your conversation with Manus.`,
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
