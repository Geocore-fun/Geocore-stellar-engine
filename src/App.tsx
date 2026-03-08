/**
 * Root application component.
 *
 * Integrates the render pipeline with React UI,
 * handles the render loop, and syncs Zustand state to GPU layers.
 */

import { downloadBlob, exportAsCrossLayout, exportAsIndividualPngs } from '@/export';
import { SkyboxPipeline } from '@/renderer/SkyboxPipeline';
import { useAppStore } from '@/state';
import { Toolbar, Viewport } from '@/ui/components';
import { AppLayout } from '@/ui/layout';
import { ExportPanel, NebulaPanel, StarFieldPanel, SunPanel } from '@/ui/panels';
import { useCallback, useEffect, useRef, useState } from 'react';

function App() {
  const pipelineRef = useRef<SkyboxPipeline | null>(null);
  const rafRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pipelineReady, setPipelineReady] = useState(false);

  // Subscribe to store values
  const seed = useAppStore((s) => s.seed);
  const faceSize = useAppStore((s) => s.faceSize);
  const backgroundColor = useAppStore((s) => s.backgroundColor);
  const camera = useAppStore((s) => s.camera);
  const starField = useAppStore((s) => s.starField);
  const nebula = useAppStore((s) => s.nebula);
  const sun = useAppStore((s) => s.sun);
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
    if (starLayer) starLayer.enabled = starField.enabled;

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
  }, [faceSize, backgroundColor, starField, nebula, sun]);

  // Main render loop
  const renderFrame = useCallback(() => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return;

    if (needsRedraw) {
      syncLayers();
      pipeline.renderCubemap(seed);
      clearRedraw();
    }

    pipeline.renderPreview(camera.yaw, camera.pitch, camera.fov);
    rafRef.current = requestAnimationFrame(renderFrame);
  }, [seed, camera, needsRedraw, clearRedraw, syncLayers]);

  // Start/stop render loop when pipeline is ready
  useEffect(() => {
    if (!pipelineReady || !pipelineRef.current) return;

    // Do an initial sync + render immediately
    syncLayers();
    pipelineRef.current.renderCubemap(seed);

    rafRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [pipelineReady, renderFrame, syncLayers, seed]);

  // Request redraw on param changes
  useEffect(() => {
    useAppStore.getState().requestRedraw();
  }, [seed, faceSize, backgroundColor, starField, nebula, sun]);

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
    <AppLayout
      toolbar={<Toolbar />}
      sidebar={
        <>
          <StarFieldPanel />
          <NebulaPanel />
          <SunPanel />
          <ExportPanel onExport={handleExport} />
        </>
      }
      viewport={<Viewport onCanvasReady={handleCanvasReady} />}
    />
  );
}

export default App;
