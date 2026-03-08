/**
 * Toolbar component — top bar with global controls.
 */

import { useAppStore } from '@/state';

export function Toolbar() {
  const seed = useAppStore((s) => s.seed);
  const setSeed = useAppStore((s) => s.setSeed);
  const randomizeSeed = useAppStore((s) => s.randomizeSeed);
  const faceSize = useAppStore((s) => s.faceSize);
  const setFaceSize = useAppStore((s) => s.setFaceSize);

  return (
    <div className="flex w-full items-center gap-4 text-sm">
      {/* App title */}
      <span className="mr-4 font-semibold text-text-primary">SkyboxGenerator</span>

      {/* Seed control */}
      <div className="flex items-center gap-1.5">
        <label className="text-text-secondary">Seed:</label>
        <input
          type="number"
          value={seed}
          onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
          className="w-24 rounded-sm border border-border bg-bg-input px-1.5 py-0.5 text-text-primary"
        />
        <button
          onClick={randomizeSeed}
          className="rounded-sm border border-border bg-bg-input px-2 py-0.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          title="Randomize seed"
        >
          🎲
        </button>
      </div>

      {/* Resolution selector */}
      <div className="flex items-center gap-1.5">
        <label className="text-text-secondary">Resolution:</label>
        <select
          value={faceSize}
          onChange={(e) => setFaceSize(parseInt(e.target.value, 10))}
          className="rounded-sm border border-border bg-bg-input px-1.5 py-0.5 text-text-primary"
        >
          <option value={512}>512</option>
          <option value={1024}>1024</option>
          <option value={2048}>2048</option>
          <option value={4096}>4096</option>
        </select>
      </div>

      {/* Spacer */}
      <div className="flex-1" />
    </div>
  );
}
