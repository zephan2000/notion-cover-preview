import type { PageConfig } from '../types';

interface SidebarProps {
  pages: PageConfig[];
  currentIndex: number;
  selections: Record<string, string>;
  onPageClick: (index: number) => void;
}

export function Sidebar({ pages, currentIndex, selections, onPageClick }: SidebarProps) {
  return (
    <nav className="w-56 shrink-0 border-r border-stone-200 dark:border-neutral-800 bg-stone-50/50 dark:bg-neutral-900/50 py-4">
      <div className="px-4 pb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
          Pages
        </h2>
      </div>
      <ul className="space-y-0.5">
        {pages.map((page, index) => {
          const isActive = index === currentIndex;
          const isSelected = !!selections[page.id];
          return (
            <li key={page.id}>
              <button
                type="button"
                onClick={() => onPageClick(index)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors
                  ${isActive
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800'
                  }`}
              >
                <span className="text-lg">{page.icon}</span>
                <span className="flex-1 truncate">{page.name}</span>
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isSelected ? 'bg-accent' : 'bg-stone-300 dark:bg-neutral-600'
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
