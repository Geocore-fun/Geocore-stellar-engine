/**
 * Lens flare control panel.
 */

import { useAppStore } from '@/state';
import { PanelSection, SliderControl, ToggleControl } from '@/ui/components';

export function LensFlarePanel() {
  const lensFlare = useAppStore((s) => s.lensFlare);
  const setLensFlare = useAppStore((s) => s.setLensFlare);

  return (
    <PanelSection title="Lens Flare">
      <ToggleControl
        label="Enabled"
        checked={lensFlare.enabled}
        onChange={(enabled) => setLensFlare({ enabled })}
      />

      {lensFlare.enabled && (
        <>
          <div className="mt-1 mb-1 h-px bg-border" />

          <SliderControl
            label="Intensity"
            value={lensFlare.intensity}
            min={0}
            max={2}
            step={0.01}
            onChange={(intensity) => setLensFlare({ intensity })}
          />

          <SliderControl
            label="Ghosts"
            value={lensFlare.ghostCount}
            min={1}
            max={8}
            step={1}
            onChange={(ghostCount) => setLensFlare({ ghostCount })}
          />

          <SliderControl
            label="Ghost Spacing"
            value={lensFlare.ghostSpacing}
            min={0.1}
            max={1.0}
            step={0.01}
            onChange={(ghostSpacing) => setLensFlare({ ghostSpacing })}
          />

          <SliderControl
            label="Halo Radius"
            value={lensFlare.haloRadius}
            min={0.1}
            max={0.8}
            step={0.01}
            onChange={(haloRadius) => setLensFlare({ haloRadius })}
          />

          <SliderControl
            label="Halo Brightness"
            value={lensFlare.haloIntensity}
            min={0}
            max={1}
            step={0.01}
            onChange={(haloIntensity) => setLensFlare({ haloIntensity })}
          />

          <SliderControl
            label="Chromatic Aberration"
            value={lensFlare.chromaticAberration}
            min={0}
            max={1}
            step={0.01}
            onChange={(chromaticAberration) => setLensFlare({ chromaticAberration })}
          />
        </>
      )}
    </PanelSection>
  );
}
