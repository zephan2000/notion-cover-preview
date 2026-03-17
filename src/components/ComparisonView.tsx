import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { NotionMockup } from "./NotionMockup";
import type { AppState, AppAction } from "@/lib/cover-picker-types";

type Props = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
};

export const ComparisonView = ({ state, dispatch }: Props) => {
  const { previewSlots, previewPageIndex, images, pages } = state;
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [showPagePicker, setShowPagePicker] = useState(false);

  const leftImage = previewSlots[0] ? images.find((img) => img.id === previewSlots[0]) : null;
  const rightImage = previewSlots[1] ? images.find((img) => img.id === previewSlots[1]) : null;

  const pageName = pages[previewPageIndex]?.name ?? 'Untitled';
  const pageIcon = pages[previewPageIndex]?.icon ?? '\u{1F4C4}';

  const handleClose = useCallback(() => {
    dispatch({ type: "CLOSE_PREVIEW" });
  }, [dispatch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  const handleThumbnailClick = (imageId: string) => {
    dispatch({ type: "SET_COMPARE", imageId, slot: activeSlot });
  };

  const handleConfirm = (slot: 0 | 1) => {
    dispatch({ type: "CONFIRM_AB_SELECTION", slot });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
    >
      {/* Close */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Page overlay selector */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100]">
        <div className="relative">
          <button
            onClick={() => setShowPagePicker(!showPagePicker)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg text-sm font-medium text-foreground hover:bg-card transition-colors"
          >
            <span>{pageIcon}</span>
            <span>{pageName}</span>
            <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showPagePicker && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden min-w-[200px] z-[9999]"
            >
              {pages.map((page, i) => {
                const hasImage = !!state.selectedIds[i];
                return (
                  <button
                    key={page.id}
                    onClick={() => {
                      dispatch({ type: "SET_PREVIEW_PAGE", pageIndex: i });
                      setShowPagePicker(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                      i === previewPageIndex
                        ? "bg-accent text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <span>{page.icon}</span>
                    <span>{page.name}</span>
                    {hasImage && i !== previewPageIndex && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* Hints */}
      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-14 mt-2">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Esc</kbd> Close
        </span>
      </div>

      {/* Mockups */}
      <div className="flex-1 flex items-center justify-center gap-6 px-8 pt-4 pb-4 overflow-y-auto no-scrollbar">
        {/* Slot A */}
        <div className="flex-1 max-w-2xl flex flex-col items-center gap-3">
          <div
            className={`w-full cursor-pointer rounded-xl transition-all ${
              activeSlot === 0
                ? "ring-2 ring-foreground/30 ring-offset-2 ring-offset-background"
                : "opacity-70 hover:opacity-90"
            }`}
            onClick={() => setActiveSlot(0)}
          >
            {leftImage ? (
              <NotionMockup
                image={leftImage}
                state={state}
                dispatch={dispatch}
                pageTitle={pageName}
                pageIcon={pageIcon}
              />
            ) : (
              <div
                className={`h-[300px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-sm gap-2 ${
                  activeSlot === 0
                    ? "border-foreground/30 text-muted-foreground"
                    : "border-muted-foreground/15 text-muted-foreground/30"
                }`}
              >
                Select an image below
                <span className="text-xs text-muted-foreground/50 font-medium uppercase tracking-wide">A</span>
              </div>
            )}
          </div>
        </div>

        {/* Slot B */}
        <div className="flex-1 max-w-2xl flex flex-col items-center gap-3">
          <div
            className={`w-full cursor-pointer rounded-xl transition-all ${
              activeSlot === 1
                ? "ring-2 ring-foreground/30 ring-offset-2 ring-offset-background"
                : "opacity-70 hover:opacity-90"
            }`}
            onClick={() => setActiveSlot(1)}
          >
            {rightImage ? (
              <NotionMockup
                image={rightImage}
                state={state}
                dispatch={dispatch}
                pageTitle={pageName}
                pageIcon={pageIcon}
              />
            ) : (
              <div
                className={`h-[300px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-sm gap-2 ${
                  activeSlot === 1
                    ? "border-foreground/30 text-muted-foreground"
                    : "border-muted-foreground/15 text-muted-foreground/30"
                }`}
              >
                Select an image below to compare
                <span className="text-xs text-muted-foreground/50 font-medium uppercase tracking-wide">B</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Single select button below mockups */}
      {(leftImage || rightImage) && (
        <div className="flex justify-center pb-2">
          <button
            onClick={() => handleConfirm(activeSlot)}
            disabled={!previewSlots[activeSlot]}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all disabled:opacity-30 ${
              state.selectedIds[previewPageIndex] === previewSlots[activeSlot]
                ? "bg-foreground/10 text-foreground"
                : "bg-foreground text-background hover:bg-foreground/90"
            }`}
          >
            {state.selectedIds[previewPageIndex] === previewSlots[activeSlot] ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Selected {activeSlot === 0 ? "A" : "B"} for {pageIcon} {pageName}
              </>
            ) : (
              <>
                Select {activeSlot === 0 ? "A" : "B"} for {pageIcon} {pageName}
              </>
            )}
          </button>
        </div>
      )}

      {/* Thumbnail strip */}
      <div className="p-4 border-t border-border/50 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 justify-center">
          {images.map((img) => {
            const isInSlot = previewSlots.includes(img.id);
            return (
              <button
                key={img.id}
                onClick={() => handleThumbnailClick(img.id)}
                className={`flex-shrink-0 w-16 h-10 rounded-md overflow-hidden transition-all ${
                  isInSlot ? "ring-2 ring-foreground opacity-100" : "opacity-40 hover:opacity-70"
                }`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
