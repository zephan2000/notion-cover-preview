import { NotionMock } from './NotionMock';

interface OptionCardProps {
  label: string;
  imageUrl: string;
  pageIcon: string;
  pageTitle: string;
  notionDark: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

export function OptionCard({
  label,
  imageUrl,
  pageIcon,
  pageTitle,
  notionDark,
  isSelected,
  onSelect,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-lg border-2 transition-all duration-200 cursor-pointer
        ${isSelected
          ? 'border-accent shadow-md'
          : 'border-stone-200 dark:border-neutral-700 hover:border-stone-400 dark:hover:border-neutral-500 hover:-translate-y-0.5 hover:shadow-md'
        }`}
    >
      {/* Label bar */}
      <div className={`flex items-center justify-between px-3 py-1.5 text-sm font-medium rounded-t-md
        ${isSelected
          ? 'bg-accent text-white'
          : 'bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-neutral-400'
        }`}>
        <span>{label}</span>
        {isSelected && <span>{'\u2713'} Selected</span>}
      </div>

      {/* Mock */}
      <div className="p-3">
        <NotionMock
          imageUrl={imageUrl}
          pageIcon={pageIcon}
          pageTitle={pageTitle}
          notionDark={notionDark}
        />
      </div>
    </button>
  );
}
