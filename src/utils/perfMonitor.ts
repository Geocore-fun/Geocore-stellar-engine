/**
 * Lightweight performance monitoring for render timing.
 *
 * Tracks cubemap render times, preview frame times, and FPS.
 * Uses a rolling window for stable averages.
 */

const WINDOW_SIZE = 60;

export class PerfMonitor {
  private frameTimes: number[] = [];
  private cubemapTimes: number[] = [];
  private frameCount = 0;
  private fpsUpdateInterval = 500; // ms
  private lastFpsUpdate = 0;
  private currentFps = 0;

  /** Call at the start of each frame */
  frameStart(): number {
    return performance.now();
  }

  /** Call at the end of each frame to record timing */
  frameEnd(startTime: number): void {
    const elapsed = performance.now() - startTime;
    this.frameTimes.push(elapsed);
    if (this.frameTimes.length > WINDOW_SIZE) {
      this.frameTimes.shift();
    }
    this.frameCount++;

    const now = performance.now();
    if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  /** Record a cubemap render duration */
  recordCubemapRender(durationMs: number): void {
    this.cubemapTimes.push(durationMs);
    if (this.cubemapTimes.length > WINDOW_SIZE) {
      this.cubemapTimes.shift();
    }
  }

  /** Time a cubemap render call */
  timeCubemapRender(fn: () => void): number {
    const start = performance.now();
    fn();
    const elapsed = performance.now() - start;
    this.recordCubemapRender(elapsed);
    return elapsed;
  }

  /** Get current FPS */
  get fps(): number {
    return this.currentFps;
  }

  /** Average frame time in ms (preview render) */
  get avgFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }

  /** Average cubemap render time in ms */
  get avgCubemapTime(): number {
    if (this.cubemapTimes.length === 0) return 0;
    const sum = this.cubemapTimes.reduce((a, b) => a + b, 0);
    return sum / this.cubemapTimes.length;
  }

  /** Last cubemap render time in ms */
  get lastCubemapTime(): number {
    return this.cubemapTimes.length > 0 ? this.cubemapTimes[this.cubemapTimes.length - 1] : 0;
  }

  /** Get a formatted stats object */
  getStats(): PerfStats {
    return {
      fps: this.currentFps,
      avgFrameMs: Math.round(this.avgFrameTime * 100) / 100,
      avgCubemapMs: Math.round(this.avgCubemapTime * 100) / 100,
      lastCubemapMs: Math.round(this.lastCubemapTime * 100) / 100,
    };
  }

  /** Reset all timing data */
  reset(): void {
    this.frameTimes = [];
    this.cubemapTimes = [];
    this.frameCount = 0;
    this.currentFps = 0;
    this.lastFpsUpdate = performance.now();
  }
}

export interface PerfStats {
  fps: number;
  avgFrameMs: number;
  avgCubemapMs: number;
  lastCubemapMs: number;
}

/** Singleton instance for app-wide perf tracking */
export const perfMonitor = new PerfMonitor();
