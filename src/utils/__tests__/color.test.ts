/**
 * Unit tests for color conversion utilities.
 */

import { hexToRgb, hexToRgba, linearToSrgb, rgbToHex, srgbToLinear } from '@/utils/color';
import { describe, expect, it } from 'vitest';

describe('hexToRgb', () => {
  it('converts black', () => {
    expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
  });

  it('converts white', () => {
    expect(hexToRgb('#ffffff')).toEqual([1, 1, 1]);
  });

  it('converts red', () => {
    expect(hexToRgb('#ff0000')).toEqual([1, 0, 0]);
  });

  it('converts green', () => {
    expect(hexToRgb('#00ff00')).toEqual([0, 1, 0]);
  });

  it('converts blue', () => {
    expect(hexToRgb('#0000ff')).toEqual([0, 0, 1]);
  });

  it('converts mid-gray', () => {
    const [r, g, b] = hexToRgb('#808080');
    expect(r).toBeCloseTo(0.502, 2);
    expect(g).toBeCloseTo(0.502, 2);
    expect(b).toBeCloseTo(0.502, 2);
  });

  it('handles hex without #', () => {
    expect(hexToRgb('ff8000' as `#${string}`)).toEqual([1, 128 / 255, 0]);
  });
});

describe('hexToRgba', () => {
  it('converts with default alpha', () => {
    expect(hexToRgba('#ff0000')).toEqual([1, 0, 0, 1]);
  });

  it('converts with custom alpha', () => {
    expect(hexToRgba('#ff0000', 0.5)).toEqual([1, 0, 0, 0.5]);
  });
});

describe('rgbToHex', () => {
  it('converts black', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('converts white', () => {
    expect(rgbToHex(1, 1, 1)).toBe('#ffffff');
  });

  it('converts primary colors', () => {
    expect(rgbToHex(1, 0, 0)).toBe('#ff0000');
    expect(rgbToHex(0, 1, 0)).toBe('#00ff00');
    expect(rgbToHex(0, 0, 1)).toBe('#0000ff');
  });

  it('clamps out-of-range values', () => {
    expect(rgbToHex(1.5, -0.5, 0.5)).toBe('#ff0080');
  });

  it('roundtrips with hexToRgb', () => {
    const hex = '#3a7f2c';
    const [r, g, b] = hexToRgb(hex);
    expect(rgbToHex(r, g, b)).toBe(hex);
  });
});

describe('sRGB / Linear conversions', () => {
  it('linearToSrgb converts 0 to 0', () => {
    expect(linearToSrgb(0)).toBe(0);
  });

  it('linearToSrgb converts 1 to 1', () => {
    expect(linearToSrgb(1)).toBeCloseTo(1, 10);
  });

  it('srgbToLinear converts 0 to 0', () => {
    expect(srgbToLinear(0)).toBe(0);
  });

  it('srgbToLinear converts 1 to 1', () => {
    expect(srgbToLinear(1)).toBeCloseTo(1, 10);
  });

  it('roundtrips linear → sRGB → linear', () => {
    const values = [0.0, 0.01, 0.1, 0.18, 0.5, 0.73, 1.0];
    for (const v of values) {
      const roundtripped = srgbToLinear(linearToSrgb(v));
      expect(roundtripped).toBeCloseTo(v, 8);
    }
  });

  it('sRGB mid-gray (0.5) maps to approximately linear 0.214', () => {
    const linear = srgbToLinear(0.5);
    expect(linear).toBeCloseTo(0.214, 2);
  });
});
