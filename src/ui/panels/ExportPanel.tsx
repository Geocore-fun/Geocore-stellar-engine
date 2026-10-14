/**
 * Export panel: format and resolution, the export buttons (including the
 * one-click Geocore export), and batch export.
 */

import { GEOCORE_SKYBOX } from '@/export/geocoreTarget';
import { useAppStore } from '@/state';
import type { ExportFormat } from '@/types';
import { PanelSection, SelectField, type SelectOption } from '@/ui/components';

interface ExportPanelProps {
  onExport: () => void;
  /** Export a cross-layout PNG at Geocore's default size. */
  onExportForGeocore: () => void;
  onShowGeocoreGuide: () => void;
  onBatchExport?: () => void;
}

const FORMAT_OPTIONS: SelectOption<ExportFormat>[] = [
  { value: 'png-individual', label: 'Individual PNGs (ZIP)', hint: 'Unity 6-sided' },
  { value: 'png-cross', label: 'Cross Layout PNG', hint: 'Geocore, Unity' },
  { value: 'hdr', label: 'HDR Radiance (ZIP)' },
];

const RESOLUTION_OPTIONS: SelectOption<number>[] = [
  { value: 512, label: '512 × 512', hint: 'Geocore, smaller file' },
  { value: 1024, label: '1024 × 1024', hint: 'Geocore' },
  { value: 2048, label: '2048 × 2048' },
  { value: 4096, label: '4096 × 4096' },
  { value: 8192, label: '8192 × 8192', hint: 'tiled, slow' },
  { value: 16384, label: '16384 × 16384', hint: 'tiled, slow' },
];

export function ExportPanel({
  onExport,
  onExportForGeocore,
  onShowGeocoreGuide,
  onBatchExport,
}: ExportPanelProps) {
  const exportFormat = useAppStore((s) => s.exportFormat);
  const setExportFormat = useAppStore((s) => s.setExportFormat);
  const exportResolution = useAppStore((s) => s.exportResolution);
  const setExportResolution = useAppStore((s) => s.setExportResolution);
  const isExporting = useAppStore((s) => s.isExporting);
  const exportProgress = useAppStore((s) => s.exportProgress);

  const geocoreTooLarge =
    exportFormat === GEOCORE_SKYBOX.format && exportResolution > GEOCORE_SKYBOX.maxFaceSize;

  return (
    <PanelSection title="Export">
      <SelectField
        label="Format"
        value={exportFormat}
        options={FORMAT_OPTIONS}
        onChange={setExportFormat}
        disabled={isExporting}
      />

      <SelectField
        label="Resolution (per face)"
        value={exportResolution}
        options={RESOLUTION_OPTIONS}
        onChange={setExportResolution}
        disabled={isExporting}
        help={
          geocoreTooLarge
            ? `Geocore refuses faces above ${GEOCORE_SKYBOX.maxFaceSize} px. Fine for Unity.`
            : undefined
        }
      />

      {/* Export button */}
      <button
        type="button"
        onClick={onExport}
        disabled={isExporting}
        aria-busy={isExporting}
        className="focus-ring relative mt-3 w-full overflow-hidden rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50"
        style={{
          boxShadow: isExporting ? 'none' : '0 2px 12px rgba(10, 132, 255, 0.3)',
        }}
      >
        {isExporting && (
          <div
            className="absolute inset-0 bg-accent-dim transition-all"
            style={{ width: `${exportProgress * 100}%` }}
          />
        )}
        <span className="relative">
          {isExporting ? `Exporting… ${Math.round(exportProgress * 100)}%` : 'Export Skybox'}
        </span>
      </button>

      {/* One click for Geocore: right format, right size */}
      <div className="mt-2 flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => onExportForGeocore()}
          disabled={isExporting}
          className="focus-ring flex-1 rounded-lg bg-accent/15 px-3 py-2 text-[12px] font-medium text-accent ring-1 ring-accent/30 transition-all hover:bg-accent/25 active:scale-[0.98] disabled:opacity-50"
          title={`Cross Layout PNG at ${GEOCORE_SKYBOX.resolution} × ${GEOCORE_SKYBOX.resolution}`}
        >
          Export for Geocore
        </button>
        <button
          type="button"
          onClick={onShowGeocoreGuide}
          className="focus-ring rounded-lg bg-white/5 px-3 py-2 text-[12px] text-text-secondary ring-1 ring-white/8 transition-all hover:bg-white/10 hover:text-text-primary"
          title="How to import it in Geocore"
        >
          How?
        </button>
      </div>

      {/* Batch Export — render all presets as individual cubemaps */}
      {onBatchExport && (
        <button
          type="button"
          onClick={onBatchExport}
          disabled={isExporting}
          className="focus-ring mt-2 w-full rounded-lg bg-white/5 px-4 py-2 text-[12px] font-medium text-text-secondary ring-1 ring-white/8 transition-all hover:bg-white/10 hover:text-text-primary active:scale-[0.98] disabled:opacity-50"
        >
          {isExporting ? 'Exporting…' : 'Batch Export All Presets'}
        </button>
      )}
    </PanelSection>
  );
}
