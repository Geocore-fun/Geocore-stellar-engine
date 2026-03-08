/**
 * Catalog star control panel — controls for the real HYG star overlay.
 */

import { useAppStore } from '@/state';
import { ColorPickerControl, PanelSection, SliderControl, ToggleControl } from '@/ui/components';

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

          <div className="text-xs text-muted -mt-1 mb-1 px-1 opacity-70">
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

          <div className="text-xs text-muted -mt-0.5 mb-1 px-1 opacity-70">
            Overlay: adds to procedural stars. Replace: hides them.
          </div>

          <div className="mt-1 mb-1 h-px bg-border" />

          {/* Named Star Labels */}
          <ToggleControl
            label="Star Labels"
            checked={catalogStars.showLabels}
            onChange={(showLabels) => setCatalogStars({ showLabels })}
          />

          {catalogStars.showLabels && (
            <>
              <SliderControl
                label="Label Mag Limit"
                value={catalogStars.labelMagnitudeLimit}
                min={0.0}
                max={5.0}
                step={0.1}
                format={(v) => v.toFixed(1)}
                onChange={(labelMagnitudeLimit) => setCatalogStars({ labelMagnitudeLimit })}
              />

              <div className="text-xs text-muted -mt-1 mb-1 px-1 opacity-70">
                Stars brighter than this magnitude get labels.
              </div>

              <SliderControl
                label="Label Opacity"
                value={catalogStars.labelOpacity}
                min={0.1}
                max={1.0}
                step={0.05}
                format={(v) => `${Math.round(v * 100)}%`}
                onChange={(labelOpacity) => setCatalogStars({ labelOpacity })}
              />

              <ColorPickerControl
                label="Label Color"
                value={catalogStars.labelColor}
                onChange={(labelColor) => setCatalogStars({ labelColor })}
              />

              <SliderControl
                label="Label Size"
                value={catalogStars.labelScale}
                min={0.3}
                max={2.0}
                step={0.1}
                format={(v) => `${v.toFixed(1)}×`}
                onChange={(labelScale) => setCatalogStars({ labelScale })}
              />
            </>
          )}

          <div className="mt-1 mb-1 h-px bg-border" />

          {/* Diffraction Spikes */}
          <ToggleControl
            label="Diffraction Spikes"
            checked={catalogStars.spikesEnabled}
            onChange={(spikesEnabled) => setCatalogStars({ spikesEnabled })}
          />

          {catalogStars.spikesEnabled && (
            <>
              <SliderControl
                label="Spike Length"
                value={catalogStars.spikeLength}
                min={0.1}
                max={0.5}
                step={0.01}
                onChange={(spikeLength) => setCatalogStars({ spikeLength })}
              />

              <SliderControl
                label="Spike Brightness"
                value={catalogStars.spikeBrightness}
                min={0}
                max={2}
                step={0.05}
                onChange={(spikeBrightness) => setCatalogStars({ spikeBrightness })}
              />

              <SliderControl
                label="Spike Rotation"
                value={catalogStars.spikeRotation}
                min={0}
                max={90}
                step={1}
                format={(v) => `${v}°`}
                onChange={(spikeRotation) => setCatalogStars({ spikeRotation })}
              />

              <SliderControl
                label="Min Size Threshold"
                value={catalogStars.spikeThreshold}
                min={1}
                max={6}
                step={0.5}
                onChange={(spikeThreshold) => setCatalogStars({ spikeThreshold })}
              />
            </>
          )}

          <div className="mt-1 mb-1 h-px bg-border" />

          {/* Star Twinkle */}
          <ToggleControl
            label="Twinkle"
            checked={catalogStars.twinkleEnabled}
            onChange={(twinkleEnabled) => setCatalogStars({ twinkleEnabled })}
          />

          {catalogStars.twinkleEnabled && (
            <SliderControl
              label="Twinkle Amount"
              value={catalogStars.twinkleAmount}
              min={0}
              max={1}
              step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(twinkleAmount) => setCatalogStars({ twinkleAmount })}
            />
          )}
        </>
      )}
    </PanelSection>
  );
}
