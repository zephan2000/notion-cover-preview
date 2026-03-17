import { useReducer, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUrlState } from './hooks/useUrlState';
import { ImageGrid } from './components/ImageGrid';
import { SelectionDock } from './components/SelectionDock';
import { RefineModeBar } from './components/RefineModeBar';
import { ComparisonView } from './components/ComparisonView';
import { FinalizeView } from './components/FinalizeView';
import { RegenerateConfirmView } from './components/RegenerateConfirmView';
import { JsonOutput } from './components/JsonOutput';
import {
  imageCandidatesToCoverImages,
  selectedIdsToSelections,
} from './lib/cover-picker-types';
import type { AppState, AppAction } from './lib/cover-picker-types';

function createInitialState(): AppState {
  return {
    mode: 'browse',
    images: [],
    pages: [],
    workspaceName: '',
    selectedIds: [],
    repositionData: {},
    lockedIds: [],
    previewSlots: [null, null],
    previewPageIndex: 0,
    abCandidates: {},
    showPreview: false,
    disclaimerDismissed: false,
    regeneratePayload: null,
    saving: false,
    saved: false,
    isDemo: true,
  };
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SELECT_IMAGE': {
      const emptyIndex = state.selectedIds.indexOf(null);
      if (state.selectedIds.includes(action.imageId) || emptyIndex === -1) return state;
      const newIds = [...state.selectedIds];
      newIds[emptyIndex] = action.imageId;
      return { ...state, selectedIds: newIds };
    }

    case 'DESELECT_IMAGE': {
      const newIds = state.selectedIds.map(id => id === action.imageId ? null : id);
      return { ...state, selectedIds: newIds };
    }

    case 'ASSIGN_TO_PAGE': {
      const newIds = [...state.selectedIds];
      // Remove from any other slot first
      const existingIndex = newIds.indexOf(action.imageId);
      if (existingIndex !== -1) newIds[existingIndex] = null;
      newIds[action.pageIndex] = action.imageId;
      return { ...state, selectedIds: newIds };
    }

    case 'SET_MODE':
      return {
        ...state,
        mode: action.mode,
        lockedIds: action.mode === 'refine' ? [] : state.lockedIds,
      };

    case 'SET_REPOSITION':
      return {
        ...state,
        repositionData: {
          ...state.repositionData,
          [action.imageId]: action.position,
        },
      };

    case 'OPEN_PREVIEW': {
      // Find which page this image belongs to, or default to first unassigned or 0
      let pageIdx = state.selectedIds.indexOf(action.imageId);
      if (pageIdx === -1) {
        const firstEmpty = state.selectedIds.indexOf(null);
        pageIdx = firstEmpty !== -1 ? firstEmpty : 0;
      }

      // Load persisted A/B candidates for this page, or start fresh
      const existing = state.abCandidates[pageIdx];
      let previewSlots: [string | null, string | null];

      if (existing) {
        previewSlots = [...existing] as [string | null, string | null];
        // If clicked image isn't already in a slot, put it in slot A
        if (!previewSlots.includes(action.imageId)) {
          previewSlots[0] = action.imageId;
        }
      } else {
        previewSlots = [action.imageId, null];
      }

      return {
        ...state,
        showPreview: true,
        previewPageIndex: pageIdx,
        previewSlots,
      };
    }

    case 'SET_COMPARE': {
      const slots = [...state.previewSlots] as [string | null, string | null];
      slots[action.slot] = action.imageId;
      return { ...state, previewSlots: slots };
    }

    case 'SET_PREVIEW_PAGE': {
      // Save current candidates
      const savedCandidates = {
        ...state.abCandidates,
        [state.previewPageIndex]: [...state.previewSlots] as [string | null, string | null],
      };

      // Load new page's candidates, or use selected image + null
      const newSlots = savedCandidates[action.pageIndex]
        || [state.selectedIds[action.pageIndex] || null, null];

      return {
        ...state,
        previewPageIndex: action.pageIndex,
        previewSlots: newSlots as [string | null, string | null],
        abCandidates: savedCandidates,
      };
    }

    case 'CONFIRM_AB_SELECTION': {
      const imageId = state.previewSlots[action.slot];
      if (!imageId) return state;
      const newIds = [...state.selectedIds];
      // Remove this image from any other page slot
      const existingIdx = newIds.indexOf(imageId);
      if (existingIdx !== -1 && existingIdx !== state.previewPageIndex) {
        newIds[existingIdx] = null;
      }
      newIds[state.previewPageIndex] = imageId;
      return { ...state, selectedIds: newIds };
    }

    case 'CLOSE_PREVIEW': {
      // Persist current A/B candidates before closing
      return {
        ...state,
        showPreview: false,
        previewSlots: [null, null],
        abCandidates: {
          ...state.abCandidates,
          [state.previewPageIndex]: [...state.previewSlots] as [string | null, string | null],
        },
      };
    }

    case 'TOGGLE_LOCK': {
      const locked = state.lockedIds.includes(action.imageId)
        ? state.lockedIds.filter(id => id !== action.imageId)
        : [...state.lockedIds, action.imageId];
      return { ...state, lockedIds: locked };
    }

    case 'REGENERATE': {
      const keptImages = state.images.filter(img =>
        state.lockedIds.includes(img.id)
      );
      const regenerateCount = state.images.length - keptImages.length;

      const payload = {
        action: 'regenerate',
        keep: keptImages.map(img => ({
          url: img.url,
          reposition: state.repositionData[img.id] || { x: 0.5, y: 0.5 },
        })),
        regenerate_count: regenerateCount,
      };

      return {
        ...state,
        mode: 'regenerated',
        regeneratePayload: payload,
      };
    }

    case 'DISMISS_DISCLAIMER':
      return { ...state, disclaimerDismissed: true };

    case 'DISMISS_REGENERATE':
      return { ...state, regeneratePayload: null };

    case 'FINALIZE':
      return { ...state, mode: 'finalized' };

    case 'SET_SAVING':
      return { ...state, saving: action.saving };

    case 'SET_SAVED':
      return { ...state, saved: true, saving: false };

    case 'EDIT_SELECTIONS':
      return { ...state, mode: 'browse', saved: false };

    case 'RESET':
      return {
        ...state,
        mode: 'browse',
        selectedIds: new Array(state.pages.length).fill(null),
        repositionData: {},
        lockedIds: [],
        previewSlots: [null, null],
        previewPageIndex: 0,
        abCandidates: {},
        showPreview: false,
        disclaimerDismissed: false,
        regeneratePayload: null,
        saving: false,
        saved: false,
      };

    case 'INIT_CONFIG':
      return {
        ...state,
        images: action.images,
        pages: action.pages,
        workspaceName: action.workspaceName,
        isDemo: action.isDemo,
        selectedIds: new Array(action.pages.length).fill(null),
        repositionData: {},
        lockedIds: [],
        previewSlots: [null, null],
        previewPageIndex: 0,
        abCandidates: {},
        showPreview: false,
        disclaimerDismissed: false,
        regeneratePayload: null,
        saving: false,
        saved: false,
        mode: 'browse',
      };

    default:
      return state;
  }
}

export default function App() {
  const { config, isDemo, loading, writeSelections } = useUrlState();
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  // Initialize reducer state when config loads
  useEffect(() => {
    if (!loading && config) {
      dispatch({
        type: 'INIT_CONFIG',
        images: imageCandidatesToCoverImages(config.image_pool),
        pages: config.pages,
        workspaceName: config.workspace_name,
        isDemo,
      });
    }
  }, [loading, config, isDemo]);

  const handleConfirm = async () => {
    dispatch({ type: 'SET_SAVING', saving: true });
    const selections = selectedIdsToSelections(state.selectedIds, state.pages);

    // Build repositions: map pageId → {x, y} for pages that have repositioned images
    const repositions: Record<string, { x: number; y: number }> = {};
    for (let i = 0; i < state.pages.length; i++) {
      const imageId = state.selectedIds[i];
      if (imageId && state.repositionData[imageId]) {
        repositions[state.pages[i].id] = state.repositionData[imageId];
      }
    }

    if (isDemo) {
      await new Promise(resolve => setTimeout(resolve, 500));
      dispatch({ type: 'SET_SAVED' });
    } else {
      const ok = await writeSelections(selections, repositions);
      if (ok) {
        dispatch({ type: 'SET_SAVED' });
      } else {
        dispatch({ type: 'SET_SAVING', saving: false });
      }
    }
  };

  const handleRegenerate = async () => {
    if (!state.regeneratePayload) return;
    dispatch({ type: 'SET_SAVING', saving: true });

    if (isDemo) {
      await new Promise(resolve => setTimeout(resolve, 500));
      dispatch({ type: 'SET_SAVED' });
    } else {
      const ok = await writeSelections(
        state.regeneratePayload as Record<string, string>,
        undefined,
      );
      if (ok) {
        dispatch({ type: 'SET_SAVED' });
      } else {
        dispatch({ type: 'SET_SAVING', saving: false });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (state.mode === 'finalized') {
    return <FinalizeView state={state} dispatch={dispatch} onConfirm={handleConfirm} />;
  }

  if (state.mode === 'regenerated') {
    return <RegenerateConfirmView state={state} dispatch={dispatch} onConfirm={handleRegenerate} />;
  }

  return (
    <div className="min-h-screen bg-background no-scrollbar overflow-y-auto relative">
      {/* Hero text — fades after first selection */}
      <AnimatePresence>
        {state.selectedIds.every(id => id === null) && state.mode === 'browse' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pt-16 pb-8 text-center"
          >
            <h1 className="text-3xl font-light tracking-tight text-foreground/60">
              Covers for <span className="text-foreground font-normal">{state.workspaceName}</span>
            </h1>
            {isDemo && (
              <p className="text-xs text-muted-foreground mt-2">Demo mode — no data will be saved</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div
        className={`px-6 ${
          state.selectedIds.some(id => id !== null) || state.mode !== 'browse' ? 'pt-8' : ''
        } pb-32`}
      >
        <ImageGrid state={state} dispatch={dispatch} />
      </div>

      {/* Regenerate result toast */}
      <AnimatePresence>
        {state.regeneratePayload && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed top-6 right-6 w-96 z-50 cursor-pointer"
            onClick={() => dispatch({ type: 'DISMISS_REGENERATE' })}
          >
            <JsonOutput data={state.regeneratePayload} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <AnimatePresence mode="wait">
        {state.mode === 'refine' ? (
          <RefineModeBar key="refine" state={state} dispatch={dispatch} />
        ) : (
          <SelectionDock key="dock" state={state} dispatch={dispatch} />
        )}
      </AnimatePresence>

      {/* Preview / Comparison overlay */}
      <AnimatePresence>
        {state.showPreview && (
          <ComparisonView state={state} dispatch={dispatch} />
        )}
      </AnimatePresence>
    </div>
  );
}
