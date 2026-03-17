import { NotionMock } from './NotionMock';
import type { PageConfig } from '../types';

interface ReviewPanelProps {
  pages: PageConfig[];
  selections: Record<string, string>;
  notionDark: boolean;
  onChangeCover: (pageId: string) => void;
}

export function ReviewPanel({ pages, selections, notionDark, onChangeCover }: ReviewPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-linear-text-primary tracking-tight">
            Review your selections
          </h2>
          <p className="text-sm text-linear-text-secondary mt-1">
            Click any page to change its cover image
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pages.map((page) => {
            const url = selections[page.id];
            return (
              <button
                key={page.id}
                type="button"
                onClick={() => onChangeCover(page.id)}
                className="group text-left rounded-lg ring-1 ring-linear-border hover:ring-linear-border-light transition-all duration-200 overflow-hidden bg-linear-surface hover:-translate-y-0.5"
              >
                {url ? (
                  <div className="relative">
                    <NotionMock
                      imageUrl={url}
                      pageIcon={page.icon}
                      pageTitle={page.name}
                      notionDark={notionDark}
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                      <span className="text-white text-xs font-medium px-3 py-1.5 rounded-md bg-white/15 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Change cover
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 text-linear-text-muted text-sm">
                    <span>{page.icon} {page.name} — no cover selected</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
