import { useReducer, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUrlState } from './hooks/useUrlState';
import { ImageGrid } from './components/ImageGrid';
import { SelectionDock } from './components/SelectionDock';
import { ComparisonView } from './components/ComparisonView';
import { FinalizeView } from './components/FinalizeView';
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
    previewSlots: [null, null],
    previewPageIndex: 0,
    abCandidates: {},
    showPreview: false,
    disclaimerDismissed: false,
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
      const existingIndex = newIds.indexOf(action.imageId);
      if (existingIndex !== -1) newIds[existingIndex] = null;
      newIds[action.pageIndex] = action.imageId;
      return { ...state, selectedIds: newIds };
    }

    case 'SET_MODE':
      return { ...state, mode: action.mode };

    case 'SET_REPOSITION':
      return {
        ...state,
        repositionData: {
          ...state.repositionData,
          [action.imageId]: action.position,
        },
      };

    case 'OPEN_PREVIEW': {
      let pageIdx = state.selectedIds.indexOf(action.imageId);
      if (pageIdx === -1) {
        const firstEmpty = state.selectedIds.indexOf(null);
        pageIdx = firstEmpty !== -1 ? firstEmpty : 0;
      }

      const existing = state.abCandidates[pageIdx];
      let previewSlots: [string | null, string | null];

      if (existing) {
        previewSlots = [...existing] as [string | null, string | null];
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
      const savedCandidates = {
        ...state.abCandidates,
        [state.previewPageIndex]: [...state.previewSlots] as [string | null, string | null],
      };

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
      const existingIdx = newIds.indexOf(imageId);
      if (existingIdx !== -1 && existingIdx !== state.previewPageIndex) {
        newIds[existingIdx] = null;
      }
      newIds[state.previewPageIndex] = imageId;
      return { ...state, selectedIds: newIds };
    }

    case 'CLOSE_PREVIEW': {
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

    case 'DISMISS_DISCLAIMER':
      return { ...state, disclaimerDismissed: true };

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
        previewSlots: [null, null],
        previewPageIndex: 0,
        abCandidates: {},
        showPreview: false,
        disclaimerDismissed: false,
        saving: false,
        saved: false,
      };

    default:
      return state;
  }
}

export default function App() {
  const { config, isDemo, loading, writeSelections } = useUrlState();
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  // Initialize state when config loads
  useEffect(() => {
    if (!loading && config) {
      dispatch({ type: 'RESET' }); // Reset to clean state first
    }
  }, [loading, config]);

  // We can't dispatch custom actions, so we derive the actual state
  // by overlaying config onto the reducer state
  const appState: AppState = {
    ...state,
    images: imageCandidatesToCoverImages(config.image_pool),
    pages: config.pages,
    workspaceName: config.workspace_name,
    selectedIds: state.selectedIds.length === config.pages.length
      ? state.selectedIds
      : new Array(config.pages.length).fill(null),
    isDemo,
  };

  const handleConfirm = async () => {
    dispatch({ type: 'SET_SAVING', saving: true });
    const selections = selectedIdsToSelections(appState.selectedIds, appState.pages);

    if (isDemo) {
      // In demo mode, just simulate success
      await new Promise(resolve => setTimeout(resolve, 500));
      dispatch({ type: 'SET_SAVED' });
    } else {
      const ok = await writeSelections(selections);
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

  if (appState.mode === 'finalized') {
    return <FinalizeView state={appState} dispatch={dispatch} onConfirm={handleConfirm} />;
  }

  return (
    <div className="min-h-screen bg-background no-scrollbar overflow-y-auto relative">
      {/* Hero text — fades after first selection */}
      <AnimatePresence>
        {appState.selectedIds.every(id => id === null) && appState.mode === 'browse' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pt-16 pb-8 text-center"
          >
            <h1 className="text-3xl font-light tracking-tight text-foreground/60">
              Covers for <span className="text-foreground font-normal">{appState.workspaceName}</span>
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
          appState.selectedIds.some(id => id !== null) ? 'pt-8' : ''
        } pb-32`}
      >
        <ImageGrid state={appState} dispatch={dispatch} />
      </div>

      {/* Bottom bar */}
      <AnimatePresence mode="wait">
        <SelectionDock key="dock" state={appState} dispatch={dispatch} />
      </AnimatePresence>

      {/* Preview / Comparison overlay */}
      <AnimatePresence>
        {appState.showPreview && (
          <ComparisonView state={appState} dispatch={dispatch} />
        )}
      </AnimatePresence>
    </div>
  );
}
