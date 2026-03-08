/**
 * iOS-style toolbar — frosted glass header bar.
 */

import { useAppStore } from '@/state';

export function Toolbar() {
  const seed = useAppStore((s) => s.seed);
  const setSeed = useAppStore((s) => s.setSeed);
  const randomizeSeed = useAppStore((s) => s.randomizeSeed);
  const faceSize = useAppStore((s) => s.faceSize);
  const setFaceSize = useAppStore((s) => s.setFaceSize);

  return (
    <div className="flex w-full items-center gap-5 text-[13px]">
      {/* App title */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-[11px] font-bold text-white">
          SG
        </div>
        <span className="font-semibold tracking-tight text-text-primary">Skybox Generator</span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-border" />

      {/* Seed control */}
      <div className="flex items-center gap-2">
        <span className="text-text-muted">Seed</span>
        <input
          type="number"
          value={seed}
          onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
          className="w-20 rounded-md bg-bg-input px-2 py-1 text-center font-mono text-[12px] text-text-primary ring-1 ring-white/8 transition-all focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          onClick={randomizeSeed}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-bg-input text-sm ring-1 ring-white/8 transition-all hover:bg-bg-hover hover:ring-white/15 active:scale-95"
          title="Randomize seed"
        >
          🎲
        </button>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-border" />

      {/* Resolution selector */}
      <div className="flex items-center gap-2">
        <span className="text-text-muted">Preview</span>
        <select
          value={faceSize}
          onChange={(e) => setFaceSize(parseInt(e.target.value, 10))}
          className="rounded-md bg-bg-input px-2 py-1 text-[12px] text-text-primary ring-1 ring-white/8 transition-all focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value={256}>256px</option>
          <option value={512}>512px</option>
          <option value={1024}>1024px</option>
          <option value={2048}>2048px</option>
          <option value={4096}>4096px</option>
        </select>
      </div>

      {/* Spacer */}
      <div className="flex-1" />
    </div>
  );
}
