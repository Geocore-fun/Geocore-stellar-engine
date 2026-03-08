/**
 * Star field control panel.
 */

import { useAppStore } from '@/state';
import { PanelSection, SliderControl, ToggleControl } from '@/ui/components';

export function StarFieldPanel() {
  const starField = useAppStore((s) => s.starField);
  const setStarField = useAppStore((s) => s.setStarField);

  return (
    <PanelSection title="Star Field">
      <ToggleControl
        label="Enabled"
        checked={starField.enabled}
        onChange={(enabled) => setStarField({ enabled })}
      />
      <SliderControl
        label="Count"
        value={starField.count}
        min={1000}
        max={500000}
        step={1000}
        onChange={(count) => setStarField({ count })}
      />
      <SliderControl
        label="Min Brightness"
        value={starField.minBrightness}
        min={0}
        max={1}
        onChange={(minBrightness) => setStarField({ minBrightness })}
      />
      <SliderControl
        label="Max Brightness"
        value={starField.maxBrightness}
        min={0}
        max={1}
        onChange={(maxBrightness) => setStarField({ maxBrightness })}
      />
      <SliderControl
        label="Min Size"
        value={starField.minSize}
        min={0.1}
        max={5}
        step={0.1}
        onChange={(minSize) => setStarField({ minSize })}
      />
      <SliderControl
        label="Max Size"
        value={starField.maxSize}
        min={0.5}
        max={10}
        step={0.1}
        onChange={(maxSize) => setStarField({ maxSize })}
      />
      <SliderControl
        label="Color Variation"
        value={starField.colorVariation}
        min={0}
        max={1}
        onChange={(colorVariation) => setStarField({ colorVariation })}
      />
    </PanelSection>
  );
}
