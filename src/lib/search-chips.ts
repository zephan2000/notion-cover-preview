import type { AppState } from './cover-picker-types';
import type { BrandContext } from '../types';

function countTags(imageIds: string[], state: AppState): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of imageIds) {
    const img = state.images.find(i => i.id === id);
    if (!img) continue;
    for (const tag of img.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return counts;
}

export function generateChips(
  state: AppState,
  brandContext?: BrandContext,
): string[] {
  const chips: string[] = [];

  if (state.mode === 'refine' && state.lockedIds.length > 0) {
    const lockedTags = countTags(state.lockedIds, state);
    const unlockedIds = state.images
      .filter(img => !state.lockedIds.includes(img.id))
      .map(img => img.id);
    const unlockedTags = countTags(unlockedIds, state);

    // Tags strong in unlocked but weak/absent in locked → "Less X"
    const gapTags = Object.entries(unlockedTags)
      .filter(([tag, count]) => count >= 2 && (lockedTags[tag] ?? 0) < count * 0.5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    // Tags strong in locked but weak/absent in unlocked → "More X"
    const affinityTags = Object.entries(lockedTags)
      .filter(([tag, count]) => count >= 1 && (unlockedTags[tag] ?? 0) < count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    for (const [tag] of gapTags) {
      chips.push(`Less ${tag}`);
    }
    for (const [tag] of affinityTags) {
      chips.push(`More ${tag}`);
    }
  }

  // Fallback: use brand_vibe when no lock-based chips
  if (chips.length === 0 && brandContext?.brand_vibe) {
    for (const vibe of brandContext.brand_vibe.slice(0, 3)) {
      chips.push(`${vibe} aesthetic`);
    }
  }

  // Final fallback: generic suggestions
  if (chips.length === 0) {
    chips.push('Warm tones', 'Minimal', 'Nature');
  }

  return chips.slice(0, 5);
}
