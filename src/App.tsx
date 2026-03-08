/**
 * Root application component.
 *
 * Integrates the render pipeline with React UI,
 * handles the render loop, and syncs Zustand state to GPU layers.
 */

import { downloadBlob, exportAsCrossLayout, exportAsIndividualPngs } from '@/export';
import { useKeyboardShortcuts } from '@/hooks';
import { SkyboxPipeline } from '@/renderer/SkyboxPipeline';
import { useAppStore } from '@/state';
import { AboutModal, ErrorBoundary, PerfOverlay, Toolbar, Viewport } from '@/ui/components';
import { AppLayout } from '@/ui/layout';
import {
  BackgroundPanel,
  BloomPanel,
  CatalogStarPanel,
  ConstellationPanel,
  ExportPanel,
  MilkyWayPanel,
  NebulaPanel,
  PresetPanel,
  StarFieldPanel,
  SunPanel,
} from '@/ui/panels';
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
  ]);

  // Stable callback — only stores the canvas ref, actual init happens in useEffect
  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
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
      console.log('SkyboxPipeline initialized successfully');
    } catch (e) {
      console.error('Failed to initialize SkyboxPipeline:', e);
    }

    return () => {
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
      // Re-render at export resolution
      const originalSize = useAppStore.getState().faceSize;
      pipeline.setFaceSize(exportResolution);
      pipeline.renderCubemap(seed);

      // Read face data
      const faceData = pipeline.readCubemapData();

      // Export based on format
      let blob: Blob;
      let filename: string;

      if (exportFormat === 'png-cross') {
        blob = await exportAsCrossLayout(faceData, setExportProgress);
        filename = `skybox_cross_${exportResolution}.png`;
      } else {
        blob = await exportAsIndividualPngs(faceData, setExportProgress);
        filename = `skybox_${exportResolution}.zip`;
      }

      downloadBlob(blob, filename);

      // Restore preview resolution
      pipeline.setFaceSize(originalSize);
      pipeline.renderCubemap(seed);
    } catch (e) {
      console.error('Export failed:', e);
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
            <ExportPanel onExport={handleExport} />
          </>
        }
        viewport={
          <>
            <Viewport onCanvasReady={handleCanvasReady} />
            <PerfOverlay />
          </>
        }
      />
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </ErrorBoundary>
  );
}

export default App;
