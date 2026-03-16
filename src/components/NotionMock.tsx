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

  return (
    <div className={`${bg} rounded-md overflow-hidden shadow-sm border ${notionDark ? 'border-neutral-700' : 'border-stone-200'}`}>
      {/* Cover banner */}
      <div className="relative" style={{ aspectRatio: '16 / 3.2' }}>
        {!loaded && !error && (
          <div className={`absolute inset-0 ${notionDark ? 'bg-neutral-800' : 'bg-stone-200'} animate-pulse`} />
        )}
        {error ? (
          <div className="absolute inset-0 bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-sm font-medium">Failed to load image</span>
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
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[28px] leading-none">{pageIcon}</span>
          <span className={`text-[22px] font-bold ${textColor}`} style={{ fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif' }}>
            {pageTitle}
          </span>
        </div>
        <div className="flex gap-3 mt-2">
          <span className={`text-xs ${subtextColor} px-2 py-0.5 rounded ${notionDark ? 'bg-neutral-800' : 'bg-stone-100'}`}>
            {'\u{1F4C5}'} Today
          </span>
          <span className={`text-xs ${subtextColor} px-2 py-0.5 rounded ${notionDark ? 'bg-neutral-800' : 'bg-stone-100'}`}>
            {'\u{1F512}'} Private
          </span>
        </div>
      </div>
    </div>
  );
}
