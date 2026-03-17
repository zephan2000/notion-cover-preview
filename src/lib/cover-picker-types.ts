import type { PageConfig, ImageCandidate } from '../types';

export type CoverImage = {
  id: string;
  url: string;
  tags: string[];
};

export type AppMode = 'browse' | 'finalized';

export type AppState = {
  mode: AppMode;
  images: CoverImage[];
  pages: PageConfig[];
  workspaceName: string;
  selectedIds: (string | null)[];
  repositionData: Record<string, { x: number; y: number }>;
  previewSlots: [string | null, string | null];
  previewPageIndex: number;
  abCandidates: Record<number, [string | null, string | null]>;
  showPreview: boolean;
  disclaimerDismissed: boolean;
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
  | { type: 'DISMISS_DISCLAIMER' }
  | { type: 'FINALIZE' }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_SAVED' }
  | { type: 'EDIT_SELECTIONS' }
  | { type: 'RESET' };

export function imageCandidatesToCoverImages(pool: ImageCandidate[]): CoverImage[] {
  return pool.map((img) => ({
    id: img.url,
    url: img.url,
    tags: img.tags,
  }));
}

export function selectedIdsToSelections(
  selectedIds: (string | null)[],
  pages: PageConfig[],
): Record<string, string> {
  const selections: Record<string, string> = {};
  for (let i = 0; i < pages.length; i++) {
    const imageId = selectedIds[i];
    if (imageId) {
      selections[pages[i].id] = imageId; // imageId is the URL
    }
  }
  return selections;
}
