/**
 * Glassmorphism toolbar — frosted glass header bar with seed, preview size,
 * FOV, and the Compare, Use in Geocore and About buttons.
 */

import { useAppStore } from '@/state';
import { CompareIcon, GlobeIcon, InfoIcon } from '@/ui/icons';
import { useId, useMemo } from 'react';
import { Select, type SelectOption } from './Select';

const PREVIEW_SIZES = [256, 512, 1024, 2048, 4096] as const;

interface ToolbarProps {
  onAboutClick: () => void;
  /** Open the "Use in Geocore" guide. */
  onGeocoreClick: () => void;
  /** Largest cubemap face the GPU supports; larger preview sizes are disabled. */
  maxPreviewSize?: number | null;
  /** Toggle A/B comparison mode */
  onCompareToggle?: () => void;
  /** Whether comparison mode is currently active */
  isComparing?: boolean;
}

export function Toolbar({
  onAboutClick,
  onGeocoreClick,
  maxPreviewSize,
  onCompareToggle,
  isComparing,
}: ToolbarProps) {
  const seedId = useId();
  const previewId = useId();
  const fovId = useId();
  const seed = useAppStore((s) => s.seed);
  const setSeed = useAppStore((s) => s.setSeed);
  const randomizeSeed = useAppStore((s) => s.randomizeSeed);
  const faceSize = useAppStore((s) => s.faceSize);
  const setFaceSize = useAppStore((s) => s.setFaceSize);
  const camera = useAppStore((s) => s.camera);
  const setCamera = useAppStore((s) => s.setCamera);

  const previewOptions = useMemo<SelectOption<number>[]>(
    () =>
      PREVIEW_SIZES.map((size) => {
        const tooBig = maxPreviewSize != null && size > maxPreviewSize;
        return {
          value: size,
          label: `${size}px`,
          disabled: tooBig,
          disabledReason: tooBig ? `Above this GPU's ${maxPreviewSize}px cubemap limit` : undefined,
        };
      }),
    [maxPreviewSize],
  );

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
        <label htmlFor={seedId} className="text-text-muted">
          Seed
        </label>
        <input
          id={seedId}
          type="number"
          value={seed}
          onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
          className="w-20 rounded-md bg-white/5 px-2 py-1 text-center font-mono text-[12px] text-text-primary ring-1 ring-white/8 transition-all focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="button"
          onClick={randomizeSeed}
          className="focus-ring flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-sm ring-1 ring-white/8 transition-all hover:bg-white/10 hover:ring-white/15 active:scale-95"
          title="Randomize seed (R)"
          aria-label="Randomize seed"
        >
          <span aria-hidden="true">🎲</span>
        </button>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-white/8" />

      {/* Resolution selector */}
      <div className="flex items-center gap-2">
        <span id={previewId} className="text-text-muted">
          Preview
        </span>
        <Select
          value={faceSize}
          options={previewOptions}
          onChange={setFaceSize}
          labelledBy={previewId}
          size="sm"
          className="w-[88px]"
          title="Preview cubemap face size (exports choose their own)"
        />
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-white/8" />

      {/* FOV control */}
      <div className="flex items-center gap-2">
        <label htmlFor={fovId} className="text-text-muted">
          FOV
        </label>
        <input
          id={fovId}
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
          type="button"
          onClick={onCompareToggle}
          aria-pressed={isComparing}
          className={`focus-ring flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] ring-1 transition-all active:scale-95 ${
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

      {/* Use in Geocore */}
      <button
        type="button"
        onClick={onGeocoreClick}
        className="focus-ring flex h-7 items-center gap-1.5 rounded-md bg-accent/15 px-2.5 text-[12px] font-medium text-accent ring-1 ring-accent/30 transition-all hover:bg-accent/25 active:scale-95"
        title="How to use this sky in Geocore"
      >
        <GlobeIcon size={14} />
        <span>Use in Geocore</span>
      </button>

      {/* Divider */}
      <div className="h-4 w-px bg-white/8" />

      {/* About button */}
      <button
        type="button"
        onClick={onAboutClick}
        className="focus-ring flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-text-muted ring-1 ring-white/8 transition-all hover:bg-white/10 hover:text-text-primary active:scale-95"
        title="About"
        aria-label="About"
      >
        <InfoIcon />
      </button>
    </div>
  );
}
