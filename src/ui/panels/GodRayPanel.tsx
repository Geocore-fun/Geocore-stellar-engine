/**
 * God rays (volumetric light scattering) control panel.
 */

import { useAppStore } from '@/state';
import { PanelSection, SliderControl, ToggleControl } from '@/ui/components';

export function GodRayPanel() {
  const godRays = useAppStore((s) => s.godRays);
  const setGodRays = useAppStore((s) => s.setGodRays);

  return (
    <PanelSection title="God Rays">
      <div className="mb-2 rounded-md bg-yellow-500/10 px-2.5 py-2 text-[11px] leading-relaxed text-yellow-400/90">
        <span className="font-semibold">Preview only —</span> God rays are a screen-space effect
        that cannot wrap across cubemap face boundaries. They will appear on the face containing the
        sun but may show visible seams in exported cubemaps.
      </div>

      <ToggleControl
        label="Enabled"
        checked={godRays.enabled}
        onChange={(enabled) => setGodRays({ enabled })}
      />

      {godRays.enabled && (
        <>
          <div className="mt-1 mb-1 h-px bg-border" />

          <SliderControl
            label="Exposure"
            value={godRays.exposure}
            min={0}
            max={1}
            step={0.01}
            onChange={(exposure) => setGodRays({ exposure })}
          />

          <SliderControl
            label="Decay"
            value={godRays.decay}
            min={0.9}
            max={1.0}
            step={0.001}
            onChange={(decay) => setGodRays({ decay })}
          />

          <SliderControl
            label="Density"
            value={godRays.density}
            min={0.1}
            max={2.0}
            step={0.01}
            onChange={(density) => setGodRays({ density })}
          />

          <SliderControl
            label="Weight"
            value={godRays.weight}
            min={0}
            max={1}
            step={0.01}
            onChange={(weight) => setGodRays({ weight })}
          />
        </>
      )}
    </PanelSection>
  );
}
