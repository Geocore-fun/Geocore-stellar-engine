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

import { resolvePresetData, type PresetData } from '@/presets';
import { applySceneParams } from '@/renderer/applySceneParams';
import type { SkyboxPipeline } from '@/renderer/SkyboxPipeline';
import { selectSceneParams, useAppStore } from '@/state';
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

    // Apply preset to pipeline (missing sections fall back to defaults, exactly
    // as they do when the preset is loaded in the UI)
    applySceneParams(pipeline, resolvePresetData(preset.data));
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
  applySceneParams(pipeline, selectSceneParams(s));
  pipeline.renderCubemap(s.seed);
}
