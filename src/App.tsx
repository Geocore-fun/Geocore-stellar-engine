/**
 * Root application component.
 *
 * Composes the layout and wires the UI to the render pipeline. The pipeline's
 * lifecycle and frame scheduling live in useSkyboxRenderer; this component only
 * owns exports and which dialogs are open. It deliberately does not subscribe
 * to scene parameters, so dragging a slider re-renders the panel that owns it,
 * not the whole app.
 */

import {
  batchExport,
  downloadBlob,
  exportSkybox,
  formatMiB,
  GEOCORE_SKYBOX,
  restoreFromAppState,
  type ExportResult,
} from '@/export';
import { useKeyboardShortcuts, useSkyboxRenderer } from '@/hooks';
import { getAllPresets } from '@/presets';
import { selectSceneParams, useAppStore, useToastStore } from '@/state';
import type { ExportFormat } from '@/types';
import {
  AboutModal,
  ComparisonOverlay,
  ErrorBoundary,
  GeocoreGuide,
  GeocoreTip,
  HistogramOverlay,
  PerfOverlay,
  ToastOverlay,
  Toolbar,
  Viewport,
} from '@/ui/components';
import type { ComparisonOverlayHandle } from '@/ui/components/ComparisonOverlay';
import { AppLayout } from '@/ui/layout';
import {
  BackgroundPanel,
  BloomPanel,
  CatalogStarPanel,
  ConstellationPanel,
  ExportPanel,
  GodRayPanel,
  LensFlarePanel,
  MilkyWayPanel,
  NebulaPanel,
  PresetPanel,
  StarFieldPanel,
  SunPanel,
} from '@/ui/panels';
import { useCallback, useRef, useState } from 'react';

function App() {
  useKeyboardShortcuts();

  const {
    setCanvas,
    notifyResize,
    pipelineRef,
    status,
    pendingLoads,
    maxCubeMapSize,
    histogramData,
    setHistogramVisible,
    suspend,
    resumeAndRedraw,
  } = useSkyboxRenderer();

  // Dialogs are rendered at root level to avoid stacking context issues
  const [showAbout, setShowAbout] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [canvasDims, setCanvasDims] = useState({ w: 0, h: 0 });

  // A/B comparison state
  const [isComparing, setIsComparing] = useState(false);
  const comparisonRef = useRef<ComparisonOverlayHandle>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleCanvasReady = useCallback(
    (canvas: HTMLCanvasElement) => {
      canvasRef.current = canvas;
      setCanvasDims({ w: canvas.width, h: canvas.height });
      setCanvas(canvas);
    },
    [setCanvas],
  );

  const handleResize = useCallback(
    (w: number, h: number) => {
      setCanvasDims({ w, h });
      notifyResize();
    },
    [notifyResize],
  );

  // Capture current canvas as data URL (for A/B comparison)
  const handleCapture = useCallback((): string | null => {
    return canvasRef.current?.toDataURL('image/png') ?? null;
  }, []);

  const handleCompareToggle = useCallback(() => {
    comparisonRef.current?.toggle();
  }, []);

  /**
   * Render, encode and download one export. Returns null if it could not run
   * or failed (failure is already reported to the user).
   */
  const runExport = useCallback(
    async (format: ExportFormat, resolution: number): Promise<ExportResult | null> => {
      const pipeline = pipelineRef.current;
      const { isExporting, setIsExporting, setExportProgress } = useAppStore.getState();
      if (!pipeline || isExporting) return null;

      setIsExporting(true);
      setExportProgress(0);
      suspend();
      try {
        const scene = selectSceneParams(useAppStore.getState());
        const result = await exportSkybox(pipeline, scene, format, resolution, setExportProgress);
        downloadBlob(result.blob, result.filename);
        return result;
      } catch (e) {
        console.error('Export failed:', e);
        useToastStore.getState().addToast('error', `Export failed: ${(e as Error).message}`, 8000);
        return null;
      } finally {
        setIsExporting(false);
        setExportProgress(0);
        resumeAndRedraw();
      }
    },
    [pipelineRef, suspend, resumeAndRedraw],
  );

  const handleExport = useCallback(async () => {
    const { exportFormat, exportResolution } = useAppStore.getState();
    const result = await runExport(exportFormat, exportResolution);
    if (result) {
      useToastStore.getState().addToast('success', `Exported ${result.filename}`, 3000);
    }
  }, [runExport]);

  /** One click: set Geocore's format and size, export, and check the file fits. */
  const handleExportForGeocore = useCallback(
    async (resolution: number = GEOCORE_SKYBOX.resolution) => {
      const { setExportFormat, setExportResolution } = useAppStore.getState();
      setExportFormat(GEOCORE_SKYBOX.format);
      setExportResolution(resolution);

      const result = await runExport(GEOCORE_SKYBOX.format, resolution);
      if (!result) return;

      const { addToast } = useToastStore.getState();
      const size = formatMiB(result.blob.size);
      if (result.blob.size > GEOCORE_SKYBOX.maxFileBytes) {
        const retry =
          resolution > GEOCORE_SKYBOX.fallbackResolution
            ? ` Export at ${GEOCORE_SKYBOX.fallbackResolution} instead.`
            : ' Try a calmer sky: fewer stars or a softer nebula.';
        addToast(
          'warning',
          `${result.filename} is ${size}, over Geocore's ${formatMiB(GEOCORE_SKYBOX.maxFileBytes)} limit.${retry}`,
          12000,
        );
      } else {
        addToast(
          'success',
          `Saved ${result.filename} (${size}). In Geocore: Settings ▸ Custom skybox ▸ paste its path ▸ Import skybox.`,
          9000,
        );
      }
    },
    [runExport],
  );

  // Batch export handler — exports all presets as cubemaps in a single ZIP
  const handleBatchExport = useCallback(async () => {
    const pipeline = pipelineRef.current;
    const { exportResolution, isExporting, setIsExporting, setExportProgress } =
      useAppStore.getState();
    if (!pipeline || isExporting) return;

    setIsExporting(true);
    setExportProgress(0);
    suspend();
    try {
      const presets = getAllPresets().map((p) => ({ name: p.name, data: p.data }));
      const blob = await batchExport(pipeline, presets, exportResolution, setExportProgress);
      downloadBlob(blob, `skybox_batch_${exportResolution}.zip`);
      useToastStore
        .getState()
        .addToast('success', `Batch exported ${presets.length} presets`, 3000);
      restoreFromAppState(pipeline);
    } catch (e) {
      console.error('Batch export failed:', e);
      useToastStore
        .getState()
        .addToast('error', `Batch export failed: ${(e as Error).message}`, 8000);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      resumeAndRedraw();
    }
  }, [pipelineRef, suspend, resumeAndRedraw]);

  const openGuide = useCallback(() => setShowGuide(true), []);

  return (
    <ErrorBoundary>
      <AppLayout
        toolbar={
          <Toolbar
            onAboutClick={() => setShowAbout(true)}
            onGeocoreClick={openGuide}
            maxPreviewSize={maxCubeMapSize}
            onCompareToggle={handleCompareToggle}
            isComparing={isComparing}
          />
        }
        sidebar={
          <>
            <PresetPanel />
            <BackgroundPanel />
            <StarFieldPanel />
            <CatalogStarPanel />
            <ConstellationPanel />
            <MilkyWayPanel />
            <NebulaPanel />
            <SunPanel />
            <BloomPanel />
            <LensFlarePanel />
            <GodRayPanel />
            <ExportPanel
              onExport={handleExport}
              onExportForGeocore={handleExportForGeocore}
              onBatchExport={handleBatchExport}
              onShowGeocoreGuide={openGuide}
            />
          </>
        }
        viewport={
          <>
            <Viewport
              onCanvasReady={handleCanvasReady}
              onResize={handleResize}
              status={status}
              pendingLoads={pendingLoads}
            />
            <GeocoreTip onOpenGuide={openGuide} hidden={status.phase !== 'ready'} />
            <PerfOverlay />
            <HistogramOverlay data={histogramData} onVisibilityChange={setHistogramVisible} />
            <ComparisonOverlay
              ref={comparisonRef}
              onCapture={handleCapture}
              canvasWidth={canvasDims.w}
              canvasHeight={canvasDims.h}
              onStateChange={setIsComparing}
            />
          </>
        }
      />
      <AboutModal
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
        onOpenGeocoreGuide={() => {
          setShowAbout(false);
          setShowGuide(true);
        }}
      />
      <GeocoreGuide
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        onExportForGeocore={(resolution) => {
          setShowGuide(false);
          void handleExportForGeocore(resolution);
        }}
      />
      <ToastOverlay />
    </ErrorBoundary>
  );
}

export default App;
