import type { PageConfig } from '../types';

interface SuccessOverlayProps {
  pages: PageConfig[];
  selections: Record<string, string>;
  onDismiss: () => void;
}

export function SuccessOverlay({ pages, selections, onDismiss }: SuccessOverlayProps) {
  function handleCopy() {
    navigator.clipboard.writeText(window.location.href);
  }

  function truncateUrl(url: string, max = 60): string {
    return url.length > max ? url.slice(0, max) + '...' : url;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6">
        <div className="text-center mb-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="text-accent text-2xl">{'\u2713'}</span>
          </div>
          <h2 className="text-lg font-bold text-stone-800 dark:text-neutral-100">
            Selections Confirmed
          </h2>
          <p className="text-sm text-stone-500 dark:text-neutral-400 mt-1">
            Manus can now read your selections from the URL.
          </p>
        </div>

        <ul className="space-y-2 mb-5">
          {pages.map((page) => (
            <li key={page.id} className="flex items-start gap-2 text-sm">
              <span className="shrink-0">{page.icon}</span>
              <span className="font-medium text-stone-700 dark:text-neutral-200 shrink-0">
                {page.name}:
              </span>
              <span className="text-stone-500 dark:text-neutral-400 truncate">
                {truncateUrl(selections[page.id] || 'Not selected')}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-2 text-sm font-medium rounded-md border border-stone-300 dark:border-neutral-600 text-stone-700 dark:text-neutral-300 hover:bg-stone-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Copy URL
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 py-2 text-sm font-medium rounded-md bg-accent text-white hover:bg-accent-dark transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
