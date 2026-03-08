/**
 * Nebula control panel.
 */

import { useAppStore } from '@/state';
import type { HexColor } from '@/types';
import { ColorPickerControl, PanelSection, SliderControl, ToggleControl } from '@/ui/components';

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

      {nebula.enabled && (
        <>
          <div className="mt-1 mb-1 h-px bg-border" />

          {/* Colors */}
          <ColorPickerControl
            label="Color 1"
            value={nebula.color1}
            onChange={(color1) => setNebula({ color1: color1 as HexColor })}
          />
          <ColorPickerControl
            label="Color 2"
            value={nebula.color2}
            onChange={(color2) => setNebula({ color2: color2 as HexColor })}
          />
          <ColorPickerControl
            label="Color 3"
            value={nebula.color3}
            onChange={(color3) => setNebula({ color3: color3 as HexColor })}
          />

          <div className="mt-1 mb-1 h-px bg-border" />

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
            label="Brightness"
            value={nebula.brightness}
            min={0}
            max={2}
            onChange={(brightness) => setNebula({ brightness })}
          />

          <div className="mt-1 mb-1 h-px bg-border" />

          {/* FBM parameters - advanced */}
          <div className="pt-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Noise
            </span>
          </div>
          <SliderControl
            label="Octaves"
            value={nebula.octaves}
            min={1}
            max={8}
            step={1}
            format={(v) => Math.round(v).toString()}
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
        </>
      )}
    </PanelSection>
  );
}
