/**
 * Async pixel readback using Pixel Buffer Objects (PBOs).
 *
 * Standard `gl.readPixels` synchronously stalls the GPU pipeline,
 * which is especially costly when reading back histogram data every frame.
 *
 * PBO readback uses a double-buffered scheme:
 *   1. Frame N: kick off async read into PBO A
 *   2. Frame N+1: read PBO A's result (GPU has had time to finish), kick off PBO B
 *   3. Frame N+2: read PBO B, kick off PBO A, etc.
 *
 * This gives a 1-frame latency on histogram data but eliminates GPU stalls.
 */

export class AsyncReadback {
  private gl: WebGL2RenderingContext;
  private pbos: WebGLBuffer[] = [];
  private currentPBO = 0;
  private width = 0;
  private height = 0;
  private pendingRead = false;
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
   * Kick off an async read from the currently bound framebuffer.
   * Returns the result from the PREVIOUS frame's read (or null if none ready).
   *
   * @param width   Pixel width to read
   * @param height  Pixel height to read
   * @returns Previous frame's pixel data, or null
   */
  readAsync(width: number, height: number): Uint8Array | null {
    const { gl } = this;
    const byteSize = width * height * 4;

    // If dimensions changed, resize PBO buffers
    if (width !== this.width || height !== this.height) {
      this.width = width;
      this.height = height;
      this.pendingRead = false;

      for (const pbo of this.pbos) {
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
        gl.bufferData(gl.PIXEL_PACK_BUFFER, byteSize, gl.STREAM_READ);
      }
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    }

    let result: Uint8Array | null = null;

    // Read previous frame's PBO if available
    if (this.pendingRead) {
      const readPBO = this.pbos[1 - this.currentPBO];
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, readPBO);

      // Check if data is ready using fence sync or just map
      const data = new Uint8Array(byteSize);
      gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, data);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

      result = data;
      this.lastPixels = data;
    }

    // Kick off async read into current PBO
    const writePBO = this.pbos[this.currentPBO];
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, writePBO);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, 0);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

    this.pendingRead = true;
    this.currentPBO = 1 - this.currentPBO; // swap

    return result;
  }

  /** Get the most recently read pixel data (may be null if never read) */
  getLastPixels(): Uint8Array | null {
    return this.lastPixels;
  }

  /** Clean up PBO resources */
  dispose(): void {
    for (const pbo of this.pbos) {
      this.gl.deleteBuffer(pbo);
    }
    this.pbos = [];
    this.lastPixels = null;
  }
}
