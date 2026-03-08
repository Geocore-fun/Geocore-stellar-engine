/**
 * Unit tests for SeededRNG — determinism and distribution.
 */

import { SeededRNG } from '@/utils/rng';
import { describe, expect, it } from 'vitest';

describe('SeededRNG', () => {
  it('produces deterministic sequences for the same seed', () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(42);
    const seq1 = Array.from({ length: 100 }, () => rng1.next());
    const seq2 = Array.from({ length: 100 }, () => rng2.next());
    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(43);
    const seq1 = Array.from({ length: 20 }, () => rng1.next());
    const seq2 = Array.from({ length: 20 }, () => rng2.next());
    expect(seq1).not.toEqual(seq2);
  });

  it('values are in [0, 1) range', () => {
    const rng = new SeededRNG(12345);
    for (let i = 0; i < 10000; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('range() returns values within bounds', () => {
    const rng = new SeededRNG(99);
    for (let i = 0; i < 1000; i++) {
      const val = rng.range(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThan(10);
    }
  });

  it('intRange() returns integers within inclusive bounds', () => {
    const rng = new SeededRNG(77);
    const values = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const val = rng.intRange(1, 6);
      expect(Number.isInteger(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
      values.add(val);
    }
    // Should hit all values 1-6 in 1000 tries
    expect(values.size).toBe(6);
  });

  it('gaussian() produces a reasonable mean', () => {
    const rng = new SeededRNG(555);
    const n = 10000;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += rng.gaussian(0, 1);
    }
    const mean = sum / n;
    // Mean should be close to 0 (within 0.05 for 10k samples)
    expect(Math.abs(mean)).toBeLessThan(0.05);
  });

  it('reset() restores the sequence', () => {
    const rng = new SeededRNG(42);
    const first5 = Array.from({ length: 5 }, () => rng.next());
    rng.reset(42);
    const reset5 = Array.from({ length: 5 }, () => rng.next());
    expect(first5).toEqual(reset5);
  });

  it('has reasonable uniformity distribution', () => {
    const rng = new SeededRNG(1337);
    const n = 10000;
    const buckets = new Array(10).fill(0);
    for (let i = 0; i < n; i++) {
      const val = rng.next();
      const bucket = Math.min(Math.floor(val * 10), 9);
      buckets[bucket]++;
    }
    const expected = n / 10;
    for (const count of buckets) {
      // Each bucket should be within ±10% of expected
      expect(count).toBeGreaterThan(expected * 0.85);
      expect(count).toBeLessThan(expected * 1.15);
    }
  });
});
