/**
 * Global keyboard shortcuts hook.
 *
 * Shortcuts:
 *   R        — Randomize seed
 *   Space    — Toggle fullscreen viewport
 *   1-5      — Load built-in presets (when not focused on input)
 *   F        — Fit/reset camera
 */

import { BUILT_IN_PRESETS } from '@/presets';
import { useAppStore } from '@/state';
import { useEffect } from 'react';

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in inputs
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
          state.setCamera({ yaw: 0, pitch: 0, fov: 75 });
          state.requestRedraw();
          break;
        }

        case '1':
        case '2':
        case '3':
        case '4':
        case '5': {
          // Load built-in preset
          const idx = parseInt(e.key, 10) - 1;
          const preset = BUILT_IN_PRESETS[idx];
          if (preset) {
            e.preventDefault();
            state.setSeed(preset.data.seed);
            state.setFaceSize(preset.data.faceSize);
            state.setBackgroundColor(preset.data.backgroundColor);
            state.setStarField(preset.data.starField);
            state.setNebula(preset.data.nebula);
            state.setSun(preset.data.sun);
          }
          break;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
