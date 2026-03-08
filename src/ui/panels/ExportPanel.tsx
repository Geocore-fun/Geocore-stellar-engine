/**
 * Export panel with format selection, download, and batch export.
 */

import { useAppStore } from '@/state';
import type { ExportFormat } from '@/types';
import { PanelSection } from '@/ui/components';

interface ExportPanelProps {
  onExport: () => void;
  onBatchExport?: () => void;
}

export function ExportPanel({ onExport, onBatchExport }: ExportPanelProps) {
  const exportFormat = useAppStore((s) => s.exportFormat);
  const setExportFormat = useAppStore((s) => s.setExportFormat);
  const exportResolution = useAppStore((s) => s.exportResolution);
  const setExportResolution = useAppStore((s) => s.setExportResolution);
  const isExporting = useAppStore((s) => s.isExporting);
  const exportProgress = useAppStore((s) => s.exportProgress);

  return (
    <PanelSection title="Export">
      {/* Format */}
      <div className="flex flex-col gap-1.5 py-1.5">
        <span className="text-[12px] text-text-label">Format</span>
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
          className="rounded-md bg-white/5 px-2.5 py-1.5 text-[12px] text-text-primary ring-1 ring-white/8 transition-all focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="png-individual">Individual PNGs (ZIP)</option>
          <option value="png-cross">Cross Layout PNG</option>
          <option value="hdr">HDR Radiance (ZIP)</option>
        </select>
      </div>

      {/* Resolution */}
      <div className="flex flex-col gap-1.5 py-1.5">
        <span className="text-[12px] text-text-label">Resolution</span>
        <select
          value={exportResolution}
          onChange={(e) => setExportResolution(parseInt(e.target.value, 10))}
          className="rounded-md bg-white/5 px-2.5 py-1.5 text-[12px] text-text-primary ring-1 ring-white/8 transition-all focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value={512}>512 × 512</option>
          <option value={1024}>1024 × 1024</option>
          <option value={2048}>2048 × 2048</option>
          <option value={4096}>4096 × 4096</option>
          <option value={8192}>8192 × 8192 (tiled)</option>
          <option value={16384}>16384 × 16384 (tiled)</option>
        </select>
      </div>

      {/* Export button */}
      <button
        onClick={onExport}
        disabled={isExporting}
        className="relative mt-3 w-full overflow-hidden rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50"
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

      {/* Batch Export — render all presets as individual cubemaps */}
      {onBatchExport && (
        <button
          onClick={onBatchExport}
          disabled={isExporting}
          className="mt-2 w-full rounded-lg bg-white/5 px-4 py-2 text-[12px] font-medium text-text-secondary ring-1 ring-white/8 transition-all hover:bg-white/10 hover:text-text-primary active:scale-[0.98] disabled:opacity-50"
        >
          {isExporting ? 'Exporting…' : 'Batch Export All Presets'}
        </button>
      )}
    </PanelSection>
  );
}
