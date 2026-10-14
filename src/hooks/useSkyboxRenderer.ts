/**
 * Owns the preview's WebGL pipeline: creating it for a canvas, deciding when a
 * frame is drawn, and recovering it when the GPU context is lost.
 *
 * Frames are demand-driven (see RenderScheduler). They are requested by:
 *   - the pipeline being created            → first frame as soon as shaders compile
 *   - a layer's async data load settling    → catalogue stars appear without a click
 *   - any scene parameter change            → cubemap re-render
 *   - a camera change                       → preview only
 *   - a canvas resize                       → preview, drawn synchronously
 *   - the tab becoming visible again        → preview
 *   - the GL context being restored         → a whole new pipeline
 *   - the histogram being shown             → readback polling until fresh
 *
 * Every frame reads the store directly, so no frame can draw stale closure state.
 */

import { applySceneParams } from '@/renderer/applySceneParams';
import { RenderScheduler, type FrameWork } from '@/renderer/RenderScheduler';
import { SkyboxPipeline } from '@/renderer/SkyboxPipeline';
import { sceneParamsChanged, selectSceneParams, useAppStore, useToastStore } from '@/state';
import { detectGPUCapabilities, setupContextLostHandling } from '@/utils/glErrors';
import { computeHistogram, type HistogramData } from '@/utils/histogram';
import { perfMonitor } from '@/utils/perfMonitor';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export type ViewportStatus =
  | { phase: 'starting' }
  | { phase: 'ready' }
  | { phase: 'recovering' }
  | { phase: 'error'; message: string };

/**
 * The async readback hands back the PREVIOUS read, so a histogram is only known
 * to describe the current cubemap from the second read after it was drawn. If
 * the GPU never signals (a lost context, a driver quirk), stop polling here.
 */
const HISTOGRAM_MAX_POLLS = 30;

/** GPU capability warnings are about the machine, not the pipeline: say them once. */
let gpuWarningsShown = false;

export interface SkyboxRenderer {
  /** Give the hook its canvas (null on unmount). */
  setCanvas: (canvas: HTMLCanvasElement | null) => void;
  /** The canvas was resized; redraw now so it never shows a cleared frame. */
  notifyResize: () => void;
  /** The live pipeline, for exports. Null until created or while recovering. */
  pipelineRef: RefObject<SkyboxPipeline | null>;
  status: ViewportStatus;
  /** Asset loads (star catalogue, label data) still in flight. */
  pendingLoads: number;
  /** Largest cubemap face this GPU supports (null until the pipeline exists). */
  maxCubeMapSize: number | null;
  histogramData: HistogramData | null;
  setHistogramVisible: (visible: boolean) => void;
  /** Stop drawing while an export borrows the pipeline. */
  suspend: () => void;
  /** Resume after an export and redraw from the store. */
  resumeAndRedraw: () => void;
}

export function useSkyboxRenderer(): SkyboxRenderer {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [contextGeneration, setContextGeneration] = useState(0);
  const [status, setStatus] = useState<ViewportStatus>({ phase: 'starting' });
  const [pendingLoads, setPendingLoads] = useState(0);
  const [maxCubeMapSize, setMaxCubeMapSize] = useState<number | null>(null);
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null);

  const pipelineRef = useRef<SkyboxPipeline | null>(null);
  const schedulerRef = useRef<RenderScheduler | null>(null);
  const histogramVisibleRef = useRef(false);
  const histogramPollsRef = useRef(0);
  const histogramFreshRef = useRef(false);

  useEffect(() => {
    if (!canvas) return;

    let pipeline: SkyboxPipeline;
    let scheduler: RenderScheduler | null = null;
    try {
      pipeline = new SkyboxPipeline(canvas, useAppStore.getState().faceSize, (pending) => {
        setPendingLoads(pending);
        // Data that arrives after the first frame changes what the cubemap holds.
        scheduler?.invalidateCubemap();
      });
    } catch (e) {
      console.error('Failed to initialize SkyboxPipeline:', e);
      // The outcome of creating the GL context is only knowable here, in the
      // effect that talks to the external system; there is nothing to derive it from.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus({ phase: 'error', message: (e as Error).message });
      return;
    }

    const { capabilities, warnings } = detectGPUCapabilities(pipeline.getGL());
    setMaxCubeMapSize(capabilities.maxCubeMapSize);
    if (!gpuWarningsShown) {
      gpuWarningsShown = true;
      for (const w of warnings) {
        useToastStore
          .getState()
          .addToast(w.severity === 'error' ? 'error' : 'warning', w.message, 8000);
      }
    }

    let presented = false;
    /** Set once the context is lost: every GL handle this pipeline holds is dead. */
    let contextLost = false;

    const drawFrame = ({ renderCubemap }: FrameWork): boolean => {
      if (pipeline.getGL().isContextLost()) return false;

      const frameStart = perfMonitor.frameStart();
      const state = useAppStore.getState();

      if (renderCubemap) {
        applySceneParams(pipeline, selectSceneParams(state));
        perfMonitor.timeCubemapRender(() => pipeline.renderCubemap(state.seed));
        if (state.needsRedraw) state.clearRedraw();
        histogramPollsRef.current = 0;
        histogramFreshRef.current = false;
      }

      let wantsAnotherFrame = false;
      if (histogramVisibleRef.current && !histogramFreshRef.current) {
        histogramPollsRef.current++;
        const pixels = pipeline.readFacePixelsAsync('pz');
        if (pixels) {
          setHistogramData(computeHistogram(pixels));
          if (histogramPollsRef.current >= 2) histogramFreshRef.current = true;
        }
        wantsAnotherFrame =
          !histogramFreshRef.current && histogramPollsRef.current < HISTOGRAM_MAX_POLLS;
      }

      const { yaw, pitch, fov } = state.camera;
      pipeline.renderPreview(yaw, pitch, fov);
      perfMonitor.frameEnd(frameStart);

      if (!presented) {
        presented = true;
        setStatus({ phase: 'ready' });
      }
      return wantsAnotherFrame;
    };

    scheduler = new RenderScheduler(drawFrame);
    pipelineRef.current = pipeline;
    schedulerRef.current = scheduler;
    scheduler.invalidateCubemap();

    const unsubscribe = useAppStore.subscribe((state, prev) => {
      if (sceneParamsChanged(state, prev) || (state.needsRedraw && !prev.needsRedraw)) {
        scheduler?.invalidateCubemap();
      } else if (state.camera !== prev.camera) {
        scheduler?.invalidatePreview();
      }
    });

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') scheduler?.invalidatePreview();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const removeContextHandlers = setupContextLostHandling(
      canvas,
      () => {
        contextLost = true;
        scheduler?.suspend();
        setStatus({ phase: 'recovering' });
      },
      () => {
        // Every GL object died with the old context: rebuild from scratch.
        setContextGeneration((g) => g + 1);
      },
    );

    return () => {
      removeContextHandlers();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      unsubscribe();
      scheduler?.dispose();
      scheduler = null;
      schedulerRef.current = null;
      pipelineRef.current = null;
      if (contextLost) {
        // Deleting handles from a lost context only produces GL warnings; the
        // browser already freed them. Just make sure late loads stay quiet.
        pipeline.getRenderer().onAssetsChanged = null;
      } else {
        pipeline.dispose();
      }
    };
  }, [canvas, contextGeneration]);

  const notifyResize = useCallback(() => {
    const scheduler = schedulerRef.current;
    if (!scheduler || scheduler.isSuspended) return;
    scheduler.invalidatePreview();
    scheduler.flush();
  }, []);

  const setHistogramVisible = useCallback((visible: boolean) => {
    histogramVisibleRef.current = visible;
    histogramPollsRef.current = 0;
    histogramFreshRef.current = false;
    if (visible) schedulerRef.current?.invalidatePreview();
  }, []);

  const suspend = useCallback(() => schedulerRef.current?.suspend(), []);

  const resumeAndRedraw = useCallback(() => {
    const scheduler = schedulerRef.current;
    if (!scheduler) return;
    // The export resized the cubemap and re-applied other scenes: redraw from the store.
    scheduler.invalidateCubemap();
    scheduler.resume();
  }, []);

  return {
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
  };
}
