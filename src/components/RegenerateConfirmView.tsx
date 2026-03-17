import { motion } from 'framer-motion';
import { Check, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { JsonOutput } from './JsonOutput';
import type { AppState, AppAction } from '@/lib/cover-picker-types';

type Props = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  onConfirm: () => void;
};

export const RegenerateConfirmView = ({ state, dispatch, onConfirm }: Props) => {
  const { regeneratePayload, saving, saved, isDemo, lockedIds, images } = state;

  const keptImages = images.filter(img => lockedIds.includes(img.id));
  const regenerateCount = (regeneratePayload as Record<string, unknown>)?.regenerate_count as number ?? 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-8 overflow-y-auto no-scrollbar">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 pt-8"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-400/10 mb-4">
          <RefreshCw className="w-6 h-6 text-green-400" />
        </div>
        {saved ? (
          <>
            <h1 className="text-3xl font-light text-foreground mb-3">
              Regeneration request saved.
            </h1>
            <p className="text-sm text-muted-foreground">
              Your {keptImages.length} kept image{keptImages.length !== 1 ? 's' : ''} and regeneration
              request have been sent to Manus.
            </p>
            {!isDemo && (
              <p className="text-sm text-muted-foreground mt-2">
                Head back to Manus and say{' '}
                <span className="inline-block px-2 py-0.5 rounded-md bg-foreground/10 text-foreground font-medium text-sm">
                  I've submitted my Keep & Regenerate request
                </span>
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Manus will keep your favourite images and find {regenerateCount} new
              option{regenerateCount !== 1 ? 's' : ''} to replace the rest.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-light text-foreground mb-3">
              Keep & Regenerate
            </h1>
            <p className="text-sm text-muted-foreground">
              You're keeping <span className="text-green-400 font-medium">{keptImages.length}</span> image{keptImages.length !== 1 ? 's' : ''} and
              asking Manus to find <span className="text-foreground font-medium">{regenerateCount}</span> new
              option{regenerateCount !== 1 ? 's' : ''} for the rest.
            </p>
          </>
        )}
      </motion.div>

      {/* Kept images grid */}
      {keptImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-3xl mb-8"
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 text-center">
            Images you're keeping
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {keptImages.map((img) => (
              <div
                key={img.id}
                className="w-24 h-16 rounded-lg overflow-hidden border border-green-400/30 ring-2 ring-green-400/20"
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* JSON payload */}
      {regeneratePayload && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-2xl mb-8"
        >
          <JsonOutput data={regeneratePayload} collapsible />
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 flex flex-col items-center gap-3"
      >
        {!saved && (
          <button
            onClick={onConfirm}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium bg-green-400 text-background hover:bg-green-300 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending to Manus...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {isDemo ? 'Confirm (Demo)' : 'Confirm & Send to Manus'}
              </>
            )}
          </button>
        )}

        <button
          onClick={() => dispatch({ type: 'SET_MODE', mode: 'refine' })}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to refine
        </button>
      </motion.div>
    </div>
  );
};
