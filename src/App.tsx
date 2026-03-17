import { useState, useMemo } from 'react';
import { useUrlState } from './hooks/useUrlState';
import { TopBar } from './components/TopBar';
import { ImageGrid } from './components/ImageGrid';
import { AssignModal } from './components/AssignModal';
import { ReviewPanel } from './components/ReviewPanel';
import { SuccessOverlay } from './components/SuccessOverlay';

export default function App() {
  const { config, isDemo, loading, writeSelections } = useUrlState();
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<'browse' | 'review'>('browse');
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [notionDark, setNotionDark] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allSelected = config.pages.every((p) => !!selections[p.id]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const img of config.image_pool) {
      for (const tag of img.tags) tags.add(tag);
    }
    return Array.from(tags).sort();
  }, [config.image_pool]);

  function handleAssign(pageId: string, url: string) {
    setSelections((prev) => ({ ...prev, [pageId]: url }));
  }

  function handlePageChipClick(pageId: string) {
    const currentUrl = selections[pageId];
    if (currentUrl) {
      // Page has an image — open it in the modal
      setSelectedImageUrl(currentUrl);
    } else {
      // Page has no image — switch to browse mode
      setMode('browse');
    }
  }

  function handleChangeCover(_pageId: string) {
    setMode('browse');
  }

  async function handleConfirm() {
    setSaving(true);
    const ok = await writeSelections(selections);
    setSaving(false);
    if (ok) setShowSuccess(true);
  }

  if (loading) {
    return (
      <div className="dark">
        <div className="h-screen flex items-center justify-center bg-linear-bg text-linear-text-muted text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark">
      <div className="h-screen flex flex-col bg-linear-bg text-linear-text-primary font-sans">
        <TopBar
          workspaceName={config.workspace_name}
          isDemo={isDemo}
          pages={config.pages}
          selections={selections}
          mode={mode}
          notionDark={notionDark}
          allSelected={allSelected}
          saving={saving}
          onToggleNotionDark={() => setNotionDark((v) => !v)}
          onToggleMode={() => setMode((m) => m === 'browse' ? 'review' : 'browse')}
          onConfirm={handleConfirm}
          onPageChipClick={handlePageChipClick}
        />

        {mode === 'browse' ? (
          <ImageGrid
            images={config.image_pool}
            selections={selections}
            pages={config.pages}
            activeTag={activeTag}
            allTags={allTags}
            onTagFilter={setActiveTag}
            onImageClick={setSelectedImageUrl}
          />
        ) : (
          <ReviewPanel
            pages={config.pages}
            selections={selections}
            notionDark={notionDark}
            onChangeCover={handleChangeCover}
          />
        )}

        {selectedImageUrl && (
          <AssignModal
            imageUrl={selectedImageUrl}
            pages={config.pages}
            selections={selections}
            onAssign={handleAssign}
            onClose={() => setSelectedImageUrl(null)}
          />
        )}

        {showSuccess && (
          <SuccessOverlay
            pages={config.pages}
            selections={selections}
            onDismiss={() => setShowSuccess(false)}
          />
        )}
      </div>
    </div>
  );
}
