/**
 * Export utilities for cubemap data.
 *
 * Supports exporting as:
 * - Individual PNG files (one per face) in a ZIP
 * - Cross layout PNG (single image)
 * - HDR format (future)
 * - EXR format (future)
 */

import type { CubeFace } from '@/types';
import { CUBE_FACES } from '@/types';
import { zipSync } from 'fflate';

/** Face data collected from the renderer */
export interface CubemapFaceData {
  face: CubeFace;
  pixels: Uint8Array;
  width: number;
  height: number;
}

/**
 * Convert raw RGBA pixel data to a PNG blob using Canvas.
 */
function pixelsToPngBlob(pixels: Uint8Array, width: number, height: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not create 2D context'));
      return;
    }

    // WebGL pixels are bottom-up, flip vertically
    const imageData = ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) {
      const srcRow = (height - 1 - y) * width * 4;
      const dstRow = y * width * 4;
      for (let x = 0; x < width * 4; x++) {
        imageData.data[dstRow + x] = pixels[srcRow + x];
      }
    }

    ctx.putImageData(imageData, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create PNG blob'));
    }, 'image/png');
  });
}

/**
 * Export cubemap faces as individual PNGs in a ZIP file.
 */
export async function exportAsIndividualPngs(
  faces: CubemapFaceData[],
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};
  const faceNames: Record<CubeFace, string> = {
    px: 'right',
    nx: 'left',
    py: 'top',
    ny: 'bottom',
    pz: 'front',
    nz: 'back',
  };

  for (let i = 0; i < faces.length; i++) {
    const { face, pixels, width, height } = faces[i];
    const blob = await pixelsToPngBlob(pixels, width, height);
    const buffer = new Uint8Array(await blob.arrayBuffer());
    files[`${faceNames[face]}.png`] = buffer;
    onProgress?.((i + 1) / faces.length);
  }

  const zipped = zipSync(files, { level: 6 });
  return new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
}

/**
 * Export cubemap as a cross layout PNG.
 * Layout:
 *       [top]
 * [left][front][right][back]
 *       [bottom]
 */
export async function exportAsCrossLayout(
  faces: CubemapFaceData[],
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const size = faces[0].width;
  const crossWidth = size * 4;
  const crossHeight = size * 3;

  const canvas = document.createElement('canvas');
  canvas.width = crossWidth;
  canvas.height = crossHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D context');

  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, crossWidth, crossHeight);

  // Face positions in the cross layout (col, row in face-size units)
  const positions: Record<CubeFace, [number, number]> = {
    px: [2, 1], // right
    nx: [0, 1], // left
    py: [1, 0], // top
    ny: [1, 2], // bottom
    pz: [1, 1], // front
    nz: [3, 1], // back
  };

  const faceMap = new Map(faces.map((f) => [f.face, f]));

  for (let i = 0; i < CUBE_FACES.length; i++) {
    const face = CUBE_FACES[i];
    const data = faceMap.get(face);
    if (!data) continue;

    const [col, row] = positions[face];
    const imageData = ctx.createImageData(size, size);

    // Flip vertically (WebGL is bottom-up)
    for (let y = 0; y < size; y++) {
      const srcRow = (size - 1 - y) * size * 4;
      const dstRow = y * size * 4;
      for (let x = 0; x < size * 4; x++) {
        imageData.data[dstRow + x] = data.pixels[srcRow + x];
      }
    }

    ctx.putImageData(imageData, col * size, row * size);
    onProgress?.((i + 1) / CUBE_FACES.length);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create cross layout PNG'));
    }, 'image/png');
  });
}

/**
 * Trigger a browser download of a Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
