import { useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { CoverImage, AppState, AppAction } from '@/lib/cover-picker-types';

type Props = {
  image: CoverImage;
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  onAssigned?: () => void;
  pageTitle?: string;
  pageIcon?: string;
};

export const NotionMockup = ({
  image,
  state,
  dispatch,
  onAssigned,
  pageTitle = "Untitled",
  pageIcon = "\u{1F4C4}",
}: Props) => {
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showPagePicker, setShowPagePicker] = useState(false);
  const [tempPosition, setTempPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  const savedPosition = state.repositionData[image.id] || { x: 0.5, y: 0.5 };
  const currentPosition = tempPosition || savedPosition;

  const handleStartReposition = () => {
    if (!state.disclaimerDismissed) {
      setShowDisclaimer(true);
      dispatch({ type: 'DISMISS_DISCLAIMER' });
    }
    setTempPosition({ ...savedPosition });
    setIsRepositioning(true);
  };

  const handleSavePosition = () => {
    if (tempPosition) {
      dispatch({ type: 'SET_REPOSITION', imageId: image.id, position: tempPosition });
    }
    setIsRepositioning(false);
    setTempPosition(null);
  };

  const handleCancelReposition = () => {
    setIsRepositioning(false);
    setTempPosition(null);
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isRepositioning) return;
      e.preventDefault();
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: currentPosition.x,
        startPosY: currentPosition.y,
      };
    },
    [isRepositioning, currentPosition]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current || !bannerRef.current) return;
      const rect = bannerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      setTempPosition({
        x: Math.max(0, Math.min(1, dragRef.current.startPosX - deltaX / rect.width)),
        y: Math.max(0, Math.min(1, dragRef.current.startPosY - deltaY / rect.height)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleAssignToPage = (pageIndex: number) => {
    dispatch({ type: 'ASSIGN_TO_PAGE', imageId: image.id, pageIndex });
    setShowPagePicker(false);
    onAssigned?.();
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-card rounded-lg overflow-hidden shadow-2xl border border-border/50">
      {/* Cover banner */}
      <div
        ref={bannerRef}
        className={`relative overflow-hidden group select-none ${
          isRepositioning
            ? isDragging
              ? 'cursor-grabbing'
              : 'cursor-grab'
            : ''
        }`}
        style={{ aspectRatio: '16 / 3.2' }}
        onMouseDown={handleMouseDown}
      >
        <img
          src={image.url}
          alt=""
          className="w-full h-full object-cover pointer-events-none"
          style={{
            objectPosition: `${currentPosition.x * 100}% ${currentPosition.y * 100}%`,
          }}
          draggable={false}
        />

        {/* Hover buttons (normal mode) */}
        {!isRepositioning && (
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => e.stopPropagation()}
              className="px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-sm text-white text-xs hover:bg-black/70 transition-colors"
            >
              Change
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartReposition();
              }}
              className="px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-sm text-white text-xs hover:bg-black/70 transition-colors"
            >
              Reposition
            </button>
          </div>
        )}

        {/* Reposition mode overlay */}
        {isRepositioning && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="px-4 py-2 rounded-lg bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
                Drag image to reposition
              </span>
            </div>
            <div className="absolute top-3 right-3 flex gap-2 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSavePosition();
                }}
                className="px-2.5 py-1 rounded-md bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors"
              >
                Save position
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelReposition();
                }}
                className="px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-sm text-white text-xs hover:bg-black/70 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>

      {/* Disclaimer */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onClick={() => setShowDisclaimer(false)}
          >
            <div className="px-6 py-3 bg-accent text-muted-foreground text-xs leading-relaxed cursor-pointer">
              This is a visual reference only. Notion doesn't support programmatic
              repositioning — you'll need to apply this manually. We'll save your
              settings so Manus can guide you.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page content */}
      <div className="px-16 py-8">
        <div className="text-4xl mb-2 -mt-10 relative z-10 w-12 h-12 flex items-center justify-center rounded-lg bg-card">
          {pageIcon}
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-1 mt-3">{pageTitle}</h2>
        <div className="text-sm text-muted-foreground mb-6">Last edited just now</div>

        {/* Skeleton content blocks */}
        <div className="space-y-3">
          <div className="h-4 bg-muted/30 rounded w-full" />
          <div className="h-4 bg-muted/30 rounded w-4/5" />
          <div className="h-4 bg-muted/30 rounded w-3/5" />
          <div className="h-6" />
          <div className="flex gap-2 items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-1.5 flex-shrink-0" />
            <div className="h-4 bg-muted/30 rounded w-3/4" />
          </div>
          <div className="flex gap-2 items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-1.5 flex-shrink-0" />
            <div className="h-4 bg-muted/30 rounded w-2/3" />
          </div>
          <div className="flex gap-2 items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-1.5 flex-shrink-0" />
            <div className="h-4 bg-muted/30 rounded w-1/2" />
          </div>
        </div>
      </div>

      {/* Page picker overlay */}
      {onAssigned && (
        <div className="px-16 pb-6 relative">
          <button
            onClick={() => setShowPagePicker(!showPagePicker)}
            className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
          >
            Assign to page
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPagePicker ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showPagePicker && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-16 right-16 mb-2 rounded-xl bg-card border border-border/50 shadow-2xl overflow-hidden z-20"
              >
                {state.pages.map((page, i) => {
                  const assignedImageId = state.selectedIds[i];
                  const assignedImage = assignedImageId
                    ? state.images.find(img => img.id === assignedImageId)
                    : null;
                  const isCurrentImage = assignedImageId === image.id;

                  return (
                    <button
                      key={page.id}
                      onClick={() => handleAssignToPage(i)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left ${
                        isCurrentImage ? 'bg-accent/30' : ''
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">{page.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{page.name}</div>
                        {assignedImage ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                            <span className="text-xs text-muted-foreground truncate">Cover assigned</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">No cover yet</span>
                        )}
                      </div>
                      {assignedImage && (
                        <div className="w-10 h-6 rounded overflow-hidden flex-shrink-0 border border-border/30">
                          <img src={assignedImage.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
