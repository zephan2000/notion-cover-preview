import type { ImageCandidate, PageConfig } from '../types';
import { ImageCard } from './ImageCard';

interface ImageGridProps {
  images: ImageCandidate[];
  selections: Record<string, string>;
  pages: PageConfig[];
  activeTag: string | null;
  allTags: string[];
  onTagFilter: (tag: string | null) => void;
  onImageClick: (url: string) => void;
}

export function ImageGrid({
  images,
  selections,
  pages,
  activeTag,
  allTags,
  onTagFilter,
  onImageClick,
}: ImageGridProps) {
  const filtered = activeTag
    ? images.filter((img) => img.tags.includes(activeTag))
    : images;

  // Build reverse map: url -> page
  const urlToPage: Record<string, PageConfig> = {};
  for (const page of pages) {
    const url = selections[page.id];
    if (url) urlToPage[url] = page;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Tag filter bar */}
      <div className="sticky top-0 z-10 bg-linear-bg/80 backdrop-blur-md border-b border-linear-border px-6 py-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => onTagFilter(null)}
            className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors
              ${!activeTag
                ? 'bg-accent-muted text-accent-light'
                : 'text-linear-text-muted hover:text-linear-text-secondary hover:bg-linear-surface'
              }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagFilter(activeTag === tag ? null : tag)}
              className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize
                ${activeTag === tag
                  ? 'bg-accent-muted text-accent-light'
                  : 'text-linear-text-muted hover:text-linear-text-secondary hover:bg-linear-surface'
                }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-linear-text-muted text-sm">
            No images match this filter
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((img) => (
              <ImageCard
                key={img.url}
                url={img.url}
                tags={img.tags}
                assignedPage={urlToPage[img.url]}
                onClick={() => onImageClick(img.url)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
