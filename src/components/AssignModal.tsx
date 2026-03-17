import { NotionMock } from './NotionMock';
import type { PageConfig } from '../types';

interface AssignModalProps {
  imageUrl: string;
  pages: PageConfig[];
  selections: Record<string, string>;
  onAssign: (pageId: string, url: string) => void;
  onClose: () => void;
}

export function AssignModal({ imageUrl, pages, selections, onAssign, onClose }: AssignModalProps) {
  // Find which page this image is currently assigned to
  const assignedPageId = Object.entries(selections).find(([, url]) => url === imageUrl)?.[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl bg-linear-panel rounded-xl ring-1 ring-linear-border-light shadow-2xl animate-modal-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-md flex items-center justify-center text-linear-text-muted hover:text-linear-text-primary hover:bg-linear-surface-hover transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Preview */}
        <div className="p-4 pb-0">
          <NotionMock
            imageUrl={imageUrl}
            pageIcon=""
            pageTitle="Preview"
            notionDark={true}
          />
        </div>

        {/* Assign section */}
        <div className="p-4">
          <p className="text-xs font-medium text-linear-text-muted uppercase tracking-wider mb-3">
            Assign to page
          </p>

          <div className="grid grid-cols-2 gap-2">
            {pages.map((page) => {
              const isAssignedToThis = assignedPageId === page.id;
              const currentUrl = selections[page.id];
              const hasOtherImage = currentUrl && currentUrl !== imageUrl;

              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => {
                    onAssign(page.id, imageUrl);
                    onClose();
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150
                    ${isAssignedToThis
                      ? 'bg-success-muted ring-1 ring-success/30 text-success'
                      : 'bg-linear-surface ring-1 ring-linear-border hover:ring-linear-border-light hover:bg-linear-surface-hover text-linear-text-primary'
                    }`}
                >
                  <span className="text-lg">{page.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{page.name}</div>
                    {isAssignedToThis && (
                      <div className="text-[11px] text-success/80">Currently assigned</div>
                    )}
                    {hasOtherImage && (
                      <div className="text-[11px] text-linear-text-muted">Will replace current</div>
                    )}
                    {!currentUrl && !isAssignedToThis && (
                      <div className="text-[11px] text-linear-text-muted">No cover yet</div>
                    )}
                  </div>
                  {isAssignedToThis && (
                    <span className="text-success text-sm">{'\u2713'}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
