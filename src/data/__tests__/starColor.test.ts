/**
 * Unit tests for B-V color index → RGB conversion.
 */

import { describe, expect, it } from 'vitest';

import { bvToRgb, bvToRgbFast, bvToTemperature, temperatureToRgb } from '@/data/starColor';

describe('bvToTemperature', () => {
  it('returns ~5780K for solar B-V (0.656)', () => {
    const temp = bvToTemperature(0.656);
    // Sun's effective temperature is ~5778K
    expect(temp).toBeGreaterThan(5500);
    expect(temp).toBeLessThan(6100);
  });

  it('returns high temperature for negative (blue) B-V', () => {
    const temp = bvToTemperature(-0.3);
    expect(temp).toBeGreaterThan(15000);
  });

  it('returns low temperature for high (red) B-V', () => {
    const temp = bvToTemperature(1.8);
    expect(temp).toBeLessThan(4000);
  });

  it('clamps B-V to valid range', () => {
    const tooBlue = bvToTemperature(-1.5);
    const minBlue = bvToTemperature(-0.4);
    expect(tooBlue).toBe(minBlue);

    const tooRed = bvToTemperature(5.0);
    const maxRed = bvToTemperature(2.0);
    expect(tooRed).toBe(maxRed);
  });

  it('temperature decreases monotonically with increasing B-V', () => {
    const bvValues = [-0.3, 0.0, 0.3, 0.656, 1.0, 1.5, 2.0];
    const temps = bvValues.map(bvToTemperature);
    for (let i = 1; i < temps.length; i++) {
      expect(temps[i]).toBeLessThan(temps[i - 1]);
    }
  });
});

describe('temperatureToRgb', () => {
  it('returns values in [0, 1] range', () => {
    for (const temp of [2000, 5778, 10000, 25000]) {
      const [r, g, b] = temperatureToRgb(temp);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(1);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(1);
    }
  });

  it('hot stars are blue-white (high blue, high red)', () => {
    const [r, , b] = temperatureToRgb(25000);
    expect(b).toBeGreaterThan(0.8);
    expect(r).toBeGreaterThan(0.5);
  });

  it('cool stars are reddish (high red, low blue)', () => {
    const [r, , b] = temperatureToRgb(3000);
    expect(r).toBeGreaterThan(b);
  });

  it('solar temperature gives warm white', () => {
    const [r, g, b] = temperatureToRgb(5778);
    // Should be yellowish-white
    expect(r).toBeGreaterThan(0.9);
    expect(g).toBeGreaterThan(0.8);
    expect(b).toBeGreaterThan(0.6);
  });
});

describe('bvToRgb', () => {
  it('returns 3-element tuple', () => {
    const result = bvToRgb(0.656);
    expect(result).toHaveLength(3);
  });

  it('blue stars (B-V < 0) have more blue than red', () => {
    const [r, , b] = bvToRgb(-0.3);
    expect(b).toBeGreaterThanOrEqual(r);
  });

  it('red stars (B-V > 1.5) have more red than blue', () => {
    const [r, , b] = bvToRgb(1.8);
    expect(r).toBeGreaterThan(b);
  });
});

describe('bvToRgbFast', () => {
  it('matches bvToRgb within interpolation tolerance', () => {
    const testBvs = [-0.3, 0.0, 0.3, 0.656, 1.0, 1.5, 2.0];
    for (const bv of testBvs) {
      const [r1, g1, b1] = bvToRgb(bv);
      const [r2, g2, b2] = bvToRgbFast(bv);
      // Allow small LUT interpolation error
      expect(r2).toBeCloseTo(r1, 1);
      expect(g2).toBeCloseTo(g1, 1);
      expect(b2).toBeCloseTo(b1, 1);
    }
  });

  it('clamps out-of-range B-V values', () => {
    // Should not throw
    const [r1, g1, b1] = bvToRgbFast(-2.0);
    expect(r1).toBeGreaterThanOrEqual(0);
    expect(g1).toBeGreaterThanOrEqual(0);
    expect(b1).toBeGreaterThanOrEqual(0);

    const [r2, g2, b2] = bvToRgbFast(5.0);
    expect(r2).toBeGreaterThanOrEqual(0);
    expect(g2).toBeGreaterThanOrEqual(0);
    expect(b2).toBeGreaterThanOrEqual(0);
  });
});
