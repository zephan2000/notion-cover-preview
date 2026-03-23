import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2 } from 'lucide-react';
import type { AppState, AppAction, CoverImage } from '@/lib/cover-picker-types';
import { generateChips } from '@/lib/search-chips';
import type { PreviewConfig } from '@/types';

type Props = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  config: PreviewConfig;
};

export const SearchDrawer = ({ state, dispatch, config }: Props) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const chips = generateChips(state, config.brand_context);
  const swapCount = state.searchMode === 'swap'
    ? state.images.length - state.lockedIds.length
    : 0;

  useEffect(() => {
    // Auto-focus input when drawer opens
    if (state.searchDrawerOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [state.searchDrawerOpen]);

  const handleSearch = async () => {
    const query = inputValue.trim();
    if (!query || state.searching) return;

    dispatch({ type: 'SET_SEARCHING', searching: true });

    try {
      const existingUrls = state.images.map(img => img.url);
      const history = state.searchHistory.map(h => ({
        query: h.query,
        returned_urls: [] as string[], // We don't track returned URLs in state for simplicity
      }));

      const res = await fetch('/api/search-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          history,
          brand_context: config.brand_context,
          existing_urls: existingUrls,
          count: 12,
        }),
      });

      if (!res.ok) {
        throw new Error('Search failed');
      }

      const data = await res.json();
      const newImages: CoverImage[] = (data.images ?? []).map(
        (img: { url: string; tags: string[]; width?: number; height?: number }) => ({
          id: img.url,
          url: img.url,
          width: img.width ?? 900,
          height: img.height ?? 500,
          seed: img.url,
          tags: img.tags ?? [],
        }),
      );

      dispatch({ type: 'SEARCH_RESULTS_RECEIVED', images: newImages, query });
      setInputValue('');
    } catch {
      dispatch({ type: 'SET_SEARCHING', searching: false });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') dispatch({ type: 'CLOSE_SEARCH' });
  };

  const handleChipClick = (chipText: string) => {
    setInputValue(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}, ${chipText}` : chipText;
    });
    inputRef.current?.focus();
  };

  return (
    <AnimatePresence>
      {state.searchDrawerOpen && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-lg z-50"
        >
          <div className="mx-4 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <span className="text-xs text-muted-foreground font-medium">
                {state.searchMode === 'swap'
                  ? `Replacing ${swapCount} image${swapCount !== 1 ? 's' : ''}`
                  : 'Adding to pool'}
              </span>
              <button
                onClick={() => dispatch({ type: 'CLOSE_SEARCH' })}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Search input */}
            <div className="px-4 py-2">
              <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    state.searchMode === 'swap'
                      ? 'What should the new images look like?'
                      : 'Search for more cover images...'
                  }
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
            </div>

            {/* Chips */}
            {chips.length > 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {chips.map(chip => (
                  <button
                    key={chip}
                    onClick={() => handleChipClick(chip)}
                    className="px-2.5 py-1 rounded-full text-xs bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Conversation history */}
            {state.searchHistory.length > 0 && (
              <div className="px-4 pb-2 max-h-32 overflow-y-auto no-scrollbar">
                <div className="space-y-1.5">
                  {state.searchHistory.map((entry, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                      <span className="text-foreground/70">You:</span>{' '}
                      &ldquo;{entry.query}&rdquo;{' '}
                      <span className="text-muted-foreground/60">
                        &rarr; {entry.resultCount} image{entry.resultCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action */}
            <div className="px-4 pb-3 pt-1">
              <button
                onClick={handleSearch}
                disabled={!inputValue.trim() || state.searching}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {state.searching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    Search · up to 12 new images
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
