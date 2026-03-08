/**
 * Async pixel readback using Pixel Buffer Objects (PBOs) + fence sync.
 *
 * Standard `gl.readPixels` synchronously stalls the GPU pipeline,
 * which is especially costly when reading back histogram data every frame.
 *
 * This implementation uses:
 *   - PBO readPixels (non-blocking: GPU DMA's pixels into PBO)
 *   - gl.fenceSync to track when the GPU actually finishes the read
 *   - Non-blocking gl.clientWaitSync(TIMEOUT=0) to check readiness
 *   - Only calls gl.getBufferSubData when the fence has signaled
 *
 * If the GPU hasn't finished by the next poll, we skip and return null
 * (no stall). This means histogram data may lag by 1-3 frames under
 * heavy load instead of blocking the main thread.
 */

export class AsyncReadback {
  private gl: WebGL2RenderingContext;
  private pbos: WebGLBuffer[] = [];
  private fences: (WebGLSync | null)[] = [null, null];
  private currentPBO = 0;
  private width = 0;
  private height = 0;
  private lastPixels: Uint8Array | null = null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;

    // Create double-buffered PBOs
    for (let i = 0; i < 2; i++) {
      const pbo = gl.createBuffer();
      if (!pbo) throw new Error('Failed to create PBO');
      this.pbos.push(pbo);
    }
  }

  /**
   * Kick off an async read from the currently bound framebuffer,
   * and try to collect the result of a previous read if its fence
   * has signaled.
   *
   * Returns pixel data ONLY when a prior read is confirmed complete
   * by the GPU (fence signaled). Returns null otherwise — never blocks.
   *
   * @param width   Pixel width to read
   * @param height  Pixel height to read
   * @returns Completed pixel data, or null (no stall)
   */
  readAsync(width: number, height: number): Uint8Array | null {
    const { gl } = this;
    const byteSize = width * height * 4;

    // If dimensions changed, resize PBO buffers and discard pending fences
    if (width !== this.width || height !== this.height) {
      this.width = width;
      this.height = height;

      for (let i = 0; i < 2; i++) {
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, this.pbos[i]);
        gl.bufferData(gl.PIXEL_PACK_BUFFER, byteSize, gl.STREAM_READ);
        if (this.fences[i]) {
          gl.deleteSync(this.fences[i]!);
          this.fences[i] = null;
        }
      }
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    }

    let result: Uint8Array | null = null;

    // Try to collect the OTHER PBO's data (the one we wrote to last frame)
    const readIdx = 1 - this.currentPBO;
    const fence = this.fences[readIdx];
    if (fence) {
      // Non-blocking check: has the GPU finished the readPixels DMA?
      const status = gl.clientWaitSync(fence, 0, 0); // timeout = 0 → never block
      if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) {
        // GPU is done — safe to read without stalling
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, this.pbos[readIdx]);
        const data = new Uint8Array(byteSize);
        gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, data);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

        result = data;
        this.lastPixels = data;

        gl.deleteSync(fence);
        this.fences[readIdx] = null;
      }
      // If TIMEOUT_EXPIRED or WAIT_FAILED, skip — no stall, return null
    }

    // Kick off async read into the current PBO
    // Clean up any old fence on this slot first
    if (this.fences[this.currentPBO]) {
      gl.deleteSync(this.fences[this.currentPBO]!);
      this.fences[this.currentPBO] = null;
    }

    const writePBO = this.pbos[this.currentPBO];
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, writePBO);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, 0);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

    // Insert a fence sync so we know when this read completes
    this.fences[this.currentPBO] = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);

    this.currentPBO = 1 - this.currentPBO; // swap for next frame

    return result;
  }

  /** Get the most recently read pixel data (may be null if never read) */
  getLastPixels(): Uint8Array | null {
    return this.lastPixels;
  }

  /** Clean up PBO and sync resources */
  dispose(): void {
    const { gl } = this;
    for (let i = 0; i < this.pbos.length; i++) {
      gl.deleteBuffer(this.pbos[i]);
      if (this.fences[i]) gl.deleteSync(this.fences[i]!);
    }
    this.pbos = [];
    this.fences = [null, null];
    this.lastPixels = null;
  }
}
