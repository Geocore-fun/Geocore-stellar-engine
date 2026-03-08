/**
 * Histogram computation from raw RGBA pixel data.
 *
 * Computes per-channel (R, G, B) and luminance (Rec. 709) distributions
 * as 256-bin histograms from a Uint8Array of RGBA pixel data.
 */

export interface HistogramData {
  /** Red channel bin counts (256 bins, index = pixel value 0-255) */
  r: Uint32Array;
  /** Green channel bin counts */
  g: Uint32Array;
  /** Blue channel bin counts */
  b: Uint32Array;
  /** Luminance bin counts (Rec. 709 weighted) */
  lum: Uint32Array;
  /** Maximum bin count across all channels (for normalization) */
  maxCount: number;
  /** Total pixel count */
  pixelCount: number;
  /** Average luminance (0-255) */
  avgLuminance: number;
}

/**
 * Compute histogram from RGBA pixel data.
 * @param pixels - Uint8Array of RGBA pixel data (length must be multiple of 4)
 */
export function computeHistogram(pixels: Uint8Array): HistogramData {
  const r = new Uint32Array(256);
  const g = new Uint32Array(256);
  const b = new Uint32Array(256);
  const lum = new Uint32Array(256);

  let lumSum = 0;
  const pixelCount = pixels.length / 4;

  for (let i = 0; i < pixels.length; i += 4) {
    const pr = pixels[i];
    const pg = pixels[i + 1];
    const pb = pixels[i + 2];

    r[pr]++;
    g[pg]++;
    b[pb]++;

    // Rec. 709 luminance
    const l = Math.round(0.2126 * pr + 0.7152 * pg + 0.0722 * pb);
    const lClamped = Math.min(l, 255);
    lum[lClamped]++;
    lumSum += lClamped;
  }

  // Find max bin count (skip bin 0 for better normalization — many skybox pixels are black)
  let maxCount = 0;
  for (let i = 1; i < 256; i++) {
    maxCount = Math.max(maxCount, r[i], g[i], b[i], lum[i]);
  }

  return {
    r,
    g,
    b,
    lum,
    maxCount,
    pixelCount,
    avgLuminance: pixelCount > 0 ? lumSum / pixelCount : 0,
  };
}
