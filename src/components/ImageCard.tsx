import type { PageConfig } from '../types';

interface ImageCardProps {
  url: string;
  tags: string[];
  assignedPage?: PageConfig;
  onClick: () => void;
}

export function ImageCard({ url, tags, assignedPage, onClick }: ImageCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full rounded-lg overflow-hidden bg-linear-surface ring-1 ring-linear-border hover:ring-linear-border-light transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-accent/40"
    >
      {/* Image */}
      <div className="relative" style={{ aspectRatio: '16 / 9' }}>
        <img
          src={url}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
          <span className="text-white text-xs font-medium px-3 py-1.5 rounded-md bg-white/15 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Click to preview
          </span>
        </div>

        {/* Assigned badge */}
        {assignedPage && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-success/90 text-white text-[11px] font-medium backdrop-blur-sm animate-badge-pop">
            <span>{assignedPage.icon}</span>
            <span>{assignedPage.name}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex gap-1 px-2.5 py-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-linear-text-muted px-1.5 py-0.5 rounded bg-linear-bg"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
