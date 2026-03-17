import { useState, useEffect } from 'react';
import type { PreviewConfig } from '../types';

const DEMO_CONFIG: PreviewConfig = {
  workspace_name: 'Nami Matcha (Demo)',
  pages: [
    { id: 'admin', name: 'Admin', icon: '\u{1F4C4}' },
    { id: 'content_ideas', name: 'Content Ideas', icon: '\u{1F4A1}' },
    { id: 'feed_plan', name: 'Feed Plan', icon: '\u{1F4C5}' },
  ],
  image_pool: [
    { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920', tags: ['workspace', 'minimal'] },
    { url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1920', tags: ['workspace', 'modern'] },
    { url: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1920', tags: ['creative', 'desk'] },
    { url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1920', tags: ['planning', 'notebook'] },
    { url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1920', tags: ['planning', 'calendar'] },
    { url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920', tags: ['nature', 'aerial'] },
    { url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920', tags: ['abstract', 'gradient'] },
    { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920', tags: ['tech', 'circuit'] },
    { url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1920', tags: ['tech', 'minimal'] },
    { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920', tags: ['warm', 'coffee'] },
    { url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920', tags: ['creative', 'books'] },
    { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920', tags: ['nature', 'mountain'] },
    { url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920', tags: ['urban', 'city'] },
    { url: 'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=1920', tags: ['abstract', 'colorful'] },
    { url: 'https://images.unsplash.com/photo-1495195129352-aeb325a55b65?w=1920', tags: ['warm', 'sunset'] },
  ],
};

function isValidConfig(obj: unknown): obj is PreviewConfig {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.workspace_name === 'string' &&
    Array.isArray(o.pages) &&
    Array.isArray(o.image_pool)
  );
}

async function registerConfig(config: PreviewConfig): Promise<string | null> {
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id ?? null;
  } catch {
    return null;
  }
}

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
          if (isValidConfig(data.config)) setConfig(data.config);
        })
        .catch(() => {
          setConfig(DEMO_CONFIG);
          setIsDemo(true);
          setConfigId(null);
        })
        .finally(() => setLoading(false));
      return;
    }

    // Path 2: ?config= — decode inline base64, then auto-register
    const configParam = params.get('config');
    if (configParam) {
      try {
        const decoded = JSON.parse(atob(configParam));
        if (isValidConfig(decoded)) {
          setConfig(decoded);
          setIsDemo(false);
          registerConfig(decoded).then((newId) => {
            if (newId) {
              setConfigId(newId);
              const url = new URL(window.location.href);
              url.searchParams.delete('config');
              url.searchParams.set('id', newId);
              url.hash = '';
              window.history.replaceState({}, '', url.toString());
            }
            setLoading(false);
          });
          return;
        }
      } catch {
        // fall through to demo
      }
    }

    setLoading(false);
  }, []);

  async function writeSelections(selections: Record<string, string>): Promise<boolean> {
    const confirmedAt = new Date().toISOString();
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
    return false;
  }

  return { config, configId, isDemo, loading, writeSelections };
}
