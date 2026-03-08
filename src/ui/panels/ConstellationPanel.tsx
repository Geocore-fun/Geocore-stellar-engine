/**
 * Constellation control panel — toggle and style constellation stick figure lines.
 */

import { useAppStore } from '@/state';
import { ColorPickerControl, PanelSection, SliderControl, ToggleControl } from '@/ui/components';

export function ConstellationPanel() {
  const constellations = useAppStore((s) => s.constellations);
  const setConstellations = useAppStore((s) => s.setConstellations);

  return (
    <PanelSection title="Constellations">
      <ToggleControl
        label="Enabled"
        checked={constellations.enabled}
        onChange={(enabled) => setConstellations({ enabled })}
      />

      {constellations.enabled && (
        <>
          <div className="mt-1 mb-1 h-px bg-border" />

          <SliderControl
            label="Opacity"
            value={constellations.opacity}
            min={0.05}
            max={1.0}
            step={0.05}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(opacity) => setConstellations({ opacity })}
          />

          <ColorPickerControl
            label="Line Color"
            value={constellations.lineColor}
            onChange={(lineColor) => setConstellations({ lineColor })}
          />

          <SliderControl
            label="Line Width"
            value={constellations.lineWidth}
            min={0.5}
            max={3.0}
            step={0.25}
            format={(v) => `${v.toFixed(1)}px`}
            onChange={(lineWidth) => setConstellations({ lineWidth })}
          />

          <div className="text-xs text-muted mt-[-2px] mb-1 px-1 opacity-70">
            Note: line width may be clamped to 1px on some GPUs.
          </div>
        </>
      )}
    </PanelSection>
  );
}
