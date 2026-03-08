/**
 * Milky Way control panel — adjust the procedural Milky Way band appearance.
 */

import { useAppStore } from '@/state';
import { ColorPickerControl, PanelSection, SliderControl, ToggleControl } from '@/ui/components';

export function MilkyWayPanel() {
  const milkyWay = useAppStore((s) => s.milkyWay);
  const setMilkyWay = useAppStore((s) => s.setMilkyWay);

  return (
    <PanelSection title="Milky Way">
      <ToggleControl
        label="Enabled"
        checked={milkyWay.enabled}
        onChange={(enabled) => setMilkyWay({ enabled })}
      />

      {milkyWay.enabled && (
        <>
          <div className="mt-1 mb-1 h-px bg-border" />

          <SliderControl
            label="Brightness"
            value={milkyWay.brightness}
            min={0.1}
            max={2.0}
            step={0.05}
            format={(v) => v.toFixed(2)}
            onChange={(brightness) => setMilkyWay({ brightness })}
          />

          <SliderControl
            label="Density"
            value={milkyWay.density}
            min={0.1}
            max={3.0}
            step={0.1}
            format={(v) => v.toFixed(1)}
            onChange={(density) => setMilkyWay({ density })}
          />

          <SliderControl
            label="Band Width"
            value={milkyWay.width}
            min={1.0}
            max={10.0}
            step={0.5}
            format={(v) => v.toFixed(1)}
            onChange={(width) => setMilkyWay({ width })}
          />

          <SliderControl
            label="Scale"
            value={milkyWay.scale}
            min={0.5}
            max={5.0}
            step={0.1}
            format={(v) => v.toFixed(1)}
            onChange={(scale) => setMilkyWay({ scale })}
          />

          <div className="mt-1 mb-1 h-px bg-border" />

          <ColorPickerControl
            label="Core Color"
            value={milkyWay.coreColor}
            onChange={(coreColor) => setMilkyWay({ coreColor })}
          />

          <ColorPickerControl
            label="Edge Color"
            value={milkyWay.edgeColor}
            onChange={(edgeColor) => setMilkyWay({ edgeColor })}
          />

          <div className="mt-1 mb-1 h-px bg-border" />

          <SliderControl
            label="Core Brightness"
            value={milkyWay.coreBrightness}
            min={0}
            max={1.0}
            step={0.05}
            format={(v) => v.toFixed(2)}
            onChange={(coreBrightness) => setMilkyWay({ coreBrightness })}
          />

          <SliderControl
            label="Core Size"
            value={milkyWay.coreSize}
            min={0.1}
            max={2.0}
            step={0.1}
            format={(v) => v.toFixed(1)}
            onChange={(coreSize) => setMilkyWay({ coreSize })}
          />

          <div className="mt-1 mb-1 h-px bg-border" />

          <SliderControl
            label="Tilt"
            value={milkyWay.tilt}
            min={0}
            max={90}
            step={1}
            format={(v) => `${v.toFixed(0)}°`}
            onChange={(tilt) => setMilkyWay({ tilt })}
          />

          <SliderControl
            label="Rotation"
            value={milkyWay.rotation}
            min={-180}
            max={180}
            step={1}
            format={(v) => `${v.toFixed(0)}°`}
            onChange={(rotation) => setMilkyWay({ rotation })}
          />

          <div className="mt-1 mb-1 h-px bg-border" />

          <SliderControl
            label="Octaves"
            value={milkyWay.octaves}
            min={1}
            max={8}
            step={1}
            format={(v) => v.toString()}
            onChange={(octaves) => setMilkyWay({ octaves })}
          />

          <SliderControl
            label="Lacunarity"
            value={milkyWay.lacunarity}
            min={1.0}
            max={4.0}
            step={0.1}
            format={(v) => v.toFixed(1)}
            onChange={(lacunarity) => setMilkyWay({ lacunarity })}
          />

          <SliderControl
            label="Gain"
            value={milkyWay.gain}
            min={0.1}
            max={0.9}
            step={0.05}
            format={(v) => v.toFixed(2)}
            onChange={(gain) => setMilkyWay({ gain })}
          />
        </>
      )}
    </PanelSection>
  );
}
