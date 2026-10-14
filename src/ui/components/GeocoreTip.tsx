/**
 * First-visit tip pointing Geocore players at the import guide.
 *
 * Shown once per browser: dismissing it, or opening the guide from it, is
 * remembered in localStorage. Storage can be unavailable (private windows,
 * blocked site data), so every access is guarded and the tip simply shows
 * again rather than breaking the page.
 */

import { CloseIcon } from '@/ui/icons';
import { useState } from 'react';

const STORAGE_KEY = 'geocore-stellar-engine.geocore-tip-dismissed';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Not persisted; it will show again next visit, which is harmless.
  }
}

interface GeocoreTipProps {
  onOpenGuide: () => void;
  /** Hold the tip back (e.g. while the sky is still loading). */
  hidden?: boolean;
}

export function GeocoreTip({ onOpenGuide, hidden = false }: GeocoreTipProps) {
  const [dismissed, setDismissed] = useState(readDismissed);

  if (dismissed || hidden) return null;

  const dismiss = () => {
    writeDismissed();
    setDismissed(true);
  };

  return (
    <aside
      aria-label="Tip for Geocore players"
      className="absolute bottom-8 left-3 z-20 flex max-w-xs items-start gap-3 rounded-xl bg-black/60 px-3.5 py-3 ring-1 ring-white/10 backdrop-blur-md"
      style={{ animation: 'fadeIn 0.3s ease-out' }}
    >
      <div className="min-w-0 text-[12px] leading-snug">
        <p className="font-medium text-text-primary">Making a sky for Geocore?</p>
        <p className="mt-0.5 text-text-secondary">
          Pro players on Windows can import it as the game&rsquo;s backdrop.
        </p>
        <button
          type="button"
          onClick={() => {
            dismiss();
            onOpenGuide();
          }}
          className="focus-ring mt-1.5 rounded font-medium text-accent transition-colors hover:text-accent-hover"
        >
          Show me how
        </button>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss tip"
        className="focus-ring -mt-0.5 -mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
      >
        <CloseIcon />
      </button>
    </aside>
  );
}
