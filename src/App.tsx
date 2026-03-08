/**
 * Root application component.
 *
 * Integrates the render pipeline with React UI,
 * handles the render loop, and syncs Zustand state to GPU layers.
 */

import {
  batchExport,
  downloadBlob,
  exportAsCrossLayout,
  exportAsHDR,
  exportAsIndividualPngs,
  needsTiledRendering,
  renderTiledCubemap,
  restoreFromAppState,
} from '@/export';
import { useKeyboardShortcuts } from '@/hooks';
import { getAllPresets } from '@/presets';
import { SkyboxPipeline } from '@/renderer/SkyboxPipeline';
import { useAppStore, useToastStore } from '@/state';
import {
  AboutModal,
  ComparisonOverlay,
  ErrorBoundary,
  HistogramOverlay,
  PerfOverlay,
  ToastOverlay,
  Toolbar,
  Viewport,
} from '@/ui/components';
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
import { detectGPUCapabilities, setupContextLostHandling } from '@/utils/glErrors';
import { computeHistogram, type HistogramData } from '@/utils/histogram';
import { perfMonitor } from '@/utils/perfMonitor';
import { useCallback, useEffect, useRef, useState } from 'react';

function App() {
  const pipelineRef = useRef<SkyboxPipeline | null>(null);
  const rafRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pipelineReady, setPipelineReady] = useState(false);

  // Global keyboard shortcuts
  useKeyboardShortcuts();

  // About modal state (rendered at root level to avoid stacking context issues)
  const [showAbout, setShowAbout] = useState(false);
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null);
  const histogramVisibleRef = useRef(false);
  const lastHistogramTimeRef = useRef(0);
  const [canvasDims, setCanvasDims] = useState({ w: 0, h: 0 });

  // Subscribe to store values
  const seed = useAppStore((s) => s.seed);
  const faceSize = useAppStore((s) => s.faceSize);
  const backgroundColor = useAppStore((s) => s.backgroundColor);
  const camera = useAppStore((s) => s.camera);
  const starField = useAppStore((s) => s.starField);
  const catalogStars = useAppStore((s) => s.catalogStars);
  const constellations = useAppStore((s) => s.constellations);
  const constellationBoundaries = useAppStore((s) => s.constellationBoundaries);
  const milkyWay = useAppStore((s) => s.milkyWay);
  const nebula = useAppStore((s) => s.nebula);
  const sun = useAppStore((s) => s.sun);
  const bloom = useAppStore((s) => s.bloom);
  const lensFlare = useAppStore((s) => s.lensFlare);
  const godRays = useAppStore((s) => s.godRays);
  const needsRedraw = useAppStore((s) => s.needsRedraw);
  const clearRedraw = useAppStore((s) => s.clearRedraw);

  // Sync state to pipeline layers
  const syncLayers = useCallback(() => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return;

    pipeline.setFaceSize(faceSize);

    pipeline.getLayer('background')?.updateParams({ color: backgroundColor });
    pipeline.getLayer('point-stars')?.updateParams({
      ...starField,
    });
    const starLayer = pipeline.getLayer('point-stars');
    if (starLayer) {
      // In 'replace' mode, hide procedural stars when catalog is enabled
      starLayer.enabled =
        starField.enabled && !(catalogStars.enabled && catalogStars.blendMode === 'replace');
    }

    pipeline.getLayer('catalog-stars')?.updateParams({
      ...catalogStars,
    });
    const catalogLayer = pipeline.getLayer('catalog-stars');
    if (catalogLayer) catalogLayer.enabled = catalogStars.enabled;

    pipeline.getLayer('named-star-labels')?.updateParams({
      enabled: catalogStars.showLabels,
      opacity: catalogStars.labelOpacity,
      color: catalogStars.labelColor,
      scale: catalogStars.labelScale,
      magnitudeLimit: catalogStars.labelMagnitudeLimit,
    });
    const namedLabelLayer = pipeline.getLayer('named-star-labels');
    if (namedLabelLayer) namedLabelLayer.enabled = catalogStars.enabled && catalogStars.showLabels;

    pipeline.getLayer('constellations')?.updateParams({
      ...constellations,
    });
    const constellationLayer = pipeline.getLayer('constellations');
    if (constellationLayer) constellationLayer.enabled = constellations.enabled;

    pipeline.getLayer('constellation-boundaries')?.updateParams({
      ...constellationBoundaries,
    });
    const boundaryLayer = pipeline.getLayer('constellation-boundaries');
    if (boundaryLayer) boundaryLayer.enabled = constellationBoundaries.enabled;

    pipeline.getLayer('milky-way')?.updateParams({
      ...milkyWay,
    });
    const milkyWayLayer = pipeline.getLayer('milky-way');
    if (milkyWayLayer) milkyWayLayer.enabled = milkyWay.enabled;

    pipeline.getLayer('constellation-labels')?.updateParams({
      enabled: constellations.showLabels,
      opacity: constellations.labelOpacity,
      color: constellations.labelColor,
      scale: constellations.labelScale,
      visibleConstellations: constellations.visibleConstellations,
    });
    const labelLayer = pipeline.getLayer('constellation-labels');
    if (labelLayer) labelLayer.enabled = constellations.enabled && constellations.showLabels;

    pipeline.getLayer('nebula')?.updateParams({
      ...nebula,
    });
    const nebulaLayer = pipeline.getLayer('nebula');
    if (nebulaLayer) nebulaLayer.enabled = nebula.enabled;

    pipeline.getLayer('sun')?.updateParams({
      ...sun,
    });
    const sunLayer = pipeline.getLayer('sun');
    if (sunLayer) sunLayer.enabled = sun.enabled;

    // Sync bloom post-processing params
    pipeline.setBloomParams(bloom);
    pipeline.setLensFlareParams(lensFlare);
    pipeline.setGodRayParams(godRays);
    pipeline.setSunPosition(sun.position);
  }, [
    faceSize,
    backgroundColor,
    starField,
    catalogStars,
    constellations,
    constellationBoundaries,
    milkyWay,
    nebula,
    sun,
    bloom,
    lensFlare,
    godRays,
  ]);

  // Main render loop
  const renderFrame = useCallback(() => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return;

    const frameStart = perfMonitor.frameStart();

    if (needsRedraw) {
      syncLayers();
      perfMonitor.timeCubemapRender(() => pipeline.renderCubemap(seed));
      clearRedraw();
    }

    // Async histogram readback — gated on visibility + throttled to ~10fps
    if (histogramVisibleRef.current) {
      const now = performance.now();
      if (now - lastHistogramTimeRef.current > 100) {
        const asyncPixels = pipeline.readFacePixelsAsync('pz');
        if (asyncPixels) {
          setHistogramData(computeHistogram(asyncPixels));
          lastHistogramTimeRef.current = now;
        }
      }
    }

    pipeline.renderPreview(camera.yaw, camera.pitch, camera.fov);
    perfMonitor.frameEnd(frameStart);
    rafRef.current = requestAnimationFrame(renderFrame);
  }, [seed, camera, needsRedraw, clearRedraw, syncLayers]);

  // Start/stop render loop when pipeline is ready
  useEffect(() => {
    if (!pipelineReady || !pipelineRef.current) return;

    // Do an initial sync + render immediately
    syncLayers();
    pipelineRef.current.renderCubemap(seed);

    // Render preview immediately so viewport isn't blank on first load
    const cam = useAppStore.getState().camera;
    pipelineRef.current.renderPreview(cam.yaw, cam.pitch, cam.fov);

    rafRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [pipelineReady, renderFrame, syncLayers, seed]);

  // Request redraw on param changes (debounced for rapid slider movement)
  const redrawTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  useEffect(() => {
    // Clear any pending debounce
    if (redrawTimerRef.current) clearTimeout(redrawTimerRef.current);
    // Debounce cubemap re-render by 30ms to batch rapid changes
    redrawTimerRef.current = setTimeout(() => {
      useAppStore.getState().requestRedraw();
    }, 30);
    return () => {
      if (redrawTimerRef.current) clearTimeout(redrawTimerRef.current);
    };
  }, [
    seed,
    faceSize,
    backgroundColor,
    starField,
    catalogStars,
    constellations,
    constellationBoundaries,
    milkyWay,
    nebula,
    sun,
    bloom,
    lensFlare,
    godRays,
  ]);

  // Capture current canvas as data URL (for A/B comparison)
  const handleCapture = useCallback((): string | null => {
    return canvasRef.current?.toDataURL('image/png') ?? null;
  }, []);

  // Stable callback — only stores the canvas ref, actual init happens in useEffect
  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
    setCanvasDims({ w: canvas.width, h: canvas.height });
    setPipelineReady(false); // trigger the init effect
  }, []);

  // Initialize pipeline when canvas is available (runs once per canvas mount)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dispose previous pipeline if any
    if (pipelineRef.current) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      pipelineRef.current.dispose();
      pipelineRef.current = null;
    }

    try {
      const currentState = useAppStore.getState();
      const pipeline = new SkyboxPipeline(canvas, currentState.faceSize);
      pipelineRef.current = pipeline;
      setPipelineReady(true);

      // Detect GPU capabilities and warn about limitations
      const { warnings } = detectGPUCapabilities(pipeline.getGL());
      for (const w of warnings) {
        useToastStore
          .getState()
          .addToast(w.severity === 'error' ? 'error' : 'warning', w.message, 8000);
      }

      console.log('SkyboxPipeline initialized successfully');
    } catch (e) {
      console.error('Failed to initialize SkyboxPipeline:', e);
      useToastStore
        .getState()
        .addToast('error', `WebGL initialization failed: ${(e as Error).message}`, 0);
    }

    // Handle WebGL context lost/restored
    const removeContextHandlers = setupContextLostHandling(
      canvas,
      () => {
        // Context lost — pause rendering
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
        useToastStore.getState().addToast('error', 'WebGL context lost. Attempting to recover…', 0);
      },
      () => {
        // Context restored — re-initialize
        useToastStore.getState().clearAll();
        useToastStore.getState().addToast('success', 'WebGL context restored.', 3000);
        // Trigger re-initialization by re-setting the canvas
        setPipelineReady(false);
        setTimeout(() => {
          canvasRef.current = canvas;
          setPipelineReady(false);
        }, 100);
      },
    );

    return () => {
      removeContextHandlers();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      pipelineRef.current?.dispose();
      pipelineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef.current]);

  // Export handler
  const handleExport = useCallback(async () => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return;

    const { exportFormat, exportResolution, setIsExporting, setExportProgress } =
      useAppStore.getState();

    setIsExporting(true);
    setExportProgress(0);

    try {
      const originalSize = useAppStore.getState().faceSize;
      const useTiled = needsTiledRendering(pipeline.getGL(), exportResolution);

      let faceData;
      if (useTiled) {
        // Tiled rendering for 8K+ resolutions
        syncLayers();
        const layers = pipeline.getSortedLayers();
        faceData = await renderTiledCubemap({
          renderer: pipeline.getRenderer(),
          layers,
          seed,
          targetSize: exportResolution,
          onProgress: (done, total) => setExportProgress((done / total) * 0.5),
        });
      } else {
        // Standard rendering
        pipeline.setFaceSize(exportResolution);
        pipeline.renderCubemap(seed);
        faceData = pipeline.readCubemapData();
      }

      // Export based on format
      let blob: Blob;
      let filename: string;

      if (exportFormat === 'png-cross') {
        blob = await exportAsCrossLayout(faceData, (p) => setExportProgress(0.5 + p * 0.5));
        filename = `skybox_cross_${exportResolution}.png`;
      } else if (exportFormat === 'hdr') {
        blob = await exportAsHDR(faceData, 2.0, (p) => setExportProgress(0.5 + p * 0.5));
        filename = `skybox_hdr_${exportResolution}.zip`;
      } else {
        blob = await exportAsIndividualPngs(faceData, (p) => setExportProgress(0.5 + p * 0.5));
        filename = `skybox_${exportResolution}.zip`;
      }

      downloadBlob(blob, filename);
      useToastStore.getState().addToast('success', `Exported ${filename}`, 3000);

      // Restore preview resolution
      pipeline.setFaceSize(originalSize);
      pipeline.renderCubemap(seed);
    } catch (e) {
      console.error('Export failed:', e);
      useToastStore.getState().addToast('error', `Export failed: ${(e as Error).message}`, 8000);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [seed, syncLayers]);

  // Batch export handler — exports all presets as cubemaps in a single ZIP
  const handleBatchExport = useCallback(async () => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return;

    const { exportResolution, setIsExporting, setExportProgress } = useAppStore.getState();
    setIsExporting(true);
    setExportProgress(0);

    try {
      const originalSize = useAppStore.getState().faceSize;
      const presets = getAllPresets().map((p) => ({ name: p.name, data: p.data }));

      const blob = await batchExport(pipeline, presets, exportResolution, setExportProgress);
      downloadBlob(blob, `skybox_batch_${exportResolution}.zip`);
      useToastStore
        .getState()
        .addToast('success', `Batch exported ${presets.length} presets`, 3000);

      // Restore current state
      restoreFromAppState(pipeline);
      pipeline.setFaceSize(originalSize);
      pipeline.renderCubemap(seed);
    } catch (e) {
      console.error('Batch export failed:', e);
      useToastStore
        .getState()
        .addToast('error', `Batch export failed: ${(e as Error).message}`, 8000);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [seed]);

  return (
    <ErrorBoundary>
      <AppLayout
        toolbar={<Toolbar onAboutClick={() => setShowAbout(true)} />}
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
            <ExportPanel onExport={handleExport} onBatchExport={handleBatchExport} />
          </>
        }
        viewport={
          <>
            <Viewport onCanvasReady={handleCanvasReady} />
            <PerfOverlay />
            <HistogramOverlay
              data={histogramData}
              onVisibilityChange={(v) => {
                histogramVisibleRef.current = v;
              }}
            />
            <ComparisonOverlay
              onCapture={handleCapture}
              canvasWidth={canvasDims.w}
              canvasHeight={canvasDims.h}
            />
          </>
        }
      />
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <ToastOverlay />
    </ErrorBoundary>
  );
}

export default App;
