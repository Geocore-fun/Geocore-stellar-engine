/**
 * Unit tests for the PerfMonitor utility.
 */

import { PerfMonitor } from '@/utils/perfMonitor';
import { beforeEach, describe, expect, it } from 'vitest';

describe('PerfMonitor', () => {
  let monitor: PerfMonitor;

  beforeEach(() => {
    monitor = new PerfMonitor();
  });

  it('starts with zero stats', () => {
    const stats = monitor.getStats();
    expect(stats.fps).toBe(0);
    expect(stats.avgFrameMs).toBe(0);
    expect(stats.avgCubemapMs).toBe(0);
    expect(stats.lastCubemapMs).toBe(0);
  });

  it('records cubemap render times', () => {
    monitor.recordCubemapRender(10);
    monitor.recordCubemapRender(20);
    monitor.recordCubemapRender(30);

    expect(monitor.avgCubemapTime).toBe(20);
    expect(monitor.lastCubemapTime).toBe(30);
  });

  it('timeCubemapRender measures a function', () => {
    const elapsed = monitor.timeCubemapRender(() => {
      // Simulate a tiny bit of work
      let sum = 0;
      for (let i = 0; i < 1000; i++) sum += i;
      return sum;
    });

    expect(elapsed).toBeGreaterThanOrEqual(0);
    expect(monitor.lastCubemapTime).toBe(elapsed);
  });

  it('frameStart/frameEnd records timing', () => {
    const start = monitor.frameStart();
    // Simulate a small delay — just tests the API path
    monitor.frameEnd(start);

    expect(monitor.avgFrameTime).toBeGreaterThanOrEqual(0);
  });

  it('reset clears all data', () => {
    monitor.recordCubemapRender(50);
    monitor.recordCubemapRender(60);
    monitor.reset();

    expect(monitor.avgCubemapTime).toBe(0);
    expect(monitor.lastCubemapTime).toBe(0);
    expect(monitor.fps).toBe(0);
  });

  it('maintains rolling window of 60 entries', () => {
    // Add 100 cubemap times
    for (let i = 0; i < 100; i++) {
      monitor.recordCubemapRender(i);
    }

    // Average should only use last 60 values (40..99)
    const expected = ((40 + 99) * 60) / 2 / 60; // sum of 40..99 / 60
    expect(monitor.avgCubemapTime).toBeCloseTo(expected, 5);
    expect(monitor.lastCubemapTime).toBe(99);
  });
});
