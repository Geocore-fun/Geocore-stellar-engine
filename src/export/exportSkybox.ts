/**
 * One export, end to end: render the cubemap at the requested resolution and
 * encode it in the requested format.
 *
 * The caller owns scheduling: it must stop the preview from drawing while this
 * runs (it changes the pipeline's face size and, for tiled renders, yields to
 * the event loop between tiles) and restore the preview afterwards.
 */

import { applySceneParams } from '@/renderer/applySceneParams';
import type { SkyboxPipeline } from '@/renderer/SkyboxPipeline';
import type { SceneParams } from '@/state/appStore';
import type { ExportFormat } from '@/types';
import { exportAsCrossLayout, exportAsIndividualPngs, type CubemapFaceData } from './exporter';
import { exportAsHDR } from './hdrExport';
import { needsTiledRendering, renderTiledCubemap } from './tiledExport';

export interface ExportResult {
  blob: Blob;
  filename: string;
}

export async function exportSkybox(
  pipeline: SkyboxPipeline,
  scene: SceneParams,
  format: ExportFormat,
  resolution: number,
  onProgress: (progress: number) => void,
): Promise<ExportResult> {
  // Apply the scene first: the preview is paused, so a change made in the
  // same frame as the click may not have reached the layers yet.
  applySceneParams(pipeline, scene);

  let faceData: CubemapFaceData[];
  if (needsTiledRendering(pipeline.getGL(), resolution)) {
    // Tiled rendering for 8K+ resolutions
    faceData = await renderTiledCubemap({
      renderer: pipeline.getRenderer(),
      layers: pipeline.getSortedLayers(),
      seed: scene.seed,
      targetSize: resolution,
      onProgress: (done, total) => onProgress((done / total) * 0.5),
    });
  } else {
    pipeline.setFaceSize(resolution);
    pipeline.renderCubemap(scene.seed);
    faceData = pipeline.readCubemapData();
  }

  const encodeProgress = (p: number) => onProgress(0.5 + p * 0.5);

  if (format === 'png-cross') {
    return {
      blob: await exportAsCrossLayout(faceData, encodeProgress),
      filename: `skybox_cross_${resolution}.png`,
    };
  }
  if (format === 'hdr') {
    return {
      blob: await exportAsHDR(faceData, 2.0, encodeProgress),
      filename: `skybox_hdr_${resolution}.zip`,
    };
  }
  return {
    blob: await exportAsIndividualPngs(faceData, encodeProgress),
    filename: `skybox_${resolution}.zip`,
  };
}
