/**
 * WebGL viewport component.
 *
 * Manages the canvas element, initializes the WebGL2 renderer,
 * and handles orbit camera controls for preview.
 */

import { useAppStore } from '@/state';
import { useCallback, useEffect, useRef } from 'react';

interface ViewportProps {
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function Viewport({ onCanvasReady }: ViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const setCamera = useAppStore((s) => s.setCamera);

  // Handle canvas resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const onCanvasReadyRef = useRef(onCanvasReady);
  useEffect(() => {
    onCanvasReadyRef.current = onCanvasReady;
  }, [onCanvasReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && onCanvasReadyRef.current) {
      onCanvasReadyRef.current(canvas);
    }
    // Only run once when the canvas mounts — not when onCanvasReady identity changes
  }, []);

  // Orbit camera - mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Orbit camera - mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;

      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.005;
      const state = useAppStore.getState();
      const newYaw = state.camera.yaw + dx * sensitivity;
      const newPitch = Math.max(
        -Math.PI / 2 + 0.01,
        Math.min(Math.PI / 2 - 0.01, state.camera.pitch + dy * sensitivity),
      );

      setCamera({ yaw: newYaw, pitch: newPitch });
    },
    [setCamera],
  );

  // Orbit camera - mouse up
  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Scroll to zoom (FOV)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const state = useAppStore.getState();
      const newFov = Math.max(20, Math.min(120, state.camera.fov + e.deltaY * 0.05));
      setCamera({ fov: newFov });
    },
    [setCamera],
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center bg-black"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
      {/* Overlay info */}
      <div className="pointer-events-none absolute bottom-2 left-2 text-xs text-text-muted">
        Drag to orbit · Scroll to zoom
      </div>
    </div>
  );
}
