import { useMemo } from 'react';
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
  const config = useMemo<PreviewConfig>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const configParam = params.get('config');
      if (!configParam) return DEMO_CONFIG;
      const decoded = decodeConfig(configParam);
      return decoded ?? DEMO_CONFIG;
    } catch {
      return DEMO_CONFIG;
    }
  }, []);

  const isDemo = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return !params.get('config');
  }, []);

  function writeSelections(selections: Record<string, string>): void {
    const output: SelectionsOutput = {
      selections,
      confirmed_at: new Date().toISOString(),
    };
    const encoded = encodeSelections(output);
    window.location.hash = `selections=${encoded}`;
  }

  return { config, isDemo, writeSelections };
}
