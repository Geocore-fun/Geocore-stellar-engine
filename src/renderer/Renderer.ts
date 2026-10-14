/**
 * WebGL2 rendering context manager.
 *
 * Owns the WebGL2 context, manages framebuffers for cubemap rendering,
 * and provides utility methods for shader compilation and resource management.
 */

export interface RendererOptions {
  /** Canvas element to render into */
  canvas: HTMLCanvasElement;
  /** Resolution of each cubemap face in pixels */
  faceSize: number;
  /** Whether to use antialiasing for preview */
  antialias?: boolean;
}

export class Renderer {
  readonly gl: WebGL2RenderingContext;
  readonly canvas: HTMLCanvasElement;
  private _faceSize: number;
  private _pendingLoads = 0;

  /**
   * Called whenever a tracked asset load starts or settles. The owner uses it
   * to show a loading state and, on settle, to re-render: a layer whose data
   * arrives after the first frame has nothing else to tell anyone it changed.
   */
  onAssetsChanged: ((pendingLoads: number) => void) | null = null;

  constructor(options: RendererOptions) {
    this.canvas = options.canvas;
    this._faceSize = options.faceSize;

    const gl = this.canvas.getContext('webgl2', {
      antialias: options.antialias ?? false,
      alpha: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });

    if (!gl) {
      throw new Error('WebGL2 is not supported in this browser');
    }

    this.gl = gl;
    this._initState();
  }

  get faceSize(): number {
    return this._faceSize;
  }

  set faceSize(size: number) {
    this._faceSize = size;
  }

  /** Initialize default GL state */
  private _initState(): void {
    const { gl } = this;
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 1);
  }

  /** Number of asset loads (catalogues, label data) still in flight. */
  get pendingLoads(): number {
    return this._pendingLoads;
  }

  /**
   * Register an async asset load owned by a layer. The promise is expected to
   * handle its own errors; whatever the outcome, settling it notifies
   * {@link onAssetsChanged} so the cubemap is redrawn with the new data.
   */
  trackLoad(load: Promise<unknown>): void {
    this._pendingLoads++;
    this.onAssetsChanged?.(this._pendingLoads);
    const settle = () => {
      this._pendingLoads--;
      this.onAssetsChanged?.(this._pendingLoads);
    };
    // then(settle, settle) rather than finally(): finally() re-throws, which
    // would surface an unhandled rejection for a load the layer already handled.
    void load.then(settle, settle);
  }

  /** Compile a shader from source */
  compileShader(type: GLenum, source: string): WebGLShader {
    const { gl } = this;
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader');

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compilation failed:\n${info}`);
    }

    return shader;
  }

  /** Link a vertex + fragment shader into a program */
  createProgram(vertexSrc: string, fragmentSrc: string): WebGLProgram {
    const { gl } = this;
    const vs = this.compileShader(gl.VERTEX_SHADER, vertexSrc);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fragmentSrc);

    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create program');

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Program linking failed:\n${info}`);
    }

    // Shaders can be deleted after linking
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    return program;
  }

  /** Set the viewport to the given face size */
  setViewport(size?: number): void {
    const s = size ?? this._faceSize;
    this.gl.viewport(0, 0, s, s);
  }

  /** Clear the current framebuffer */
  clear(): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  /** Read pixels from the current framebuffer as RGBA Uint8Array */
  readPixels(width: number, height: number): Uint8Array {
    const { gl } = this;
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return pixels;
  }

  /** Clean up all GL resources */
  dispose(): void {
    // A load that settles after disposal must not poke the next pipeline's owner.
    this.onAssetsChanged = null;
    // Don't call WEBGL_lose_context — it permanently destroys the context
    // on the canvas, breaking re-initialization (e.g. React Strict Mode).
    // Individual resources (programs, buffers, textures) are cleaned up
    // by the layers and pipeline that own them.
  }
}
