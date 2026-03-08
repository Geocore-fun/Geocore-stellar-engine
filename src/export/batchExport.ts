/**
 * Batch export — render multiple presets and package into a single ZIP.
 *
 * For each selected preset:
 *   1. Temporarily apply preset data to the pipeline
 *   2. Render cubemap at the chosen export resolution
 *   3. Read face pixels and convert to PNGs
 *   4. Add to a single ZIP under a folder per preset
 *
 * The original state is restored after batch export completes.
 */

import type { PresetData } from '@/presets';
import type { SkyboxPipeline } from '@/renderer/SkyboxPipeline';
import { useAppStore } from '@/state';
import { CUBE_FACES } from '@/types';
import { zipSync } from 'fflate';

interface BatchPreset {
  name: string;
  data: PresetData;
}

/**
 * Face name mapping for export filenames.
 */
const FACE_NAMES: Record<string, string> = {
  px: 'right',
  nx: 'left',
  py: 'top',
  ny: 'bottom',
  pz: 'front',
  nz: 'back',
};

/**
 * Convert raw RGBA pixels (bottom-up) to a PNG Uint8Array.
 */
async function pixelsToPngBytes(
  pixels: Uint8Array,
  width: number,
  height: number,
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D context');

  const imageData = ctx.createImageData(width, height);
  // Flip vertically (WebGL is bottom-up)
  for (let y = 0; y < height; y++) {
    const srcRow = (height - 1 - y) * width * 4;
    const dstRow = y * width * 4;
    for (let x = 0; x < width * 4; x++) {
      imageData.data[dstRow + x] = pixels[srcRow + x];
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Apply a PresetData snapshot to the pipeline so it renders correctly.
 */
function applyPresetToPipeline(pipeline: SkyboxPipeline, data: PresetData): void {
  // Update pipeline layers directly via their public APIs
  pipeline.setFaceSize(data.faceSize);

  pipeline.getLayer('background')?.updateParams({ color: data.backgroundColor });

  pipeline.getLayer('point-stars')?.updateParams({ ...data.starField });
  const starLayer = pipeline.getLayer('point-stars');
  if (starLayer) {
    starLayer.enabled =
      data.starField.enabled &&
      !(data.catalogStars?.enabled && data.catalogStars?.blendMode === 'replace');
  }

  if (data.catalogStars) {
    pipeline.getLayer('catalog-stars')?.updateParams({ ...data.catalogStars });
    const catalogLayer = pipeline.getLayer('catalog-stars');
    if (catalogLayer) catalogLayer.enabled = data.catalogStars.enabled;

    pipeline.getLayer('named-star-labels')?.updateParams({
      enabled: data.catalogStars.showLabels,
      opacity: data.catalogStars.labelOpacity,
      color: data.catalogStars.labelColor,
      scale: data.catalogStars.labelScale,
      magnitudeLimit: data.catalogStars.labelMagnitudeLimit,
    });
    const namedLabelLayer = pipeline.getLayer('named-star-labels');
    if (namedLabelLayer)
      namedLabelLayer.enabled = data.catalogStars.enabled && data.catalogStars.showLabels;
  }

  if (data.constellations) {
    pipeline.getLayer('constellations')?.updateParams({ ...data.constellations });
    const constellationLayer = pipeline.getLayer('constellations');
    if (constellationLayer) constellationLayer.enabled = data.constellations.enabled;

    pipeline.getLayer('constellation-labels')?.updateParams({
      enabled: data.constellations.showLabels,
      opacity: data.constellations.labelOpacity,
      color: data.constellations.labelColor,
      scale: data.constellations.labelScale,
      visibleConstellations: data.constellations.visibleConstellations,
    });
    const labelLayer = pipeline.getLayer('constellation-labels');
    if (labelLayer)
      labelLayer.enabled = data.constellations.enabled && data.constellations.showLabels;
  }

  if (data.constellationBoundaries) {
    pipeline
      .getLayer('constellation-boundaries')
      ?.updateParams({ ...data.constellationBoundaries });
    const boundaryLayer = pipeline.getLayer('constellation-boundaries');
    if (boundaryLayer) boundaryLayer.enabled = data.constellationBoundaries.enabled;
  }

  if (data.milkyWay) {
    pipeline.getLayer('milky-way')?.updateParams({ ...data.milkyWay });
    const milkyWayLayer = pipeline.getLayer('milky-way');
    if (milkyWayLayer) milkyWayLayer.enabled = data.milkyWay.enabled;
  }

  pipeline.getLayer('nebula')?.updateParams({ ...data.nebula });
  const nebulaLayer = pipeline.getLayer('nebula');
  if (nebulaLayer) nebulaLayer.enabled = data.nebula.enabled;

  pipeline.getLayer('sun')?.updateParams({ ...data.sun });
  const sunLayer = pipeline.getLayer('sun');
  if (sunLayer) sunLayer.enabled = data.sun.enabled;

  if (data.bloom) pipeline.setBloomParams(data.bloom);
  if (data.lensFlare) pipeline.setLensFlareParams(data.lensFlare);
  if (data.godRays) pipeline.setGodRayParams(data.godRays);
  pipeline.setSunPosition(data.sun.position);
}

/**
 * Batch-export multiple presets into a single ZIP.
 *
 * @param pipeline The render pipeline (shared, will temporarily modify state)
 * @param presets Array of { name, data } to export
 * @param resolution Face resolution for all presets
 * @param onProgress Progress callback (0-1)
 * @returns A Blob containing the ZIP
 */
export async function batchExport(
  pipeline: SkyboxPipeline,
  presets: BatchPreset[],
  resolution: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};
  const total = presets.length * CUBE_FACES.length;
  let completed = 0;

  for (const preset of presets) {
    // Sanitize folder name
    const folderName = preset.name.replace(/[^a-zA-Z0-9_-]/g, '_');

    // Apply preset to pipeline
    applyPresetToPipeline(pipeline, preset.data);
    pipeline.setFaceSize(resolution);
    pipeline.renderCubemap(preset.data.seed);

    // Read all 6 faces
    const faceData = pipeline.readCubemapData();

    for (const face of faceData) {
      const pngBytes = await pixelsToPngBytes(face.pixels, face.width, face.height);
      files[`${folderName}/${FACE_NAMES[face.face]}.png`] = pngBytes;
      completed++;
      onProgress?.(completed / total);
    }
  }

  const zipped = zipSync(files, { level: 6 });
  return new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
}

/**
 * Restore the pipeline to the current app state after batch export.
 * This re-syncs all layers from the Zustand store.
 */
export function restoreFromAppState(pipeline: SkyboxPipeline): void {
  const s = useAppStore.getState();
  applyPresetToPipeline(pipeline, {
    seed: s.seed,
    faceSize: s.faceSize,
    backgroundColor: s.backgroundColor,
    starField: s.starField,
    nebula: s.nebula,
    sun: s.sun,
    catalogStars: s.catalogStars,
    constellations: s.constellations,
    constellationBoundaries: s.constellationBoundaries,
    milkyWay: s.milkyWay,
    bloom: s.bloom,
    lensFlare: s.lensFlare,
    godRays: s.godRays,
  });
  pipeline.renderCubemap(s.seed);
}
