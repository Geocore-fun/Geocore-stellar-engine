/**
 * Color conversion utilities.
 */

import type { Color3, Color4, HexColor } from '@/types';

/** Convert hex color string to RGB floats [0..1] */
export function hexToRgb(hex: HexColor): Color3 {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16) / 255;
  const g = parseInt(cleaned.substring(2, 4), 16) / 255;
  const b = parseInt(cleaned.substring(4, 6), 16) / 255;
  return [r, g, b];
}

/** Convert hex color string to RGBA floats [0..1] */
export function hexToRgba(hex: HexColor, alpha = 1.0): Color4 {
  const [r, g, b] = hexToRgb(hex);
  return [r, g, b, alpha];
}

/** Convert RGB floats [0..1] to hex string */
export function rgbToHex(r: number, g: number, b: number): HexColor {
  const toHex = (c: number) =>
    Math.round(Math.max(0, Math.min(1, c)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}` as HexColor;
}

/** Linear to sRGB conversion for a single channel */
export function linearToSrgb(c: number): number {
  if (c <= 0.0031308) return 12.92 * c;
  return 1.055 * Math.pow(c, 1.0 / 2.4) - 0.055;
}

/** sRGB to linear conversion for a single channel */
export function srgbToLinear(c: number): number {
  if (c <= 0.04045) return c / 12.92;
  return Math.pow((c + 0.055) / 1.055, 2.4);
}
