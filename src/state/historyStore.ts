/**
 * History store — provides undo/redo for generator parameter changes.
 *
 * Subscribes to the main appStore and tracks parameter snapshots.
 * Rapid changes (slider dragging) are debounced into single undo entries.
 *
 * Usage:
 *   const { undo, redo, canUndo, canRedo } = useHistoryStore();
 *   undo();  // Restores previous parameter state
 *   redo();  // Re-applies undone state
 */

import { create } from 'zustand';
import { useAppStore, type AppState } from './appStore';

/** Tracked parameter snapshot (excludes camera, transient, and UI state) */
export type Snapshot = Pick<
  AppState,
  | 'seed'
  | 'faceSize'
  | 'backgroundColor'
  | 'starField'
  | 'catalogStars'
  | 'constellations'
  | 'constellationBoundaries'
  | 'milkyWay'
  | 'nebula'
  | 'sun'
  | 'bloom'
  | 'lensFlare'
  | 'godRays'
>;

interface HistoryState {
  past: Snapshot[];
  future: Snapshot[];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

const MAX_HISTORY = 50;
const DEBOUNCE_MS = 500;

/** Extract the tracked parameter fields from the full app state. */
function extractTracked(state: AppState): Snapshot {
  return {
    seed: state.seed,
    faceSize: state.faceSize,
    backgroundColor: state.backgroundColor,
    starField: state.starField,
    catalogStars: state.catalogStars,
    constellations: state.constellations,
    constellationBoundaries: state.constellationBoundaries,
    milkyWay: state.milkyWay,
    nebula: state.nebula,
    sun: state.sun,
    bloom: state.bloom,
    lensFlare: state.lensFlare,
    godRays: state.godRays,
  };
}

/** Apply a snapshot to the main appStore via a single setState merge. */
function applySnapshot(snapshot: Snapshot): void {
  useAppStore.setState({
    ...snapshot,
    needsRedraw: true,
  });
}

// ── Internal tracking state (module-scoped) ──

let isUndoRedoing = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let preChangeSnapshot: Snapshot | null = null;
let lastTrackedJSON = '';

// ── Store ──

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  undo: () => {
    const { past } = get();
    if (past.length === 0) return;

    const current = extractTracked(useAppStore.getState());
    const previous = past[past.length - 1];

    isUndoRedoing = true;
    applySnapshot(previous);
    isUndoRedoing = false;
    // Update lastTrackedJSON so subsequent user changes are tracked from here
    lastTrackedJSON = JSON.stringify(previous);

    const newPast = past.slice(0, -1);
    set({
      past: newPast,
      future: [current, ...get().future],
      canUndo: newPast.length > 0,
      canRedo: true,
    });
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return;

    const current = extractTracked(useAppStore.getState());
    const next = future[0];

    isUndoRedoing = true;
    applySnapshot(next);
    isUndoRedoing = false;
    lastTrackedJSON = JSON.stringify(next);

    const newFuture = future.slice(1);
    set({
      past: [...get().past, current],
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
    });
  },

  clear: () => set({ past: [], future: [], canUndo: false, canRedo: false }),
}));

// ── Auto-tracking via appStore subscription ──

function initHistoryTracking(): void {
  // Delay one macrotask to allow persist middleware rehydration to complete
  setTimeout(() => {
    const initial = extractTracked(useAppStore.getState());
    lastTrackedJSON = JSON.stringify(initial);

    useAppStore.subscribe((state) => {
      if (isUndoRedoing) return;

      const tracked = extractTracked(state);
      const json = JSON.stringify(tracked);
      if (json === lastTrackedJSON) return;

      // First change in a batch: capture the pre-change state for undo
      if (!preChangeSnapshot) {
        preChangeSnapshot = JSON.parse(lastTrackedJSON) as Snapshot;
      }
      lastTrackedJSON = json;

      // Debounce rapid slider changes into a single undo entry
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (preChangeSnapshot) {
          const { past } = useHistoryStore.getState();
          const newPast = [...past, preChangeSnapshot].slice(-MAX_HISTORY);
          useHistoryStore.setState({
            past: newPast,
            future: [], // New action clears redo stack
            canUndo: true,
            canRedo: false,
          });
        }
        preChangeSnapshot = null;
        debounceTimer = null;
      }, DEBOUNCE_MS);
    });
  }, 0);
}

// Initialize tracking on module load
initHistoryTracking();
