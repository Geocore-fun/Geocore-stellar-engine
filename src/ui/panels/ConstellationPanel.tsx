/**
 * Constellation control panel — toggle and style constellation stick figure lines.
 * Includes per-constellation toggle with search filtering.
 */

import { CONSTELLATIONS } from '@/data/constellationData';
import { useAppStore } from '@/state';
import { ColorPickerControl, PanelSection, SliderControl, ToggleControl } from '@/ui/components';
import { useCallback, useMemo, useState } from 'react';

/** All 88 abbreviations for "select all" */
const ALL_ABBRS = CONSTELLATIONS.map((c) => c.abbr);

export function ConstellationPanel() {
  const constellations = useAppStore((s) => s.constellations);
  const setConstellations = useAppStore((s) => s.setConstellations);
  const constellationBoundaries = useAppStore((s) => s.constellationBoundaries);
  const setConstellationBoundaries = useAppStore((s) => s.setConstellationBoundaries);

  const [search, setSearch] = useState('');
  const [showList, setShowList] = useState(false);

  // Compute visible set — empty array means "all visible"
  const visibleSet = useMemo(
    () => new Set(constellations.visibleConstellations),
    [constellations.visibleConstellations],
  );
  const isAllVisible = constellations.visibleConstellations.length === 0;

  // Filter constellations by search
  const filtered = useMemo(() => {
    if (!search.trim()) return CONSTELLATIONS;
    const q = search.toLowerCase();
    return CONSTELLATIONS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.abbr.toLowerCase().includes(q),
    );
  }, [search]);

  const toggleConstellation = useCallback(
    (abbr: string) => {
      if (isAllVisible) {
        // Switching from "all" to explicit — remove this one
        const newVisible = ALL_ABBRS.filter((a) => a !== abbr);
        setConstellations({ visibleConstellations: newVisible });
      } else if (visibleSet.has(abbr)) {
        const newVisible = constellations.visibleConstellations.filter((a) => a !== abbr);
        setConstellations({ visibleConstellations: newVisible });
      } else {
        const newVisible = [...constellations.visibleConstellations, abbr];
        // If all are now selected, reset to empty (= all visible)
        if (newVisible.length >= ALL_ABBRS.length) {
          setConstellations({ visibleConstellations: [] });
        } else {
          setConstellations({ visibleConstellations: newVisible });
        }
      }
    },
    [isAllVisible, visibleSet, constellations.visibleConstellations, setConstellations],
  );

  const selectAll = useCallback(() => {
    setConstellations({ visibleConstellations: [] });
  }, [setConstellations]);

  const selectNone = useCallback(() => {
    setConstellations({ visibleConstellations: ['__none__'] }); // empty-visible sentinel
  }, [setConstellations]);

  const isChecked = useCallback(
    (abbr: string) => isAllVisible || visibleSet.has(abbr),
    [isAllVisible, visibleSet],
  );

  const visibleCount = isAllVisible
    ? ALL_ABBRS.length
    : constellations.visibleConstellations.filter((a) => a !== '__none__').length;

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

          <div className="text-xs text-muted -mt-0.5 mb-1 px-1 opacity-70">
            Note: line width may be clamped to 1px on some GPUs.
          </div>

          <div className="mt-1 mb-1 h-px bg-border" />

          {/* Label controls */}
          <ToggleControl
            label="Show Labels"
            checked={constellations.showLabels}
            onChange={(showLabels) => setConstellations({ showLabels })}
          />

          {constellations.showLabels && (
            <>
              <SliderControl
                label="Label Opacity"
                value={constellations.labelOpacity}
                min={0.1}
                max={1.0}
                step={0.05}
                format={(v) => `${Math.round(v * 100)}%`}
                onChange={(labelOpacity) => setConstellations({ labelOpacity })}
              />

              <ColorPickerControl
                label="Label Color"
                value={constellations.labelColor}
                onChange={(labelColor) => setConstellations({ labelColor })}
              />

              <SliderControl
                label="Label Size"
                value={constellations.labelScale}
                min={0.3}
                max={3.0}
                step={0.1}
                format={(v) => `${v.toFixed(1)}×`}
                onChange={(labelScale) => setConstellations({ labelScale })}
              />
            </>
          )}

          <div className="mt-1 mb-1 h-px bg-border" />

          {/* Boundary controls */}
          <ToggleControl
            label="Show Boundaries"
            checked={constellationBoundaries.enabled}
            onChange={(enabled) => setConstellationBoundaries({ enabled })}
          />

          {constellationBoundaries.enabled && (
            <>
              <SliderControl
                label="Boundary Opacity"
                value={constellationBoundaries.opacity}
                min={0.05}
                max={1.0}
                step={0.05}
                format={(v) => `${Math.round(v * 100)}%`}
                onChange={(opacity) => setConstellationBoundaries({ opacity })}
              />

              <ColorPickerControl
                label="Boundary Color"
                value={constellationBoundaries.lineColor}
                onChange={(lineColor) => setConstellationBoundaries({ lineColor })}
              />

              <SliderControl
                label="Dash Length"
                value={constellationBoundaries.dashLength}
                min={0.02}
                max={0.2}
                step={0.01}
                format={(v) => v.toFixed(2)}
                onChange={(dashLength) => setConstellationBoundaries({ dashLength })}
              />

              <SliderControl
                label="Dash Ratio"
                value={constellationBoundaries.dashRatio}
                min={0.1}
                max={0.9}
                step={0.05}
                format={(v) => `${Math.round(v * 100)}%`}
                onChange={(dashRatio) => setConstellationBoundaries({ dashRatio })}
              />
            </>
          )}

          <div className="mt-1 mb-1 h-px bg-border" />

          {/* Per-constellation toggle section */}
          <button
            onClick={() => setShowList(!showList)}
            className="flex w-full items-center justify-between py-1.5 text-[12px]"
          >
            <span className="text-text-label">
              Visible Constellations <span className="text-text-muted">({visibleCount}/88)</span>
            </span>
            <span
              className="text-text-muted transition-transform duration-200"
              style={{ transform: showList ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              ▸
            </span>
          </button>

          {showList && (
            <div className="flex flex-col gap-1.5">
              {/* Search input */}
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search constellations..."
                className="w-full rounded-md bg-bg-input px-2.5 py-1.5 text-[12px] text-text-primary placeholder:text-text-muted ring-1 ring-white/8 transition-all focus:outline-none focus:ring-1 focus:ring-accent"
              />

              {/* Bulk actions */}
              <div className="flex gap-2 text-[11px]">
                <button
                  onClick={selectAll}
                  className="text-accent hover:text-accent-hover transition-colors"
                >
                  Select All
                </button>
                <span className="text-text-muted">·</span>
                <button
                  onClick={selectNone}
                  className="text-accent hover:text-accent-hover transition-colors"
                >
                  Select None
                </button>
              </div>

              {/* Scrollable constellation list */}
              <div className="max-h-52 overflow-y-auto rounded-md bg-bg-input/50 ring-1 ring-white/5">
                {filtered.map((c) => (
                  <label
                    key={c.abbr}
                    className="flex cursor-pointer items-center gap-2 px-2.5 py-1 text-[11px] hover:bg-bg-hover transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked(c.abbr)}
                      onChange={() => toggleConstellation(c.abbr)}
                      className="h-3 w-3 rounded border-white/20 accent-accent"
                    />
                    <span className="font-mono text-text-muted w-8">{c.abbr}</span>
                    <span className="text-text-secondary truncate">{c.name}</span>
                  </label>
                ))}
                {filtered.length === 0 && (
                  <div className="px-2.5 py-2 text-[11px] text-text-muted">
                    No constellations match "{search}"
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </PanelSection>
  );
}
