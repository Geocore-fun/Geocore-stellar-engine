/**
 * Catalog star control panel — controls for the real HYG star overlay.
 */

import { useAppStore } from '@/state';
import { PanelSection, SliderControl, ToggleControl } from '@/ui/components';

export function CatalogStarPanel() {
  const catalogStars = useAppStore((s) => s.catalogStars);
  const setCatalogStars = useAppStore((s) => s.setCatalogStars);

  return (
    <PanelSection title="Catalog Stars (HYG)">
      <ToggleControl
        label="Enabled"
        checked={catalogStars.enabled}
        onChange={(enabled) => setCatalogStars({ enabled })}
      />

      {catalogStars.enabled && (
        <>
          <div className="mt-1 mb-1 h-px bg-border" />

          <SliderControl
            label="Magnitude Limit"
            value={catalogStars.magnitudeLimit}
            min={1.0}
            max={7.0}
            step={0.1}
            format={(v) => v.toFixed(1)}
            onChange={(magnitudeLimit) => setCatalogStars({ magnitudeLimit })}
          />

          <div className="text-xs text-muted mt-[-4px] mb-1 px-1 opacity-70">
            Lower = fewer, brighter stars. 6.5 ≈ naked eye limit.
          </div>

          <SliderControl
            label="Brightness"
            value={catalogStars.brightness}
            min={0.1}
            max={3.0}
            step={0.05}
            format={(v) => v.toFixed(2)}
            onChange={(brightness) => setCatalogStars({ brightness })}
          />

          <SliderControl
            label="Size Scale"
            value={catalogStars.sizeScale}
            min={0.2}
            max={3.0}
            step={0.05}
            format={(v) => `${v.toFixed(2)}×`}
            onChange={(sizeScale) => setCatalogStars({ sizeScale })}
          />

          <div className="mt-1 mb-1 h-px bg-border" />

          <label className="flex items-center justify-between gap-2 px-1 py-0.5 text-xs">
            <span className="text-foreground/80">Blend Mode</span>
            <select
              value={catalogStars.blendMode}
              onChange={(e) =>
                setCatalogStars({
                  blendMode: e.target.value as 'overlay' | 'replace',
                })
              }
              className="glass-select text-xs px-1.5 py-0.5 rounded"
            >
              <option value="overlay">Overlay</option>
              <option value="replace">Replace</option>
            </select>
          </label>

          <div className="text-xs text-muted mt-[-2px] mb-1 px-1 opacity-70">
            Overlay: adds to procedural stars. Replace: hides them.
          </div>
        </>
      )}
    </PanelSection>
  );
}
