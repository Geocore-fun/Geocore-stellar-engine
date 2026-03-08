/**
 * Sun control panel.
 */

import { useAppStore } from '@/state';
import type { HexColor } from '@/types';
import { ColorPickerControl, PanelSection, SliderControl, ToggleControl } from '@/ui/components';

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

      {sun.enabled && (
        <>
          <div className="mt-1 mb-1 h-px bg-border" />

          <ColorPickerControl
            label="Color"
            value={sun.color}
            onChange={(color) => setSun({ color: color as HexColor })}
          />

          <SliderControl
            label="Disk Size"
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
            label="Glow"
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
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(limbDarkening) => setSun({ limbDarkening })}
          />

          <div className="mt-1 mb-1 h-px bg-border" />

          {/* Position controls */}
          <div className="pt-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Direction
            </span>
          </div>
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
        </>
      )}
    </PanelSection>
  );
}
