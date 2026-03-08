/**
 * Export panel with format selection and download button.
 */

import { useAppStore } from '@/state';
import type { ExportFormat } from '@/types';
import { PanelSection } from '@/ui/components';

interface ExportPanelProps {
  onExport: () => void;
}

export function ExportPanel({ onExport }: ExportPanelProps) {
  const exportFormat = useAppStore((s) => s.exportFormat);
  const setExportFormat = useAppStore((s) => s.setExportFormat);
  const exportResolution = useAppStore((s) => s.exportResolution);
  const setExportResolution = useAppStore((s) => s.setExportResolution);
  const isExporting = useAppStore((s) => s.isExporting);
  const exportProgress = useAppStore((s) => s.exportProgress);

  return (
    <PanelSection title="Export">
      {/* Format */}
      <div className="flex flex-col gap-1 py-1">
        <label className="text-xs text-text-secondary">Format</label>
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
          className="rounded-sm border border-border bg-bg-input px-1.5 py-1 text-xs text-text-primary"
        >
          <option value="png-individual">Individual PNGs (ZIP)</option>
          <option value="png-cross">Cross Layout PNG</option>
        </select>
      </div>

      {/* Resolution */}
      <div className="flex flex-col gap-1 py-1">
        <label className="text-xs text-text-secondary">Export Resolution</label>
        <select
          value={exportResolution}
          onChange={(e) => setExportResolution(parseInt(e.target.value, 10))}
          className="rounded-sm border border-border bg-bg-input px-1.5 py-1 text-xs text-text-primary"
        >
          <option value={512}>512×512</option>
          <option value={1024}>1024×1024</option>
          <option value={2048}>2048×2048</option>
          <option value={4096}>4096×4096</option>
        </select>
      </div>

      {/* Export button */}
      <button
        onClick={onExport}
        disabled={isExporting}
        className="mt-2 w-full rounded-sm bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {isExporting ? `Exporting... ${Math.round(exportProgress * 100)}%` : 'Export Skybox'}
      </button>
    </PanelSection>
  );
}
