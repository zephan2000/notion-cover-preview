import { useState } from 'react';
import { useUrlState } from './hooks/useUrlState';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { OptionCard } from './components/OptionCard';
import { CustomUrlCard } from './components/CustomUrlCard';
import { SuccessOverlay } from './components/SuccessOverlay';

export default function App() {
  const { config, isDemo, writeSelections } = useUrlState();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [notionDark, setNotionDark] = useState(false);
  const [appDark, setAppDark] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentPage = config.pages[currentPageIndex];
  const allSelected = config.pages.every((p) => !!selections[p.id]);
  const currentSelection = currentPage ? selections[currentPage.id] : undefined;

  function handleSelect(pageId: string, url: string) {
    setSelections((prev) => ({ ...prev, [pageId]: url }));
  }

  function handleConfirm() {
    writeSelections(selections);
    setShowSuccess(true);
  }

  if (!currentPage) return null;

  return (
    <div className={appDark ? 'dark' : ''}>
      <div className="h-screen flex flex-col bg-stone-50 dark:bg-neutral-950 text-stone-800 dark:text-neutral-100">
        <TopBar
          workspaceName={config.workspace_name}
          isDemo={isDemo}
          pages={config.pages}
          selections={selections}
          notionDark={notionDark}
          appDark={appDark}
          allSelected={allSelected}
          onToggleNotionDark={() => setNotionDark((v) => !v)}
          onToggleAppDark={() => setAppDark((v) => !v)}
          onConfirm={handleConfirm}
        />

        <div className="flex flex-1 min-h-0">
          <Sidebar
            pages={config.pages}
            currentIndex={currentPageIndex}
            selections={selections}
            onPageClick={setCurrentPageIndex}
          />

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-bold mb-1">
                {currentPage.icon} {currentPage.name}
              </h2>
              <p className="text-sm text-stone-500 dark:text-neutral-400 mb-6">
                Choose a cover image for this page
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <OptionCard
                  label="Option A"
                  imageUrl={currentPage.option_a}
                  pageIcon={currentPage.icon}
                  pageTitle={currentPage.name}
                  notionDark={notionDark}
                  isSelected={currentSelection === currentPage.option_a}
                  onSelect={() => handleSelect(currentPage.id, currentPage.option_a)}
                />
                <OptionCard
                  label="Option B"
                  imageUrl={currentPage.option_b}
                  pageIcon={currentPage.icon}
                  pageTitle={currentPage.name}
                  notionDark={notionDark}
                  isSelected={currentSelection === currentPage.option_b}
                  onSelect={() => handleSelect(currentPage.id, currentPage.option_b)}
                />
              </div>

              <CustomUrlCard
                pageIcon={currentPage.icon}
                pageTitle={currentPage.name}
                notionDark={notionDark}
                isSelected={
                  !!currentSelection &&
                  currentSelection !== currentPage.option_a &&
                  currentSelection !== currentPage.option_b
                }
                selectedUrl={
                  currentSelection !== currentPage.option_a &&
                  currentSelection !== currentPage.option_b
                    ? currentSelection || ''
                    : ''
                }
                onSelect={(url) => handleSelect(currentPage.id, url)}
              />
            </div>
          </main>
        </div>

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
