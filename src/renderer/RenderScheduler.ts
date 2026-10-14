/**
 * Demand-driven frame scheduler for the preview.
 *
 * Nothing renders unless something asked for it: a parameter change marks the
 * cubemap dirty, a camera move or resize marks only the preview dirty, and
 * both coalesce into at most one frame per animation tick. Idle, the GPU does
 * no work at all.
 *
 * Why this exists: the old loop lived inside a React effect whose dependencies
 * changed on every camera move, and on first load the effect that started it
 * ran in the gap between the pipeline being torn down and rebuilt. Nothing then
 * changed state, so the canvas stayed black until the user dragged. Holding the
 * dirty flags here, outside React, means a request can never be lost to effect
 * ordering: whoever owns a pipeline calls `invalidate*()` and a frame follows.
 */

export interface FrameWork {
  /** Re-render all six cubemap faces before presenting. */
  renderCubemap: boolean;
}

/**
 * Draws one frame. Returns true when it needs another frame even though
 * nothing new was invalidated (e.g. polling an async GPU readback).
 */
export type DrawFrame = (work: FrameWork) => boolean;

export class RenderScheduler {
  private rafId = 0;
  private cubemapDirty = true;
  private previewDirty = true;
  private wantsFollowUp = false;
  private suspended = false;
  private disposed = false;

  private readonly drawFrame: DrawFrame;

  constructor(drawFrame: DrawFrame) {
    this.drawFrame = drawFrame;
  }

  /** Scene parameters or loaded data changed: re-render the cubemap. */
  invalidateCubemap(): void {
    this.cubemapDirty = true;
    this.schedule();
  }

  /** Only the view changed (camera, canvas size, tab shown again). */
  invalidatePreview(): void {
    this.previewDirty = true;
    this.schedule();
  }

  /**
   * Draw now, synchronously, if anything is pending. Used after a canvas
   * resize: changing a canvas's size clears it, and waiting for the next
   * animation frame would flash one black frame mid-resize.
   */
  flush(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.tick();
  }

  /**
   * Stop drawing while something else owns the GL context (an export renders
   * at other sizes and yields between tiles). Requests made meanwhile are kept
   * and honoured on resume.
   */
  suspend(): void {
    this.suspended = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  resume(): void {
    if (!this.suspended) return;
    this.suspended = false;
    this.schedule();
  }

  get isSuspended(): boolean {
    return this.suspended;
  }

  dispose(): void {
    this.disposed = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private hasWork(): boolean {
    return this.cubemapDirty || this.previewDirty || this.wantsFollowUp;
  }

  private schedule(): void {
    if (this.disposed || this.suspended || this.rafId || !this.hasWork()) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.tick();
    });
  }

  private tick(): void {
    if (this.disposed || this.suspended || !this.hasWork()) return;

    const work: FrameWork = { renderCubemap: this.cubemapDirty };
    // Clear before drawing so an invalidation raised during the draw (e.g. a
    // store listener reacting to it) schedules a fresh frame instead of being
    // wiped out by the end of this one.
    this.cubemapDirty = false;
    this.previewDirty = false;
    this.wantsFollowUp = false;

    let followUp = false;
    try {
      followUp = this.drawFrame(work);
    } catch (err) {
      // A throwing frame must not wedge the scheduler; the next request retries.
      console.error('[RenderScheduler] Frame failed:', err);
    }

    this.wantsFollowUp = followUp;
    this.schedule();
  }
}
