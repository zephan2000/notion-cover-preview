import { motion } from 'framer-motion';
import { RotateCw, X } from 'lucide-react';
import type { AppState, AppAction } from '@/lib/cover-picker-types';

type Props = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
};

export const RefineModeBar = ({ state, dispatch }: Props) => {
  const lockedCount = state.lockedIds.length;
  const totalCount = state.images.length;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 left-0 right-0 mx-auto w-fit flex items-center gap-4 px-5 py-3 rounded-2xl bg-card/80 backdrop-blur-xl border border-green-400/20 shadow-2xl z-40"
    >
      <span className="text-sm text-muted-foreground">
        <span className="text-green-400 font-medium tabular-nums">{lockedCount}</span>
        {' '}kept · {totalCount - lockedCount} to replace
      </span>

      <div className="w-px h-8 bg-border" />

      <button
        onClick={() => dispatch({ type: 'REGENERATE' })}
        disabled={lockedCount === 0}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-400 text-background text-sm font-medium hover:bg-green-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <RotateCw className="w-3.5 h-3.5" />
        Regenerate Others
      </button>

      <button
        onClick={() => dispatch({ type: 'SET_MODE', mode: 'browse' })}
        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </motion.div>
  );
};
