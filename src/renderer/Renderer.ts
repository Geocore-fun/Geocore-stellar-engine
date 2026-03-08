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
    // Don't call WEBGL_lose_context — it permanently destroys the context
    // on the canvas, breaking re-initialization (e.g. React Strict Mode).
    // Individual resources (programs, buffers, textures) are cleaned up
    // by the layers and pipeline that own them.
  }
}
