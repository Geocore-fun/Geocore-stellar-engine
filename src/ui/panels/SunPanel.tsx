/**
 * Sun control panel.
 */

import { useAppStore } from '@/state';
import type { HexColor } from '@/types';
import { PanelSection, SliderControl, ToggleControl } from '@/ui/components';

export function SunPanel() {
  const sun = useAppStore((s) => s.sun);
  const setSun = useAppStore((s) => s.setSun);

  return (
    <PanelSection title="Sun">
      <ToggleControl
        label="Enabled"
        checked={sun.enabled}
        onChange={(enabled) => setSun({ enabled })}
      />

      {/* Sun color */}
      <div className="flex items-center justify-between py-1">
        <label className="text-xs text-text-secondary">Color</label>
        <input
          type="color"
          value={sun.color}
          onChange={(e) => setSun({ color: e.target.value as HexColor })}
          className="h-5 w-8 cursor-pointer rounded-sm border border-border bg-transparent"
        />
      </div>

      <SliderControl
        label="Size"
        value={sun.size}
        min={0.001}
        max={0.1}
        step={0.001}
        onChange={(size) => setSun({ size })}
      />
      <SliderControl
        label="Corona Size"
        value={sun.coronaSize}
        min={0.01}
        max={0.3}
        step={0.005}
        onChange={(coronaSize) => setSun({ coronaSize })}
      />
      <SliderControl
        label="Corona Intensity"
        value={sun.coronaIntensity}
        min={0}
        max={2}
        onChange={(coronaIntensity) => setSun({ coronaIntensity })}
      />
      <SliderControl
        label="Glow Intensity"
        value={sun.glowIntensity}
        min={0}
        max={1}
        onChange={(glowIntensity) => setSun({ glowIntensity })}
      />
      <SliderControl
        label="Limb Darkening"
        value={sun.limbDarkening}
        min={0}
        max={1}
        onChange={(limbDarkening) => setSun({ limbDarkening })}
      />

      {/* Position controls */}
      <div className="mt-2 border-t border-border pt-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Position
        </label>
        <SliderControl
          label="X"
          value={sun.position[0]}
          min={-1}
          max={1}
          onChange={(x) => setSun({ position: [x, sun.position[1], sun.position[2]] })}
        />
        <SliderControl
          label="Y"
          value={sun.position[1]}
          min={-1}
          max={1}
          onChange={(y) => setSun({ position: [sun.position[0], y, sun.position[2]] })}
        />
        <SliderControl
          label="Z"
          value={sun.position[2]}
          min={-1}
          max={1}
          onChange={(z) => setSun({ position: [sun.position[0], sun.position[1], z] })}
        />
      </div>
    </PanelSection>
  );
}
