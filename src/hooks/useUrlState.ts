import { useState, useEffect } from 'react';
import type { PreviewConfig } from '../types';

const DEMO_CONFIG: PreviewConfig = {
  workspace_name: 'Bright Studio (Demo)',
  pages: [
    { id: 'content_hub', name: 'Content Hub', icon: '\u{1F4CB}' },
    { id: 'brand_guidelines', name: 'Brand Guidelines', icon: '\u{1F3A8}' },
    { id: 'weekly_sprint', name: 'Weekly Sprint', icon: '\u{1F3C3}' },
    { id: 'meeting_notes', name: 'Meeting Notes', icon: '\u{1F4DD}' },
    { id: 'project_roadmap', name: 'Project Roadmap', icon: '\u{1F5FA}\uFE0F' },
  ],
  image_pool: [
    { url: 'https://picsum.photos/seed/desk/900/500', tags: ['workspace'] },
    { url: 'https://picsum.photos/seed/ocean/900/500', tags: ['nature'] },
    { url: 'https://picsum.photos/seed/mountain/900/500', tags: ['nature'] },
    { url: 'https://picsum.photos/seed/forest/900/500', tags: ['nature'] },
    { url: 'https://picsum.photos/seed/city/900/500', tags: ['urban'] },
    { url: 'https://picsum.photos/seed/sunset/900/500', tags: ['warm'] },
    { url: 'https://picsum.photos/seed/coffee/900/500', tags: ['warm'] },
    { url: 'https://picsum.photos/seed/books/900/500', tags: ['creative'] },
    { url: 'https://picsum.photos/seed/minimal/900/500', tags: ['minimal'] },
    { url: 'https://picsum.photos/seed/workspace/900/500', tags: ['workspace'] },
    { url: 'https://picsum.photos/seed/tower/600/900', tags: ['urban'] },
    { url: 'https://picsum.photos/seed/garden/600/900', tags: ['nature'] },
    { url: 'https://picsum.photos/seed/stairs/600/900', tags: ['urban'] },
    { url: 'https://picsum.photos/seed/doorway/600/900', tags: ['minimal'] },
    { url: 'https://picsum.photos/seed/alley/600/900', tags: ['urban'] },
    { url: 'https://picsum.photos/seed/window/600/900', tags: ['minimal'] },
    { url: 'https://picsum.photos/seed/bridge/600/900', tags: ['urban'] },
    { url: 'https://picsum.photos/seed/arch/600/900', tags: ['minimal'] },
    { url: 'https://picsum.photos/seed/lamp/600/900', tags: ['warm'] },
    { url: 'https://picsum.photos/seed/mural/600/900', tags: ['creative'] },
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

  async function writeSelections(
    selections: Record<string, string>,
    repositions?: Record<string, { x: number; y: number }>,
  ): Promise<boolean> {
    const confirmedAt = new Date().toISOString();
    if (configId) {
      try {
        const res = await fetch(`/api/config/${encodeURIComponent(configId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selections, repositions, confirmed_at: confirmedAt }),
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
