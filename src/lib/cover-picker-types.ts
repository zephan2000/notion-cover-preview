import type { PageConfig, ImageCandidate } from '../types';

export type CoverImage = {
  id: string;
  url: string;
  width: number;
  height: number;
  seed: string;
};

export type AppMode = 'browse' | 'refine' | 'finalized';

export type AppState = {
  mode: AppMode;
  images: CoverImage[];
  pages: PageConfig[];
  workspaceName: string;
  selectedIds: (string | null)[];
  repositionData: Record<string, { x: number; y: number }>;
  lockedIds: string[];
  previewSlots: [string | null, string | null];
  previewPageIndex: number;
  abCandidates: Record<number, [string | null, string | null]>;
  showPreview: boolean;
  disclaimerDismissed: boolean;
  regeneratePayload: Record<string, unknown> | null;
  saving: boolean;
  saved: boolean;
  isDemo: boolean;
};

export type AppAction =
  | { type: 'SELECT_IMAGE'; imageId: string }
  | { type: 'DESELECT_IMAGE'; imageId: string }
  | { type: 'ASSIGN_TO_PAGE'; imageId: string; pageIndex: number }
  | { type: 'SET_MODE'; mode: AppMode }
  | { type: 'SET_REPOSITION'; imageId: string; position: { x: number; y: number } }
  | { type: 'OPEN_PREVIEW'; imageId: string }
  | { type: 'SET_COMPARE'; imageId: string; slot: 0 | 1 }
  | { type: 'SET_PREVIEW_PAGE'; pageIndex: number }
  | { type: 'CONFIRM_AB_SELECTION'; slot: 0 | 1 }
  | { type: 'CLOSE_PREVIEW' }
  | { type: 'TOGGLE_LOCK'; imageId: string }
  | { type: 'REGENERATE' }
  | { type: 'DISMISS_DISCLAIMER' }
  | { type: 'DISMISS_REGENERATE' }
  | { type: 'FINALIZE' }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_SAVED' }
  | { type: 'EDIT_SELECTIONS' }
  | { type: 'RESET' };

/**
 * Convert ImageCandidate[] from the API config into CoverImage[].
 * Uses the URL as both id and seed. Infers width from ?w= param
 * if present, otherwise defaults to 900x500.
 */
export function imageCandidatesToCoverImages(pool: ImageCandidate[]): CoverImage[] {
  return pool.map((img) => {
    let width = 900;
    let height = 500;
    try {
      const url = new URL(img.url);
      const w = url.searchParams.get('w');
      if (w) width = parseInt(w, 10) || 900;
      const h = url.searchParams.get('h');
      if (h) height = parseInt(h, 10) || 500;
    } catch {
      // not a valid URL, keep defaults
    }
    return {
      id: img.url,
      url: img.url,
      width,
      height,
      seed: img.url,
    };
  });
}

export function selectedIdsToSelections(
  selectedIds: (string | null)[],
  pages: PageConfig[],
): Record<string, string> {
  const selections: Record<string, string> = {};
  for (let i = 0; i < pages.length; i++) {
    const imageId = selectedIds[i];
    if (imageId) {
      selections[pages[i].id] = imageId;
    }
  }
  return selections;
}
