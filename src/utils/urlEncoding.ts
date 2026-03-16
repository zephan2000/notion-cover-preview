import type { PreviewConfig, SelectionsOutput } from '../types';

const URL_LENGTH_LIMIT = 8000;

export function encodeConfig(config: PreviewConfig): string {
  return btoa(JSON.stringify(config));
}

export function decodeConfig(encoded: string): PreviewConfig | null {
  try {
    const json = atob(encoded);
    const parsed = JSON.parse(json) as PreviewConfig;
    if (!parsed.workspace_name || !Array.isArray(parsed.pages)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function encodeSelections(output: SelectionsOutput): string {
  return btoa(JSON.stringify(output));
}

export function decodeSelections(encoded: string): SelectionsOutput | null {
  try {
    const json = atob(encoded);
    return JSON.parse(json) as SelectionsOutput;
  } catch {
    return null;
  }
}

export function validateUrlLength(url: string): boolean {
  return url.length <= URL_LENGTH_LIMIT;
}
