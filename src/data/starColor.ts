/**
 * starColor.ts — converts B-V color index to RGB using the Ballesteros formula.
 *
 * Reference: Ballesteros 2012 (arXiv:1201.1809)
 * Maps B-V → effective temperature → CIE chromaticity → sRGB.
 *
 * The B-V color index ranges roughly from -0.4 (hot blue O-type stars)
 * to +2.0 (cool red M-type stars). Solar B-V ≈ 0.656.
 */

/**
 * Convert B-V color index to effective temperature (Kelvin)
 * using the Ballesteros (2012) formula.
 */
export function bvToTemperature(bv: number): number {
  // Clamp to valid range
  const clamped = Math.max(-0.4, Math.min(2.0, bv));
  // Ballesteros formula
  return 4600 * (1 / (0.92 * clamped + 1.7) + 1 / (0.92 * clamped + 0.62));
}

/**
 * Convert effective temperature (Kelvin) to sRGB [r, g, b] in [0, 1].
 * Uses Tanner Helland's color temperature approximation algorithm,
 * adapted and refined for stellar color rendering.
 *
 * Works well for temperatures 1000K – 40000K.
 */
export function temperatureToRgb(tempK: number): [number, number, number] {
  const temp = Math.max(1000, Math.min(40000, tempK)) / 100;
  let r: number, g: number, b: number;

  // Red
  if (temp <= 66) {
    r = 255;
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
  }

  // Green
  if (temp <= 66) {
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
  } else {
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
  }

  // Blue
  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
  }

  return [
    Math.max(0, Math.min(1, r / 255)),
    Math.max(0, Math.min(1, g / 255)),
    Math.max(0, Math.min(1, b / 255)),
  ];
}

/**
 * Convert B-V color index directly to sRGB [r, g, b] in [0, 1].
 * This is the primary function used by the catalog star renderer.
 */
export function bvToRgb(bv: number): [number, number, number] {
  const temp = bvToTemperature(bv);
  return temperatureToRgb(temp);
}

/**
 * Cached lookup table for B-V → RGB conversion.
 * Pre-computes 256 entries covering B-V range [-0.4, 2.0].
 */
const BV_LUT_SIZE = 256;
const BV_MIN = -0.4;
const BV_MAX = 2.0;
const BV_RANGE = BV_MAX - BV_MIN;
let bvLut: Float32Array | null = null;

function ensureLut(): Float32Array {
  if (bvLut) return bvLut;
  bvLut = new Float32Array(BV_LUT_SIZE * 3);
  for (let i = 0; i < BV_LUT_SIZE; i++) {
    const bv = BV_MIN + (i / (BV_LUT_SIZE - 1)) * BV_RANGE;
    const [r, g, b] = bvToRgb(bv);
    bvLut[i * 3 + 0] = r;
    bvLut[i * 3 + 1] = g;
    bvLut[i * 3 + 2] = b;
  }
  return bvLut;
}

/**
 * Fast B-V → RGB using pre-computed lookup table with linear interpolation.
 * Use this for batch processing of many stars.
 */
export function bvToRgbFast(bv: number): [number, number, number] {
  const lut = ensureLut();
  const t = (Math.max(BV_MIN, Math.min(BV_MAX, bv)) - BV_MIN) / BV_RANGE;
  const fi = t * (BV_LUT_SIZE - 1);
  const i0 = Math.floor(fi);
  const i1 = Math.min(i0 + 1, BV_LUT_SIZE - 1);
  const frac = fi - i0;

  return [
    lut[i0 * 3 + 0] * (1 - frac) + lut[i1 * 3 + 0] * frac,
    lut[i0 * 3 + 1] * (1 - frac) + lut[i1 * 3 + 1] * frac,
    lut[i0 * 3 + 2] * (1 - frac) + lut[i1 * 3 + 2] * frac,
  ];
}
