import { motion } from 'framer-motion';
import { Eye, Lock } from 'lucide-react';
import type { CoverImage, AppState, AppAction } from '@/lib/cover-picker-types';

type Props = {
  image: CoverImage;
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  index: number;
};

export const CoverCard = ({ image, state, dispatch, index }: Props) => {
  const isSelected = state.selectedIds.includes(image.id);
  const selectionIndex = state.selectedIds.findIndex(id => id === image.id);
  const isRepositioned = !!state.repositionData[image.id];
  const isRefineMode = state.mode === 'refine';
  const isLocked = state.lockedIds.includes(image.id);
  const isNew = state.newImageIds.includes(image.id);

  const handleClick = () => {
    if (isNew) dispatch({ type: 'CLEAR_NEW_BADGE', imageId: image.id });
    if (isRefineMode) {
      dispatch({ type: 'TOGGLE_LOCK', imageId: image.id });
    } else if (isSelected) {
      dispatch({ type: 'DESELECT_IMAGE', imageId: image.id });
    } else {
      dispatch({ type: 'SELECT_IMAGE', imageId: image.id });
    }
  };

  const handleMouseEnter = () => {
    if (isNew) dispatch({ type: 'CLEAR_NEW_BADGE', imageId: image.id });
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'OPEN_PREVIEW', imageId: image.id });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      className={`group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border border-transparent hover:border-border ${
        isRefineMode && !isLocked ? 'opacity-40' : ''
      } ${isLocked ? 'ring-2 ring-green-400 opacity-100' : ''} ${
        isSelected && !isRefineMode ? 'ring-2 ring-foreground' : ''
      } ${isNew ? 'ring-1 ring-blue-400/50 shadow-[0_0_12px_rgba(96,165,250,0.25)]' : ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      <img
        src={image.url}
        alt={`Cover option: ${image.seed}`}
        className="w-full h-auto block"
        loading="lazy"
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
        {!isRefineMode && (
          <button
            onClick={handlePreview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/20 backdrop-blur-sm text-white text-sm hover:bg-white/30 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); handleClick(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/20 backdrop-blur-sm text-white text-sm hover:bg-white/30 transition-colors"
        >
          {isRefineMode
            ? (isLocked ? '✓ Kept' : 'Keep')
            : (isSelected ? '✓ Selected' : 'Select')
          }
        </button>
      </div>

      {/* Selection page icon badge */}
      {isSelected && !isRefineMode && selectionIndex !== -1 && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-sm shadow-lg">
          {state.pages[selectionIndex]?.icon ?? ''}
        </div>
      )}

      {/* Lock badge */}
      {isLocked && isRefineMode && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-400 text-background flex items-center justify-center shadow-lg">
          <Lock className="w-3 h-3" />
        </div>
      )}

      {/* Repositioned badge */}
      {isRepositioned && !isRefineMode && (
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-card/80 backdrop-blur-sm text-foreground/70 text-[10px] font-medium">
          Repositioned
        </div>
      )}
    </motion.div>
  );
};
