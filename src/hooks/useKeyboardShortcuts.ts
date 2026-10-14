/**
 * Global keyboard shortcuts hook.
 *
 * Shortcuts:
 *   Ctrl+Z   — Undo
 *   Ctrl+Y   — Redo
 *   Ctrl+Shift+Z — Redo (alternative)
 *   R        — Randomize seed
 *   Space    — Toggle fullscreen viewport
 *   1-9      — Load built-in presets 1-9 (when not focused on input)
 *   F        — Fit/reset camera
 *   P        — Toggle performance overlay
 */

import { applyPresetData, BUILT_IN_PRESETS } from '@/presets';
import { useAppStore } from '@/state';
import { useHistoryStore } from '@/state/historyStore';
import { useEffect } from 'react';

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // ── Undo / Redo (works even in inputs) ──
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          useHistoryStore.getState().undo();
          return;
        }
        if (e.key === 'y' || (e.key === 'z' && e.shiftKey) || (e.key === 'Z' && e.shiftKey)) {
          e.preventDefault();
          useHistoryStore.getState().redo();
          return;
        }
      }

      // Single-key shortcuts never take a modifier: Ctrl+R must reload the
      // page and Ctrl+1 switch tabs, not randomise the seed or load a preset.
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Ignore other shortcuts when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const state = useAppStore.getState();

      switch (e.key.toLowerCase()) {
        case 'r': {
          // Randomize seed
          e.preventDefault();
          state.randomizeSeed();
          break;
        }

        case 'f': {
          // Reset camera
          e.preventDefault();
          // A camera change redraws the preview; the cubemap itself is unchanged.
          state.setCamera({ yaw: 0, pitch: 0, fov: 75 });
          break;
        }

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': {
          // Load built-in preset
          const idx = parseInt(e.key, 10) - 1;
          const preset = BUILT_IN_PRESETS[idx];
          if (preset) {
            e.preventDefault();
            // Same path as clicking it in the Presets panel: every layer, one undo step.
            applyPresetData(preset.data);
          }
          break;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
