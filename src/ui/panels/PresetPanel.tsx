/**
 * Preset management panel — load, save, import/export, delete presets.
 */

import { useCallback, useRef, useState } from 'react';

import {
  type Preset,
  type PresetData,
  deleteUserPreset,
  exportPresetAsJson,
  getAllPresets,
  importPresetFromJson,
  saveAsPreset,
} from '@/presets';
import { useAppStore } from '@/state';
import { PanelSection } from '@/ui/components';

export function PresetPanel() {
  const [presets, setPresets] = useState<Preset[]>(() => getAllPresets());
  const [saveName, setSaveName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Grab the current generator state as PresetData. */
  const getCurrentData = useCallback((): PresetData => {
    const s = useAppStore.getState();
    return {
      seed: s.seed,
      faceSize: s.faceSize,
      backgroundColor: s.backgroundColor,
      starField: { ...s.starField },
      nebula: { ...s.nebula },
      sun: { ...s.sun },
    };
  }, []);

  /** Apply a preset's data to the current state. */
  const applyPreset = useCallback((data: PresetData) => {
    const s = useAppStore.getState();
    s.setSeed(data.seed);
    s.setFaceSize(data.faceSize);
    s.setBackgroundColor(data.backgroundColor);
    s.setStarField(data.starField);
    s.setNebula(data.nebula);
    s.setSun(data.sun);
  }, []);

  const handleSave = useCallback(() => {
    const name = saveName.trim();
    if (!name) return;
    saveAsPreset(name, getCurrentData());
    setSaveName('');
    setShowSave(false);
    setPresets(getAllPresets());
  }, [saveName, getCurrentData]);

  const handleDelete = useCallback((id: string) => {
    deleteUserPreset(id);
    setPresets(getAllPresets());
  }, []);

  const handleExport = useCallback((preset: Preset) => {
    exportPresetAsJson(preset);
  }, []);

  const handleImport = useCallback(
    async (file: File) => {
      const preset = await importPresetFromJson(file);
      if (preset) {
        applyPreset(preset.data);
        // Also save it to user presets
        saveAsPreset(preset.name, preset.data);
        setPresets(getAllPresets());
      }
    },
    [applyPreset],
  );

  return (
    <PanelSection title="Presets">
      {/* Preset list */}
      <div className="flex flex-col gap-1 py-1">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
          >
            <button
              onClick={() => applyPreset(preset.data)}
              className="flex-1 text-left text-[12px] text-text-primary transition-colors hover:text-white"
              title={`Load "${preset.name}"`}
            >
              {preset.name}
            </button>

            {/* Export button */}
            <button
              onClick={() => handleExport(preset)}
              className="flex h-5 w-5 items-center justify-center rounded text-[10px] opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100"
              title="Export as JSON"
            >
              ↓
            </button>

            {/* Delete button (user presets only) */}
            {!preset.builtIn && (
              <button
                onClick={() => handleDelete(preset.id)}
                className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-red-400 opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100"
                title="Delete preset"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="my-1 h-px bg-border" />

      {/* Action buttons */}
      <div className="flex flex-col gap-1.5 py-1">
        {/* Save */}
        {showSave ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Preset name…"
              autoFocus
              className="flex-1 rounded-md bg-white/5 px-2 py-1.5 text-[12px] text-text-primary ring-1 ring-white/8 placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={handleSave}
              className="rounded-md bg-accent px-2.5 py-1.5 text-[11px] font-medium text-white transition-all hover:bg-accent-hover active:scale-95"
            >
              Save
            </button>
            <button
              onClick={() => setShowSave(false)}
              className="rounded-md px-1.5 py-1.5 text-[11px] text-text-muted transition-colors hover:text-text-primary"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSave(true)}
            className="w-full rounded-md bg-white/5 px-3 py-1.5 text-[12px] text-text-primary ring-1 ring-white/8 transition-all hover:bg-white/10 hover:ring-white/15 active:scale-95"
          >
            Save Current as Preset
          </button>
        )}

        {/* Import */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-md bg-white/5 px-3 py-1.5 text-[12px] text-text-primary ring-1 ring-white/8 transition-all hover:bg-white/10 hover:ring-white/15 active:scale-95"
        >
          Import from JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.skybox.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
            e.target.value = '';
          }}
        />
      </div>
    </PanelSection>
  );
}
