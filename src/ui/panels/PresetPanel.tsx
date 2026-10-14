/**
 * Preset management panel — load, save, import/export, delete presets.
 */

import { useCallback, useRef, useState } from 'react';

import {
  type Preset,
  type PresetData,
  applyPresetData,
  BUILT_IN_PRESETS,
  deleteUserPreset,
  exportPresetAsJson,
  getAllPresets,
  importPresetFromJson,
  saveAsPreset,
} from '@/presets';
import { selectSceneParams, useAppStore } from '@/state';
import { PanelSection } from '@/ui/components';

export function PresetPanel() {
  const [presets, setPresets] = useState<Preset[]>(() => getAllPresets());
  const [saveName, setSaveName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Grab the current generator state as PresetData. */
  const getCurrentData = useCallback(
    (): PresetData => structuredClone(selectSceneParams(useAppStore.getState())),
    [],
  );

  /** Apply a preset's data to the current state. */
  const applyPreset = useCallback((data: PresetData) => applyPresetData(data), []);

  /** Reset everything to factory defaults. */
  const handleResetAll = useCallback(() => {
    useAppStore.getState().resetToDefaults();
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
        {presets.map((preset) => {
          const hotkey = preset.builtIn ? BUILT_IN_PRESETS.indexOf(preset) + 1 : 0;
          const hasHotkey = hotkey >= 1 && hotkey <= 9;
          return (
            <div
              key={preset.id}
              className="group flex items-start gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
            >
              <button
                type="button"
                onClick={() => applyPreset(preset.data)}
                className="focus-ring flex-1 rounded text-left"
                title={`Load "${preset.name}"${hasHotkey ? ` (key ${hotkey})` : ''}`}
                aria-keyshortcuts={hasHotkey ? String(hotkey) : undefined}
              >
                <span className="flex items-center gap-2 text-[12px] text-text-primary transition-colors group-hover:text-white">
                  {preset.name}
                  {hasHotkey && (
                    <kbd className="rounded bg-white/5 px-1 font-mono text-[10px] text-text-muted ring-1 ring-white/8">
                      {hotkey}
                    </kbd>
                  )}
                </span>
                {preset.description && (
                  <span className="mt-0.5 block text-[11px] leading-snug text-text-muted">
                    {preset.description}
                  </span>
                )}
              </button>

              {/* Export button */}
              <button
                type="button"
                onClick={() => handleExport(preset)}
                className="focus-ring flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] opacity-0 transition-opacity group-hover:opacity-60 hover:opacity-100! focus-visible:opacity-100"
                title="Export as JSON"
                aria-label={`Export "${preset.name}" as JSON`}
              >
                ↓
              </button>

              {/* Delete button (user presets only) */}
              {!preset.builtIn && (
                <button
                  type="button"
                  onClick={() => handleDelete(preset.id)}
                  className="focus-ring flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] text-red-400 opacity-0 transition-opacity group-hover:opacity-60 hover:opacity-100! focus-visible:opacity-100"
                  title="Delete preset"
                  aria-label={`Delete "${preset.name}"`}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
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

        {/* Divider */}
        <div className="my-1 h-px bg-border" />

        {/* Reset All */}
        <button
          onClick={handleResetAll}
          className="w-full rounded-md bg-red-500/10 px-3 py-1.5 text-[12px] text-red-400 ring-1 ring-red-500/20 transition-all hover:bg-red-500/20 hover:ring-red-500/30 active:scale-95"
        >
          Reset All to Defaults
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
