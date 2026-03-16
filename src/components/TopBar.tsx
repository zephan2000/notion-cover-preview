import type { PageConfig } from '../types';

interface TopBarProps {
  workspaceName: string;
  isDemo: boolean;
  pages: PageConfig[];
  selections: Record<string, string>;
  notionDark: boolean;
  appDark: boolean;
  allSelected: boolean;
  saving: boolean;
  onToggleNotionDark: () => void;
  onToggleAppDark: () => void;
  onConfirm: () => void;
}

export function TopBar({
  workspaceName,
  isDemo,
  pages,
  selections,
  notionDark,
  appDark,
  allSelected,
  saving,
  onToggleNotionDark,
  onToggleAppDark,
  onConfirm,
}: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      {/* Left: branding */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded bg-accent flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 16 16">
            <rect x="2" y="2" width="5" height="5" rx="0.5" />
            <rect x="9" y="2" width="5" height="5" rx="0.5" opacity="0.7" />
            <rect x="2" y="9" width="5" height="5" rx="0.5" opacity="0.7" />
            <rect x="9" y="9" width="5" height="5" rx="0.5" opacity="0.4" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-stone-800 dark:text-neutral-100 leading-tight">
            {workspaceName}
          </h1>
          <p className="text-xs text-stone-400 dark:text-neutral-500">
            {isDemo ? 'Demo Mode' : 'Cover Image Selection'}
          </p>
        </div>
      </div>

      {/* Centre: progress dots */}
      <div className="flex items-center gap-1.5">
        {pages.map((page) => (
          <div
            key={page.id}
            title={page.name}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              selections[page.id] ? 'bg-accent' : 'bg-stone-300 dark:bg-neutral-600'
            }`}
          />
        ))}
      </div>

      {/* Right: toggles + confirm */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleNotionDark}
          className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
            notionDark
              ? 'bg-neutral-800 text-neutral-200 border-neutral-600'
              : 'bg-white text-stone-600 border-stone-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-600'
          }`}
        >
          Notion {notionDark ? 'Dark' : 'Light'}
        </button>

        <button
          type="button"
          onClick={onToggleAppDark}
          className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
            appDark
              ? 'bg-neutral-800 text-neutral-200 border-neutral-600'
              : 'bg-white text-stone-600 border-stone-300'
          }`}
        >
          {appDark ? '\u{1F319}' : '\u{2600}\u{FE0F}'}
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={!allSelected || saving}
          className="px-4 py-1.5 text-sm font-medium rounded-md bg-accent text-white hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Confirm Selections'}
        </button>
      </div>
    </header>
  );
}
