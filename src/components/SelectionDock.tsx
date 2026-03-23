import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, RefreshCw, Eye, Search } from 'lucide-react';
import type { AppState, AppAction } from '@/lib/cover-picker-types';

type Props = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
};

export const SelectionDock = ({ state, dispatch }: Props) => {
  const count = state.selectedIds.filter(Boolean).length;
  const total = state.pages.length;

  const assignedImages = state.selectedIds
    .map((id, i) => {
      if (!id) return null;
      const image = state.images.find(img => img.id === id);
      if (!image) return null;
      return { id, image, pageIndex: i };
    })
    .filter(Boolean) as { id: string; image: { url: string }; pageIndex: number }[];

  return (
    <div className="flex items-center gap-0 rounded-full bg-card/70 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden max-w-[720px]">
      {/* Search button */}
      <button
        onClick={() => dispatch({ type: 'OPEN_SEARCH', mode: 'add' })}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-3 hover:bg-accent/50 flex-shrink-0"
        title="Search for images"
      >
        <Search className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-8 bg-border/50 flex-shrink-0" />
      {/* Refine button */}
      <button
        onClick={() => dispatch({ type: 'SET_MODE', mode: 'refine' })}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-5 py-3 hover:bg-accent/50 flex-shrink-0"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Refine
      </button>

      {/* Divider */}
      <div className="w-px h-8 bg-border/50 flex-shrink-0" />

      {/* Counter */}
      <div
        className={`flex items-center gap-2 px-4 py-3 transition-colors flex-shrink-0 ${
          count > 0 ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        <span className="tabular-nums text-sm font-medium">{count}</span>
        <span className="text-sm text-muted-foreground">/ {total}</span>
      </div>

      {/* Filmstrip of assigned images */}
      <AnimatePresence>
        {assignedImages.length > 0 && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative flex items-center overflow-hidden max-w-[220px]"
          >
            <div className="flex items-center gap-1.5 px-1 py-1">
              {assignedImages.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="relative group/thumb flex-shrink-0"
                >
                  <button
                    onClick={() => dispatch({ type: 'OPEN_PREVIEW', imageId: item.id })}
                    className="w-8 h-8 rounded-md overflow-hidden border border-border/50 hover:border-foreground/30 transition-colors"
                  >
                    <img src={item.image.url} alt="" className="w-full h-full object-cover" />
                  </button>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-foreground text-background text-[10px] font-medium whitespace-nowrap opacity-0 group-hover/thumb:opacity-100 transition-opacity pointer-events-none z-50">
                    {state.pages[item.pageIndex]?.icon ?? ''} {state.pages[item.pageIndex]?.name ?? ''}
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Gradient fade for overflow */}
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-card/70 to-transparent pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare button */}
      {count > 0 && (
        <>
          <div className="w-px h-8 bg-border/50 flex-shrink-0" />
          <button
            onClick={() => {
              const firstAssigned = state.selectedIds.find(Boolean);
              if (firstAssigned) dispatch({ type: 'OPEN_PREVIEW', imageId: firstAssigned });
            }}
            className="flex items-center gap-1.5 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors flex-shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            Compare
          </button>
        </>
      )}

      {/* Finalize */}
      {count === total && (
        <>
          <div className="w-px h-8 bg-border/50 flex-shrink-0" />
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => dispatch({ type: 'FINALIZE' })}
            className="flex items-center gap-1.5 px-5 py-3 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors flex-shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Finalize
          </motion.button>
        </>
      )}
    </div>
  );
};
