interface PageChipProps {
  icon: string;
  name: string;
  imageUrl?: string;
  isActive: boolean;
  onClick: () => void;
}

export function PageChip({ icon, name, imageUrl, isActive, onClick }: PageChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150
        ${isActive
          ? 'bg-accent-muted text-accent-light ring-1 ring-accent/30'
          : imageUrl
            ? 'bg-success-muted text-success ring-1 ring-success/20'
            : 'bg-linear-surface text-linear-text-muted hover:text-linear-text-secondary hover:bg-linear-surface-hover ring-1 ring-linear-border'
        }`}
    >
      {imageUrl ? (
        <div className="w-4 h-4 rounded-sm overflow-hidden shrink-0">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <span className="text-sm leading-none">{icon}</span>
      )}
      <span className="truncate max-w-[72px]">{name}</span>
      {imageUrl && (
        <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0 animate-badge-pop" />
      )}
    </button>
  );
}
