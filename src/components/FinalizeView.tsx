import { motion } from 'framer-motion';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';
import { NotionMockup } from './NotionMockup';
import type { AppState, AppAction } from '@/lib/cover-picker-types';

type Props = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  onConfirm: () => void;
};

export const FinalizeView = ({ state, dispatch, onConfirm }: Props) => {
  const { selectedIds, images, pages, saving, saved, isDemo } = state;

  const assignedCards = selectedIds
    .map((id, i) => {
      if (!id) return null;
      const image = images.find(img => img.id === id);
      if (!image) return null;
      return { image, pageIndex: i };
    })
    .filter(Boolean) as { image: typeof images[0]; pageIndex: number }[];

  const useGrid = assignedCards.length <= 6;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-8 overflow-y-auto no-scrollbar">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 pt-8"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-foreground/10 mb-4">
          <Check className="w-6 h-6 text-foreground" />
        </div>
        <h1 className="text-3xl font-light text-foreground mb-3">
          {saved ? 'Workspace ready.' : 'Review your selections'}
        </h1>
        {saved ? (
          <>
            <p className="text-sm text-muted-foreground">Your selections have been saved.</p>
            {!isDemo && (
              <p className="text-sm text-muted-foreground mt-1">
                Head back to Manus and say{' '}
                <span className="inline-block px-2 py-0.5 rounded-md bg-foreground/10 text-foreground font-medium text-sm">
                  Done
                </span>
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {assignedCards.length} page{assignedCards.length !== 1 ? 's' : ''} with covers assigned
          </p>
        )}
      </motion.div>

      {/* Mockup cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`w-full mb-10 ${
          useGrid
            ? 'max-w-5xl flex flex-wrap justify-center gap-5'
            : 'max-w-full overflow-x-auto no-scrollbar'
        }`}
      >
        {useGrid ? (
          assignedCards.map(({ image, pageIndex }) => {
            const colWidth = assignedCards.length <= 4
              ? 'w-[calc(50%-10px)]'
              : 'w-[calc(33.333%-14px)]';
            return (
              <div key={image.id} className={colWidth}>
                <NotionMockup
                  image={image}
                  state={state}
                  dispatch={dispatch}
                  pageTitle={pages[pageIndex].name}
                  pageIcon={pages[pageIndex].icon}
                />
              </div>
            );
          })
        ) : (
          <div className="flex gap-5 px-4 pb-2">
            {assignedCards.map(({ image, pageIndex }) => (
              <div key={image.id} className="flex-shrink-0 w-[400px]">
                <NotionMockup
                  image={image}
                  state={state}
                  dispatch={dispatch}
                  pageTitle={pages[pageIndex].name}
                  pageIcon={pages[pageIndex].icon}
                />
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 flex flex-col items-center gap-3"
      >
        {!saved && (
          <button
            onClick={onConfirm}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {isDemo ? 'Confirm (Demo)' : 'Confirm & Send to Manus'}
              </>
            )}
          </button>
        )}

        <button
          onClick={() => dispatch({ type: 'EDIT_SELECTIONS' })}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Edit selections
        </button>
      </motion.div>
    </div>
  );
};
