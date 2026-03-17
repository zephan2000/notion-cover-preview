import type { PageConfig } from '../types';

interface SuccessOverlayProps {
  pages: PageConfig[];
  selections: Record<string, string>;
  onDismiss: () => void;
}

export function SuccessOverlay({ pages, selections, onDismiss }: SuccessOverlayProps) {
  function truncateUrl(url: string, max = 50): string {
    return url.length > max ? url.slice(0, max) + '...' : url;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      <div className="relative w-full max-w-md bg-linear-panel rounded-xl ring-1 ring-linear-border-light shadow-2xl animate-modal-in p-6">
        <div className="text-center mb-5">
          <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-success-muted flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10.5L8 14.5L16 6.5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-linear-text-primary">
            Selections confirmed
          </h2>
          <p className="text-xs text-linear-text-secondary mt-1">
            Manus will pick up your choices automatically.
          </p>
        </div>

        <ul className="space-y-1.5 mb-5">
          {pages.map((page) => (
            <li key={page.id} className="flex items-center gap-2 text-xs px-3 py-2 rounded-md bg-linear-surface ring-1 ring-linear-border">
              <span className="shrink-0 text-sm">{page.icon}</span>
              <span className="font-medium text-linear-text-primary shrink-0">{page.name}</span>
              <span className="text-linear-text-muted truncate ml-auto text-[11px]">
                {truncateUrl(selections[page.id] || 'None')}
              </span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-light transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
