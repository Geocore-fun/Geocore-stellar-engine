/**
 * Bloom post-processing control panel.
 */

import { useAppStore } from '@/state';
import { PanelSection, SliderControl, ToggleControl } from '@/ui/components';

export function BloomPanel() {
  const bloom = useAppStore((s) => s.bloom);
  const setBloom = useAppStore((s) => s.setBloom);

  return (
    <PanelSection title="Bloom">
      <ToggleControl
        label="Enabled"
        checked={bloom.enabled}
        onChange={(enabled) => setBloom({ enabled })}
      />

      {bloom.enabled && (
        <>
          <div className="mt-1 mb-1 h-px bg-border" />

          <SliderControl
            label="Threshold"
            value={bloom.threshold}
            min={0}
            max={1}
            step={0.01}
            onChange={(threshold) => setBloom({ threshold })}
          />

          <SliderControl
            label="Soft Knee"
            value={bloom.softKnee}
            min={0}
            max={1}
            step={0.01}
            onChange={(softKnee) => setBloom({ softKnee })}
          />

          <SliderControl
            label="Intensity"
            value={bloom.intensity}
            min={0}
            max={5}
            step={0.05}
            onChange={(intensity) => setBloom({ intensity })}
          />

          <SliderControl
            label="Blur Iterations"
            value={bloom.iterations}
            min={1}
            max={8}
            step={1}
            onChange={(iterations) => setBloom({ iterations })}
          />
        </>
      )}
    </PanelSection>
  );
}
