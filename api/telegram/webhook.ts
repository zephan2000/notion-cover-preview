import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Missing Supabase env vars' });
    }

    if (!botToken) {
      return res.status(500).json({ error: 'Missing TELEGRAM_BOT_TOKEN' });
    }

    const update = req.body;
    const message = update?.message;

    if (!message?.text || !message?.from?.id) {
      // Not a text message — ignore (could be an edit, photo, etc.)
      return res.status(200).json({ ok: true });
    }

    const chatId = String(message.from.id);
    const text = message.text.trim();

    // Parse /start WORKSPACE_ID
    const startMatch = text.match(/^\/start\s+([0-9a-f-]{36})$/i);

    if (!startMatch) {
      // Not a /start command with a workspace ID — send help message
      await sendTelegramMessage(botToken, chatId,
        'Hi! To connect notifications, use the link provided during your workspace setup.\n\n'
        + 'If you already have a link, click it and it will connect automatically.'
      );
      return res.status(200).json({ ok: true });
    }

    const workspaceId = startMatch[1];
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify workspace exists and has completed Facebook OAuth
    const { data: workspace, error: fetchError } = await supabase
      .from('workspaces')
      .select('id, client_name, access_token, telegram_chat_id')
      .eq('id', workspaceId)
      .single();

    if (fetchError || !workspace) {
      await sendTelegramMessage(botToken, chatId,
        '❌ Workspace not found. The link may have expired or the workspace ID is invalid.\n\n'
        + 'Please contact your workspace manager for a new link.'
      );
      return res.status(200).json({ ok: true });
    }

    if (!workspace.access_token) {
      await sendTelegramMessage(botToken, chatId,
        '⚠️ This workspace hasn\'t completed Instagram setup yet.\n\n'
        + 'Please complete the Instagram authorization first, then try this link again.'
      );
      return res.status(200).json({ ok: true });
    }

    // Check if already connected
    if (workspace.telegram_chat_id === chatId) {
      await sendTelegramMessage(botToken, chatId,
        `✅ You're already connected to ${workspace.client_name}'s workspace.\n\n`
        + 'You\'ll receive updates about workspace builds, post scheduling, and any issues that need attention.'
      );
      return res.status(200).json({ ok: true });
    }

    // Write telegram_chat_id to workspace row
    const { error: updateError } = await supabase
      .from('workspaces')
      .update({
        telegram_chat_id: chatId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workspaceId);

    if (updateError) {
      await sendTelegramMessage(botToken, chatId,
        '❌ Failed to save your Telegram connection. Please try again.'
      );
      return res.status(200).json({ ok: true });
    }

    await sendTelegramMessage(botToken, chatId,
      `✅ Connected! You'll receive updates for ${workspace.client_name}'s workspace.\n\n`
      + 'You\'ll be notified when:\n'
      + '• Your workspace is ready\n'
      + '• Posts are scheduled or published\n'
      + '• Something needs your attention'
    );

    return res.status(200).json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // Always return 200 to Telegram to prevent retries
    console.error('Telegram webhook error:', message);
    return res.status(200).json({ ok: true, error: message });
  }
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });
}
