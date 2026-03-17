import type { PageConfig } from '../types';
import { PageChip } from './PageChip';

interface TopBarProps {
  workspaceName: string;
  isDemo: boolean;
  pages: PageConfig[];
  selections: Record<string, string>;
  mode: 'browse' | 'review';
  notionDark: boolean;
  allSelected: boolean;
  saving: boolean;
  onToggleNotionDark: () => void;
  onToggleMode: () => void;
  onConfirm: () => void;
  onPageChipClick: (pageId: string) => void;
}

export function TopBar({
  workspaceName,
  isDemo,
  pages,
  selections,
  mode,
  notionDark,
  allSelected,
  saving,
  onToggleNotionDark,
  onToggleMode,
  onConfirm,
  onPageChipClick,
}: TopBarProps) {
  const selectedCount = pages.filter((p) => !!selections[p.id]).length;

  return (
    <header className="flex items-center gap-4 px-4 h-12 border-b border-linear-border bg-linear-panel shrink-0">
      {/* Left: branding */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 16 16">
            <rect x="2" y="2" width="5" height="5" rx="0.5" />
            <rect x="9" y="2" width="5" height="5" rx="0.5" opacity="0.7" />
            <rect x="2" y="9" width="5" height="5" rx="0.5" opacity="0.7" />
            <rect x="9" y="9" width="5" height="5" rx="0.5" opacity="0.4" />
          </svg>
        </div>
        <div className="flex items-baseline gap-2">
          <h1 className="text-sm font-semibold text-linear-text-primary tracking-tight">
            {workspaceName}
          </h1>
          {isDemo && (
            <span className="text-[10px] font-medium text-warning px-1.5 py-0.5 rounded bg-warning-muted">
              Demo
            </span>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-linear-border" />

      {/* Page chips */}
      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto min-w-0">
        {pages.map((page) => (
          <PageChip
            key={page.id}
            icon={page.icon}
            name={page.name}
            imageUrl={selections[page.id]}
            isActive={false}
            onClick={() => onPageChipClick(page.id)}
          />
        ))}
      </div>

      {/* Progress */}
      <span className="text-[11px] text-linear-text-muted shrink-0 tabular-nums">
        {selectedCount}/{pages.length}
      </span>

      {/* Separator */}
      <div className="w-px h-4 bg-linear-border" />

      {/* Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onToggleNotionDark}
          className="px-2 py-1 text-[11px] font-medium rounded-md text-linear-text-muted hover:text-linear-text-secondary hover:bg-linear-surface transition-colors"
        >
          Notion {notionDark ? 'Dark' : 'Light'}
        </button>

        <button
          type="button"
          onClick={onToggleMode}
          className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors
            ${mode === 'review'
              ? 'bg-accent-muted text-accent-light'
              : 'text-linear-text-muted hover:text-linear-text-secondary hover:bg-linear-surface'
            }`}
        >
          {mode === 'review' ? 'Browse' : 'Review'}
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={!allSelected || saving}
          className="px-3 py-1 text-[11px] font-medium rounded-md bg-accent text-white hover:bg-accent-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Confirm'}
        </button>
      </div>
    </header>
  );
}
