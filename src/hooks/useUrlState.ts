import { useState, useEffect } from 'react';
import type { PreviewConfig, SelectionsOutput } from '../types';
import { decodeConfig, encodeSelections } from '../utils/urlEncoding';

const DEMO_CONFIG: PreviewConfig = {
  workspace_name: 'Nami Matcha (Demo)',
  pages: [
    {
      id: 'admin',
      name: 'Admin',
      icon: '\u{1F4C4}',
      option_a: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920',
      option_b: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1920',
    },
    {
      id: 'content_ideas',
      name: 'Content Ideas',
      icon: '\u{1F4A1}',
      option_a: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1920',
      option_b: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1920',
    },
    {
      id: 'feed_plan',
      name: 'Feed Plan',
      icon: '\u{1F4C5}',
      option_a: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1920',
      option_b: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1920',
    },
  ],
};

export function useUrlState() {
  const [config, setConfig] = useState<PreviewConfig>(DEMO_CONFIG);
  const [configId, setConfigId] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Path 1: ?id= — fetch config from Supabase via API
    const id = params.get('id');
    if (id) {
      setConfigId(id);
      setIsDemo(false);
      fetch(`/api/config/${encodeURIComponent(id)}`)
        .then((res) => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then((data) => {
          if (data.config) setConfig(data.config);
        })
        .catch(() => {
          setConfig(DEMO_CONFIG);
          setIsDemo(true);
          setConfigId(null);
        })
        .finally(() => setLoading(false));
      return;
    }

    // Path 2: ?config= — inline base64 config (small payloads)
    const configParam = params.get('config');
    if (configParam) {
      const decoded = decodeConfig(configParam);
      if (decoded) {
        setConfig(decoded);
        setIsDemo(false);
      }
    }

    setLoading(false);
  }, []);

  async function writeSelections(selections: Record<string, string>): Promise<boolean> {
    const confirmedAt = new Date().toISOString();

    // If we have a config ID, write selections to Supabase via API
    if (configId) {
      try {
        const res = await fetch(`/api/config/${encodeURIComponent(configId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selections, confirmed_at: confirmedAt }),
        });
        if (!res.ok) throw new Error('Failed to save');
        return true;
      } catch {
        return false;
      }
    }

    // Fallback: write to URL hash (for ?config= or demo mode)
    const output: SelectionsOutput = { selections, confirmed_at: confirmedAt };
    const encoded = encodeSelections(output);
    window.location.hash = `selections=${encoded}`;
    return true;
  }

  return { config, configId, isDemo, loading, writeSelections };
}
