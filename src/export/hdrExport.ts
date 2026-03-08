/**
 * HDR (Radiance RGBE) export for skybox cubemaps.
 *
 * Converts standard 8-bit pixel data to Radiance .hdr format using
 * RGBE encoding. Since our rendering pipeline outputs 8-bit RGBA,
 * we scale by an exposure factor to produce a meaningful HDR dynamic range.
 *
 * RGBE format stores each pixel as 4 bytes: R, G, B mantissas + shared exponent.
 * This gives ~6 orders of magnitude dynamic range with 256 levels per channel.
 *
 * Reference: Greg Ward, "Real Pixels" — Graphics Gems II, pp. 80-83
 */

import type { CubemapFaceData } from '@/export/exporter';

/**
 * Encode a linear [0,1] RGB triplet as RGBE (4 bytes).
 */
function encodeRGBE(r: number, g: number, b: number): [number, number, number, number] {
  const maxVal = Math.max(r, g, b);
  if (maxVal < 1e-32) {
    return [0, 0, 0, 0];
  }

  // frexp: maxVal = mantissa * 2^exponent, mantissa ∈ [0.5, 1.0)
  const exponent = Math.ceil(Math.log2(maxVal));
  const scale = Math.pow(2, -exponent) * 256;

  return [
    Math.min(255, Math.round(r * scale)),
    Math.min(255, Math.round(g * scale)),
    Math.min(255, Math.round(b * scale)),
    exponent + 128, // bias by 128
  ];
}

/**
 * Encode HDR image data using Radiance RLE (run-length encoding).
 * Each scanline is encoded channel-by-channel (adaptive RLE).
 */
function encodeRLEScanline(scanline: Uint8Array, width: number): Uint8Array {
  // Adaptive RLE: encode each channel separately for better compression
  const output: number[] = [];

  // Scanline header: 0x02, 0x02, width high, width low
  output.push(0x02, 0x02, (width >> 8) & 0xff, width & 0xff);

  // Process each of the 4 channels (R, G, B, E)
  for (let ch = 0; ch < 4; ch++) {
    let pos = 0;
    while (pos < width) {
      // Look for a run of identical values
      const runStart = pos;
      const runVal = scanline[runStart * 4 + ch];
      let runLen = 1;

      while (runStart + runLen < width && runLen < 127) {
        if (scanline[(runStart + runLen) * 4 + ch] === runVal) {
          runLen++;
        } else {
          break;
        }
      }

      if (runLen > 2) {
        // Emit run: count | 0x80, value
        output.push(runLen | 0x80, runVal);
        pos = runStart + runLen;
      } else {
        // Emit non-run (literal) data
        let litLen = 1;
        while (pos + litLen < width && litLen < 127) {
          // Check if next values form a run
          const nextVal = scanline[(pos + litLen) * 4 + ch];
          let nextRun = 1;
          for (let j = 1; j < 3 && pos + litLen + j < width; j++) {
            if (scanline[(pos + litLen + j) * 4 + ch] === nextVal) nextRun++;
            else break;
          }
          if (nextRun >= 3) break;
          litLen++;
        }

        // Emit literal: count, values...
        output.push(litLen);
        for (let i = 0; i < litLen; i++) {
          output.push(scanline[(pos + i) * 4 + ch]);
        }
        pos += litLen;
      }
    }
  }

  return new Uint8Array(output);
}

/**
 * Generate a Radiance HDR file header.
 */
function createHDRHeader(width: number, height: number): Uint8Array {
  const header =
    '#?RADIANCE\n' +
    '# Geocore Stellar Engine HDR Export\n' +
    'FORMAT=32-bit_rle_rgbe\n' +
    '\n' +
    `-Y ${height} +X ${width}\n`;

  const encoder = new TextEncoder();
  return encoder.encode(header);
}

/**
 * Convert 8-bit RGBA pixel data to HDR (Radiance RGBE) format.
 *
 * Since the input is 8-bit, we apply an exposure multiplier
 * to create a meaningful HDR range. Bright pixels (near 255)
 * will map to higher irradiance values.
 *
 * @param pixels   RGBA Uint8Array (bottom-up from WebGL)
 * @param width    Image width
 * @param height   Image height
 * @param exposure Exposure multiplier (default 2.0 — bright pixels get 2× boost)
 * @returns Blob with .hdr file data
 */
export function pixelsToHDR(
  pixels: Uint8Array,
  width: number,
  height: number,
  exposure: number = 2.0,
): Blob {
  const headerBytes = createHDRHeader(width, height);
  const scanlines: Uint8Array[] = [];

  // Process scanlines top-to-bottom (HDR format is top-down)
  // WebGL pixels are bottom-up, so we flip
  for (let y = 0; y < height; y++) {
    const srcY = height - 1 - y; // flip vertical
    const rgbe = new Uint8Array(width * 4);

    for (let x = 0; x < width; x++) {
      const srcIdx = (srcY * width + x) * 4;
      // Convert 8-bit [0,255] to linear [0,1], apply exposure
      const r = (pixels[srcIdx] / 255) * exposure;
      const g = (pixels[srcIdx + 1] / 255) * exposure;
      const b = (pixels[srcIdx + 2] / 255) * exposure;

      const [er, eg, eb, ee] = encodeRGBE(r, g, b);
      const dstIdx = x * 4;
      rgbe[dstIdx] = er;
      rgbe[dstIdx + 1] = eg;
      rgbe[dstIdx + 2] = eb;
      rgbe[dstIdx + 3] = ee;
    }

    // Use RLE encoding for each scanline
    if (width >= 8 && width <= 0x7fff) {
      scanlines.push(encodeRLEScanline(rgbe, width));
    } else {
      // For very small or very large images, write raw RGBE
      scanlines.push(rgbe);
    }
  }

  // Combine header + all scanlines
  const totalSize = headerBytes.length + scanlines.reduce((s, sl) => s + sl.length, 0);
  const result = new Uint8Array(totalSize);
  let offset = 0;

  result.set(headerBytes, offset);
  offset += headerBytes.length;

  for (const sl of scanlines) {
    result.set(sl, offset);
    offset += sl.length;
  }

  return new Blob([result.buffer], { type: 'application/octet-stream' });
}

/**
 * Export all cubemap faces as individual .hdr files in a ZIP.
 *
 * @param faces     Cubemap face data from the pipeline
 * @param exposure  HDR exposure multiplier
 * @param onProgress Progress callback (0-1)
 * @returns ZIP blob containing 6 .hdr files
 */
export async function exportAsHDR(
  faces: CubemapFaceData[],
  exposure: number = 2.0,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  // Import fflate for zipping
  const { zipSync } = await import('fflate');

  const FACE_NAMES: Record<string, string> = {
    px: 'right',
    nx: 'left',
    py: 'top',
    ny: 'bottom',
    pz: 'front',
    nz: 'back',
  };

  const files: Record<string, Uint8Array> = {};

  for (let i = 0; i < faces.length; i++) {
    const { face, pixels, width, height } = faces[i];
    const hdrBlob = pixelsToHDR(pixels, width, height, exposure);
    const hdrBytes = new Uint8Array(await hdrBlob.arrayBuffer());
    files[`${FACE_NAMES[face]}.hdr`] = hdrBytes;
    onProgress?.((i + 1) / faces.length);
  }

  const zipped = zipSync(files, { level: 6 });
  return new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
}
