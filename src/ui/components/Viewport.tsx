/**
 * WebGL viewport component.
 *
 * Owns the canvas element and its size, the orbit camera input (pointer,
 * wheel and keyboard), and the loading/error states shown over the canvas.
 * The pipeline itself lives in useSkyboxRenderer.
 */

import type { ViewportStatus } from '@/hooks';
import { useAppStore } from '@/state';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

interface ViewportProps {
  /** Called once, after the canvas has its first real size. */
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  /** Called after the canvas backing store is resized (it is cleared by the resize). */
  onResize?: (width: number, height: number) => void;
  status: ViewportStatus;
  /** Asset loads still in flight; shown as a small pill once the sky is up. */
  pendingLoads: number;
}

const DRAG_SENSITIVITY = 0.005; // radians per pixel
const KEY_ORBIT_STEP = 0.05; // radians per arrow-key press
const MIN_FOV = 20;
const MAX_FOV = 120;
const PITCH_LIMIT = Math.PI / 2 - 0.01;

function clampPitch(pitch: number): number {
  return Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
}

function clampFov(fov: number): number {
  return Math.max(MIN_FOV, Math.min(MAX_FOV, fov));
}

export function Viewport({ onCanvasReady, onResize, status, pendingLoads }: ViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  const setCamera = useAppStore((s) => s.setCamera);

  const callbacks = useRef({ onCanvasReady, onResize });
  useEffect(() => {
    callbacks.current = { onCanvasReady, onResize };
  }, [onCanvasReady, onResize]);

  /** Match the backing store to the CSS size × devicePixelRatio. Returns true if it changed. */
  const syncCanvasSize = useCallback((): boolean => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return false;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    // At least 1px: a zero-sized drawing buffer makes the aspect ratio NaN.
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width === width && canvas.height === height) return false;

    canvas.width = width;
    canvas.height = height;
    return true;
  }, []);

  // Size the canvas before the first paint, then hand it over. Doing both in a
  // layout effect means the pipeline never starts on the default 300×150 buffer.
  useLayoutEffect(() => {
    syncCanvasSize();
    const canvas = canvasRef.current;
    if (canvas) callbacks.current.onCanvasReady?.(canvas);
  }, [syncCanvasSize]);

  // Track every size change: window resizes, the sidebar, devtools docking and
  // devicePixelRatio changes (moving between monitors fires 'resize').
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handle = () => {
      if (!syncCanvasSize()) return;
      const canvas = canvasRef.current;
      if (canvas) callbacks.current.onResize?.(canvas.width, canvas.height);
    };

    const observer = new ResizeObserver(handle);
    observer.observe(container);
    window.addEventListener('resize', handle);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handle);
    };
  }, [syncCanvasSize]);

  // Wheel zoom. Registered natively because React's onWheel is passive, and a
  // passive listener cannot stop the page from scrolling.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { camera } = useAppStore.getState();
      setCamera({ fov: clampFov(camera.fov + e.deltaY * 0.05) });
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [setCamera]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    drag.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY };
    // Capture so a drag that leaves the canvas keeps orbiting until release.
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = drag.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      d.x = e.clientX;
      d.y = e.clientY;
      const { camera } = useAppStore.getState();
      setCamera({
        yaw: camera.yaw + dx * DRAG_SENSITIVITY,
        pitch: clampPitch(camera.pitch + dy * DRAG_SENSITIVITY),
      });
    },
    [setCamera],
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drag.current?.pointerId === e.pointerId) drag.current = null;
  }, []);

  // Keyboard orbit for the focused canvas: arrows look around, +/- zoom.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLCanvasElement>) => {
      const { camera } = useAppStore.getState();
      const step = e.shiftKey ? KEY_ORBIT_STEP * 4 : KEY_ORBIT_STEP;
      switch (e.key) {
        case 'ArrowLeft':
          setCamera({ yaw: camera.yaw - step });
          break;
        case 'ArrowRight':
          setCamera({ yaw: camera.yaw + step });
          break;
        case 'ArrowUp':
          setCamera({ pitch: clampPitch(camera.pitch - step) });
          break;
        case 'ArrowDown':
          setCamera({ pitch: clampPitch(camera.pitch + step) });
          break;
        case '+':
        case '=':
          setCamera({ fov: clampFov(camera.fov - 5) });
          break;
        case '-':
        case '_':
          setCamera({ fov: clampFov(camera.fov + 5) });
          break;
        default:
          return;
      }
      e.preventDefault();
    },
    [setCamera],
  );

  const showOverlay = status.phase !== 'ready';

  return (
    <div
      ref={containerRef}
      className="viewport-backdrop absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="img"
        aria-label="Skybox preview. Drag, or use the arrow keys, to look around; scroll or press plus and minus to zoom."
        className="viewport-canvas h-full w-full cursor-grab touch-none active:cursor-grabbing"
        style={{ opacity: showOverlay ? 0 : 1 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
      />

      {showOverlay && <ViewportOverlay status={status} />}

      {!showOverlay && pendingLoads > 0 && (
        <div
          role="status"
          className="pointer-events-none absolute top-3 right-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[11px] text-text-secondary ring-1 ring-white/10 backdrop-blur-sm"
        >
          <span className="viewport-spinner h-3 w-3" aria-hidden="true" />
          Loading star catalogue…
        </div>
      )}

      <div className="pointer-events-none absolute bottom-2 left-2 text-xs text-text-muted">
        Drag to orbit · Scroll to zoom
      </div>
    </div>
  );
}

/** What fills the viewport before the first frame, or instead of it. */
function ViewportOverlay({ status }: { status: ViewportStatus }) {
  if (status.phase === 'error') {
    return (
      <div
        role="alert"
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center"
      >
        <p className="text-[14px] font-semibold text-text-primary">The preview could not start</p>
        <p className="max-w-md text-[12px] leading-relaxed text-text-secondary">{status.message}</p>
        <p className="max-w-md text-[12px] leading-relaxed text-text-muted">
          The engine needs WebGL2 with hardware acceleration. Try an up-to-date Chrome, Edge or
          Firefox, and check that hardware acceleration is on in the browser settings.
        </p>
      </div>
    );
  }

  const recovering = status.phase === 'recovering';
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3"
    >
      <span className="viewport-spinner h-7 w-7" aria-hidden="true" />
      <p className="text-[13px] font-medium text-text-primary">
        {recovering ? 'Recovering the graphics context…' : 'Preparing the sky…'}
      </p>
      <p className="text-[11px] text-text-muted">
        {recovering
          ? 'The GPU reset. Your settings are safe; the sky is being rebuilt.'
          : 'Compiling shaders and generating stars.'}
      </p>
    </div>
  );
}
