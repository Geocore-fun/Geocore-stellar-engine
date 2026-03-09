/**
 * A/B Comparison overlay — split-view to compare current state against a snapshot.
 *
 * Usage:
 *   1. Click the A|B button in the toolbar (or press 'C') to capture a snapshot
 *   2. Modify parameters
 *   3. A draggable vertical divider shows the snapshot (left) vs current (right)
 *   4. Click the button again (or press 'C') to exit comparison mode
 *
 * The snapshot is rendered as an image on the left side of the viewport,
 * and the live preview renders on the right side.
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

export interface ComparisonOverlayHandle {
  /** Programmatically toggle comparison mode (used by toolbar button) */
  toggle: () => void;
}

interface ComparisonOverlayProps {
  /** Capture callback — returns a data URL of the current canvas */
  onCapture: () => string | null;
  /** Canvas element for sizing */
  canvasWidth: number;
  canvasHeight: number;
  /** Fires when comparison mode is entered or exited */
  onStateChange?: (isComparing: boolean) => void;
}

export const ComparisonOverlay = forwardRef<ComparisonOverlayHandle, ComparisonOverlayProps>(
  function ComparisonOverlay({ onCapture, canvasWidth, canvasHeight, onStateChange }, ref) {
    const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
    const [splitPosition, setSplitPosition] = useState(0.5);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Core toggle logic — shared between keyboard shortcut and imperative handle
    const doToggle = useCallback(() => {
      setSnapshotUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
          onStateChange?.(false);
          return null;
        }
        const url = onCapture();
        if (url) onStateChange?.(true);
        return url;
      });
      setSplitPosition(0.5);
    }, [onCapture, onStateChange]);

    // Expose toggle via ref so toolbar can call it
    useImperativeHandle(ref, () => ({ toggle: doToggle }), [doToggle]);

    // Toggle comparison mode with C key
    useEffect(() => {
      function handleKey(e: KeyboardEvent) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          doToggle();
        }
      }
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }, [doToggle]);

    // Clean up blob URL on unmount
    useEffect(() => {
      return () => {
        if (snapshotUrl) URL.revokeObjectURL(snapshotUrl);
      };
    }, [snapshotUrl]);

    // Mouse handlers for dragging the split divider
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
    }, []);

    useEffect(() => {
      if (!isDragging) return;

      function handleMove(e: MouseEvent) {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        setSplitPosition(Math.max(0.01, Math.min(0.99, x)));
      }

      function handleUp() {
        setIsDragging(false);
      }

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };
    }, [isDragging]);

    if (!snapshotUrl) return null;

    const splitPx = Math.round(splitPosition * canvasWidth);

    return (
      <div
        ref={containerRef}
        className="pointer-events-auto absolute inset-0 z-20"
        style={{ cursor: isDragging ? 'col-resize' : 'default' }}
      >
        {/* Snapshot image (left side) — clipped to split position */}
        <div className="absolute inset-0 overflow-hidden" style={{ width: splitPx }}>
          <img
            src={snapshotUrl}
            alt="Snapshot"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ width: canvasWidth, height: canvasHeight }}
            draggable={false}
          />
        </div>

        {/* Split divider line */}
        <div
          className="absolute top-0 bottom-0 z-30 cursor-col-resize"
          style={{ left: splitPx - 12, width: 24 }}
          onMouseDown={handleMouseDown}
        >
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-lg"
            style={{ left: 12 }}
          />
          {/* Handle grip */}
          <div className="absolute top-1/2 left-1/2 flex h-8 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded bg-white/90 shadow-lg">
            <div className="flex gap-0.5">
              <div className="h-3 w-0.5 rounded bg-gray-500" />
              <div className="h-3 w-0.5 rounded bg-gray-500" />
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="pointer-events-none absolute top-2 left-2 z-30 rounded bg-black/60 px-2 py-0.5 text-xs text-white/80">
          Snapshot (A)
        </div>
        <div className="pointer-events-none absolute top-2 right-2 z-30 rounded bg-black/60 px-2 py-0.5 text-xs text-white/80">
          Current (B)
        </div>

        {/* Exit hint */}
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 -translate-x-1/2 rounded bg-black/60 px-3 py-1 text-xs text-white/60">
          Press C or click A|B to exit comparison
        </div>
      </div>
    );
  },
);
