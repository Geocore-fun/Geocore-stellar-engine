/**
 * FPS & performance overlay — small transparent HUD in the viewport corner.
 */

import { perfMonitor, type PerfStats } from '@/utils/perfMonitor';
import { useEffect, useState } from 'react';

export function PerfOverlay() {
  const [stats, setStats] = useState<PerfStats>({
    fps: 0,
    avgFrameMs: 0,
    avgCubemapMs: 0,
    lastCubemapMs: 0,
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Poll perf stats at ~4Hz
    const interval = setInterval(() => {
      setStats(perfMonitor.getStats());
    }, 250);
    return () => clearInterval(interval);
  }, []);

  // Toggle with P key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'p' || e.key === 'P') {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA'
        )
          return;
        setVisible((v) => !v);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  if (!visible) return null;

  const fpsColor = stats.fps >= 55 ? '#4ade80' : stats.fps >= 30 ? '#facc15' : '#f87171';

  return (
    <div className="pointer-events-none absolute right-3 bottom-3 z-20 font-mono text-[11px] leading-snug">
      <div className="rounded-lg bg-black/60 px-3 py-2 backdrop-blur-sm ring-1 ring-white/10">
        <div style={{ color: fpsColor }}>{stats.fps} FPS</div>
        <div className="text-text-muted">Frame: {stats.avgFrameMs.toFixed(1)}ms</div>
        <div className="text-text-muted">Cubemap: {stats.lastCubemapMs.toFixed(1)}ms</div>
      </div>
    </div>
  );
}
