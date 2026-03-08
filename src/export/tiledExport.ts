/**
 * Tiled cubemap rendering for ultra-high resolution export (8K+).
 *
 * When the desired face resolution exceeds the GPU's max texture size,
 * each face is rendered as a grid of tiles using sub-frustum projections.
 * Tiles are stitched on the CPU into the full-resolution pixel buffer.
 *
 * The sub-frustum approach modifies the cubemap's 90° perspective so that
 * each tile renders only its corresponding portion of the face. This means
 * layers don't need any modifications — they see a standard projection matrix.
 */

import type { CubemapFaceData } from '@/export/exporter';
import type { RenderLayer, RenderParams } from '@/layers/RenderLayer';
import type { BloomParams } from '@/renderer/BloomPass';
import { CubemapFBO } from '@/renderer/CubemapFBO';
import type { Renderer } from '@/renderer/Renderer';
import { CUBE_FACES } from '@/types';
import { getCubeFaceViewMatrix } from '@/utils/cubemap';
import { mat4 } from 'gl-matrix';

/** Near / far planes matching getCubemapProjectionMatrix() */
const NEAR = 0.01;
const FAR = 100.0;

/** Half-extent at the near plane for a 90° FOV: near * tan(45°) = near */
const HALF_EXTENT = NEAR; // tan(PI/4) = 1.0

/**
 * Build a sub-frustum projection matrix for tile (tx, ty) of an NxN grid.
 *
 * The full 90° cubemap frustum goes from [-HALF_EXTENT, +HALF_EXTENT]
 * on both axes. Each tile covers a 1/N-th slice on each axis.
 */
function buildTileProjection(tx: number, ty: number, numTiles: number): mat4 {
  const tileSize = (2 * HALF_EXTENT) / numTiles;

  const left = -HALF_EXTENT + tx * tileSize;
  const right = left + tileSize;
  const bottom = -HALF_EXTENT + ty * tileSize;
  const top = bottom + tileSize;

  const proj = mat4.create();
  mat4.frustum(proj, left, right, bottom, top, NEAR, FAR);
  return proj;
}

/**
 * Determine the optimal tile grid for a given target resolution.
 *
 * @param targetSize   Desired face size (e.g. 8192)
 * @param maxTexSize   GPU max texture size (gl.MAX_TEXTURE_SIZE)
 * @returns Object with `numTiles` (grid dimension) and `tileSize` (pixels per tile)
 */
export function computeTileGrid(
  targetSize: number,
  maxTexSize: number,
): { numTiles: number; tileSize: number } {
  // Use at most maxTexSize per tile, and cap at 4096 for safety/performance
  const effectiveMax = Math.min(maxTexSize, 4096);

  if (targetSize <= effectiveMax) {
    return { numTiles: 1, tileSize: targetSize };
  }

  const numTiles = Math.ceil(targetSize / effectiveMax);
  const tileSize = Math.ceil(targetSize / numTiles);
  return { numTiles, tileSize };
}

export interface TiledRenderOptions {
  /** Renderer instance (for GL context) */
  renderer: Renderer;
  /** Sorted, enabled layers to render */
  layers: RenderLayer[];
  /** Global seed for layer rendering */
  seed: number;
  /** Target resolution per face */
  targetSize: number;
  /** Bloom params (applied per-tile if enabled) */
  bloomParams?: BloomParams;
  /** Progress callback: (completedTiles, totalTiles) */
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Render a full cubemap at ultra-high resolution using tiled rendering.
 *
 * Each face is split into a numTiles × numTiles grid. For each tile:
 *   1. Build a sub-frustum projection covering that tile's portion
 *   2. Render all layers with that projection into a tile-sized FBO
 *   3. Read pixels back and copy into the full-resolution buffer
 *
 * @returns Face data array compatible with the exporter
 */
export async function renderTiledCubemap(options: TiledRenderOptions): Promise<CubemapFaceData[]> {
  const { renderer, layers, seed, targetSize, onProgress } = options;
  const { gl } = renderer;

  const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const { numTiles, tileSize } = computeTileGrid(targetSize, maxTexSize);

  // Create a temporary FBO at tile resolution
  const tileFBO = new CubemapFBO(gl, tileSize);

  const totalTiles = CUBE_FACES.length * numTiles * numTiles;
  let completedTiles = 0;

  const results: CubemapFaceData[] = [];

  for (const face of CUBE_FACES) {
    const viewMatrix = getCubeFaceViewMatrix(face);

    // Full-resolution pixel buffer for this face
    const fullPixels = new Uint8Array(targetSize * targetSize * 4);

    for (let ty = 0; ty < numTiles; ty++) {
      for (let tx = 0; tx < numTiles; tx++) {
        const tileProj = buildTileProjection(tx, ty, numTiles);

        // Bind tile face and clear
        tileFBO.bindFace(face);
        gl.viewport(0, 0, tileSize, tileSize);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const params: RenderParams = {
          face,
          faceSize: tileSize,
          viewMatrix: viewMatrix as Float32Array,
          projectionMatrix: tileProj as Float32Array,
          seed,
        };

        // Render all enabled layers
        for (const layer of layers) {
          if (!layer.enabled) continue;
          layer.render(renderer, params);
        }

        // Read tile pixels
        tileFBO.bindFace(face);
        const tilePixels = new Uint8Array(tileSize * tileSize * 4);
        gl.readPixels(0, 0, tileSize, tileSize, gl.RGBA, gl.UNSIGNED_BYTE, tilePixels);

        // Copy tile pixels into the full-resolution buffer
        // Tiles are arranged: tx goes left to right, ty goes bottom to top (GL coords)
        const dstX = tx * tileSize;
        const dstY = ty * tileSize;

        for (let row = 0; row < tileSize; row++) {
          const srcOffset = row * tileSize * 4;
          const dy = dstY + row;
          if (dy >= targetSize) break;
          const dstOffset = (dy * targetSize + dstX) * 4;
          const copyWidth = Math.min(tileSize, targetSize - dstX) * 4;
          fullPixels.set(tilePixels.subarray(srcOffset, srcOffset + copyWidth), dstOffset);
        }

        completedTiles++;
        onProgress?.(completedTiles, totalTiles);

        // Yield to UI thread occasionally
        if (completedTiles % 4 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }
    }

    results.push({
      face,
      pixels: fullPixels,
      width: targetSize,
      height: targetSize,
    });
  }

  // Clean up tile FBO
  tileFBO.unbind();
  tileFBO.dispose();

  return results;
}

/**
 * Check whether tiled rendering is needed for a given resolution.
 */
export function needsTiledRendering(gl: WebGL2RenderingContext, targetSize: number): boolean {
  const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  return targetSize > Math.min(maxTexSize, 4096);
}
