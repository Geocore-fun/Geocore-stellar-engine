/**
 * Nebula control panel.
 */

import { useAppStore } from '@/state';
import type { HexColor } from '@/types';
import { PanelSection, SliderControl, ToggleControl } from '@/ui/components';

export function NebulaPanel() {
  const nebula = useAppStore((s) => s.nebula);
  const setNebula = useAppStore((s) => s.setNebula);

  return (
    <PanelSection title="Nebula">
      <ToggleControl
        label="Enabled"
        checked={nebula.enabled}
        onChange={(enabled) => setNebula({ enabled })}
      />

      {/* Color inputs */}
      <div className="flex flex-col gap-1 py-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-text-secondary">Color 1</label>
          <input
            type="color"
            value={nebula.color1}
            onChange={(e) => setNebula({ color1: e.target.value as HexColor })}
            className="h-5 w-8 cursor-pointer rounded-sm border border-border bg-transparent"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-text-secondary">Color 2</label>
          <input
            type="color"
            value={nebula.color2}
            onChange={(e) => setNebula({ color2: e.target.value as HexColor })}
            className="h-5 w-8 cursor-pointer rounded-sm border border-border bg-transparent"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-text-secondary">Color 3</label>
          <input
            type="color"
            value={nebula.color3}
            onChange={(e) => setNebula({ color3: e.target.value as HexColor })}
            className="h-5 w-8 cursor-pointer rounded-sm border border-border bg-transparent"
          />
        </div>
      </div>

      <SliderControl
        label="Density"
        value={nebula.density}
        min={0}
        max={2}
        onChange={(density) => setNebula({ density })}
      />
      <SliderControl
        label="Falloff"
        value={nebula.falloff}
        min={0.5}
        max={5}
        step={0.1}
        onChange={(falloff) => setNebula({ falloff })}
      />
      <SliderControl
        label="Scale"
        value={nebula.scale}
        min={0.1}
        max={5}
        step={0.1}
        onChange={(scale) => setNebula({ scale })}
      />
      <SliderControl
        label="Octaves"
        value={nebula.octaves}
        min={1}
        max={8}
        step={1}
        onChange={(octaves) => setNebula({ octaves: Math.round(octaves) })}
      />
      <SliderControl
        label="Lacunarity"
        value={nebula.lacunarity}
        min={1}
        max={4}
        step={0.1}
        onChange={(lacunarity) => setNebula({ lacunarity })}
      />
      <SliderControl
        label="Gain"
        value={nebula.gain}
        min={0.1}
        max={1}
        step={0.05}
        onChange={(gain) => setNebula({ gain })}
      />
      <SliderControl
        label="Brightness"
        value={nebula.brightness}
        min={0}
        max={2}
        onChange={(brightness) => setNebula({ brightness })}
      />
    </PanelSection>
  );
}
