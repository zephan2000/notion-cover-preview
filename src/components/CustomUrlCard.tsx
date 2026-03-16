import { useState } from 'react';
import { NotionMock } from './NotionMock';
import { isDirectImageUrl } from '../utils/imageUtils';

interface CustomUrlCardProps {
  pageIcon: string;
  pageTitle: string;
  notionDark: boolean;
  isSelected: boolean;
  selectedUrl: string;
  onSelect: (url: string) => void;
}

export function CustomUrlCard({
  pageIcon,
  pageTitle,
  notionDark,
  isSelected,
  selectedUrl,
  onSelect,
}: CustomUrlCardProps) {
  const [url, setUrl] = useState(selectedUrl || '');
  const [previewUrl, setPreviewUrl] = useState(selectedUrl || '');
  const [showPreview, setShowPreview] = useState(!!selectedUrl);

  function handlePreview() {
    if (!url.trim()) return;
    setPreviewUrl(url.trim());
    setShowPreview(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handlePreview();
  }

  const isValid = isDirectImageUrl(url.trim());

  return (
    <div
      className={`w-full rounded-lg border-2 border-dashed transition-all duration-200
        ${isSelected
          ? 'border-accent'
          : 'border-stone-300 dark:border-neutral-600'
        }`}
    >
      {/* Label bar */}
      <div className={`flex items-center justify-between px-3 py-1.5 text-sm font-medium
        ${isSelected
          ? 'bg-accent text-white'
          : 'bg-stone-50 dark:bg-neutral-800/50 text-stone-600 dark:text-neutral-400'
        }`}>
        <span>Option C — Custom URL</span>
        {isSelected && <span>{'\u2713'} Selected</span>}
      </div>

      <div className="p-3 space-y-3">
        {/* URL input */}
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste image URL..."
            className="flex-1 px-3 py-2 text-sm rounded-md border border-stone-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-stone-900 dark:text-neutral-100 placeholder:text-stone-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <button
            type="button"
            onClick={handlePreview}
            disabled={!url.trim()}
            className="px-4 py-2 text-sm font-medium rounded-md bg-stone-200 dark:bg-neutral-700 text-stone-700 dark:text-neutral-200 hover:bg-stone-300 dark:hover:bg-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Preview {'\u2192'}
          </button>
        </div>

        {!isValid && url.trim() && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            URL may not be a direct image link. Preview anyway to check.
          </p>
        )}

        {/* Preview */}
        {showPreview && previewUrl && (
          <div className="space-y-2">
            <NotionMock
              imageUrl={previewUrl}
              pageIcon={pageIcon}
              pageTitle={pageTitle}
              notionDark={notionDark}
            />
            {!isSelected && (
              <button
                type="button"
                onClick={() => onSelect(previewUrl)}
                className="w-full py-2 text-sm font-medium rounded-md bg-accent text-white hover:bg-accent-dark transition-colors"
              >
                Select this image
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
