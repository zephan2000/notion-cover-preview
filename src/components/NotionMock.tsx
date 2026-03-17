import { useState } from 'react';

interface NotionMockProps {
  imageUrl: string;
  pageIcon: string;
  pageTitle: string;
  notionDark: boolean;
}

export function NotionMock({ imageUrl, pageIcon, pageTitle, notionDark }: NotionMockProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const bg = notionDark ? 'bg-[#191919]' : 'bg-white';
  const textColor = notionDark ? 'text-[#e6e3dc]' : 'text-[#37352f]';
  const subtextColor = notionDark ? 'text-[#9b9a97]' : 'text-[#787774]';
  const chipBg = notionDark ? 'bg-[#2f2f2f]' : 'bg-[#f1f1ef]';

  return (
    <div className={`${bg} rounded-lg overflow-hidden`}>
      {/* Cover banner */}
      <div className="relative" style={{ aspectRatio: '16 / 3.2' }}>
        {!loaded && !error && (
          <div className={`absolute inset-0 ${notionDark ? 'bg-[#2a2a2a]' : 'bg-stone-200'} animate-pulse`} />
        )}
        {error ? (
          <div className="absolute inset-0 bg-red-900/20 flex items-center justify-center">
            <span className="text-red-400 text-xs font-medium">Failed to load</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={`Cover for ${pageTitle}`}
            className={`w-full h-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        )}
      </div>

      {/* Page header */}
      {pageIcon && pageTitle && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[28px] leading-none">{pageIcon}</span>
            <span className={`text-[20px] font-bold ${textColor}`} style={{ fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif' }}>
              {pageTitle}
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            <span className={`text-[11px] ${subtextColor} px-1.5 py-0.5 rounded ${chipBg}`}>
              {'\u{1F4C5}'} Today
            </span>
            <span className={`text-[11px] ${subtextColor} px-1.5 py-0.5 rounded ${chipBg}`}>
              {'\u{1F512}'} Private
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
