/**
 * Glassmorphism toolbar — frosted glass header bar with About & Compare buttons.
 */

import { useAppStore } from '@/state';
import { CompareIcon, InfoIcon } from '@/ui/icons';

interface ToolbarProps {
  onAboutClick: () => void;
  /** Toggle A/B comparison mode */
  onCompareToggle?: () => void;
  /** Whether comparison mode is currently active */
  isComparing?: boolean;
}

export function Toolbar({ onAboutClick, onCompareToggle, isComparing }: ToolbarProps) {
  const seed = useAppStore((s) => s.seed);
  const setSeed = useAppStore((s) => s.setSeed);
  const randomizeSeed = useAppStore((s) => s.randomizeSeed);
  const faceSize = useAppStore((s) => s.faceSize);
  const setFaceSize = useAppStore((s) => s.setFaceSize);
  const camera = useAppStore((s) => s.camera);
  const setCamera = useAppStore((s) => s.setCamera);

  return (
    <div className="flex w-full items-center gap-5 text-[13px]">
      {/* App title */}
      <div className="flex items-center gap-2">
        <img
          src="/images/Logo.png"
          alt="Geocore Stellar Engine"
          className="h-6 w-6 rounded-md shadow-md shadow-accent/20"
        />
        <span className="font-semibold tracking-tight text-text-primary">
          Geocore Stellar Engine
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-white/8" />

      {/* Seed control */}
      <div className="flex items-center gap-2">
        <span className="text-text-muted">Seed</span>
        <input
          type="number"
          value={seed}
          onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
          className="w-20 rounded-md bg-white/5 px-2 py-1 text-center font-mono text-[12px] text-text-primary ring-1 ring-white/8 transition-all focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          onClick={randomizeSeed}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-sm ring-1 ring-white/8 transition-all hover:bg-white/10 hover:ring-white/15 active:scale-95"
          title="Randomize seed"
        >
          🎲
        </button>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-white/8" />

      {/* Resolution selector */}
      <div className="flex items-center gap-2">
        <span className="text-text-muted">Preview</span>
        <select
          value={faceSize}
          onChange={(e) => setFaceSize(parseInt(e.target.value, 10))}
          className="rounded-md bg-white/5 px-2 py-1 text-[12px] text-text-primary ring-1 ring-white/8 transition-all focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value={256}>256px</option>
          <option value={512}>512px</option>
          <option value={1024}>1024px</option>
          <option value={2048}>2048px</option>
          <option value={4096}>4096px</option>
        </select>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-white/8" />

      {/* FOV control */}
      <div className="flex items-center gap-2">
        <span className="text-text-muted">FOV</span>
        <input
          type="range"
          min={20}
          max={120}
          step={1}
          value={camera.fov}
          onChange={(e) => setCamera({ fov: parseFloat(e.target.value) })}
          className="w-24 accent-accent"
          title={`Field of View: ${Math.round(camera.fov)}°`}
        />
        <span className="min-w-8 text-right font-mono text-[11px] text-text-secondary">
          {Math.round(camera.fov)}°
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* A/B Compare button */}
      {onCompareToggle && (
        <button
          onClick={onCompareToggle}
          className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] ring-1 transition-all active:scale-95 ${
            isComparing
              ? 'bg-accent/20 text-accent ring-accent/40 hover:bg-accent/30'
              : 'bg-white/5 text-text-muted ring-white/8 hover:bg-white/10 hover:text-text-primary'
          }`}
          title={isComparing ? 'Exit A/B comparison (C)' : 'Start A/B comparison (C)'}
        >
          <CompareIcon size={14} />
          <span>{isComparing ? 'Exit Compare' : 'Compare'}</span>
        </button>
      )}

      {/* Divider */}
      <div className="h-4 w-px bg-white/8" />

      {/* About button */}
      <button
        onClick={onAboutClick}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-text-muted ring-1 ring-white/8 transition-all hover:bg-white/10 hover:text-text-primary active:scale-95"
        title="About"
      >
        <InfoIcon />
      </button>
    </div>
  );
}
