/**
 * GodRayPass — volumetric light scattering post-processing effect.
 *
 * Pipeline per cubemap face:
 *   1. Copy rendered face to a temp FBO
 *   2. Render radial blur from sun position (sampling temp FBO)
 *   3. Additively composite onto the cubemap face
 *
 * Uses 1 temporary 2D framebuffer at the cubemap face resolution.
 */

import { FullscreenQuad } from '@/renderer/FullscreenQuad';
import type { Renderer } from '@/renderer/Renderer';

import godRaysFragSrc from '@/shaders/god-rays.frag.glsl?raw';
import postprocessVertSrc from '@/shaders/postprocess.vert.glsl?raw';

export interface GodRayParams {
  enabled: boolean;
  /** Overall ray brightness (0-1) */
  exposure: number;
  /** Decay factor per sample along ray (0.9-1.0) */
  decay: number;
  /** Ray sampling density (0.1-2.0) */
  density: number;
  /** Individual sample weight (0-1) */
  weight: number;
}

/** Wraps a 2D texture + framebuffer pair */
interface RTTexture {
  fbo: WebGLFramebuffer;
  texture: WebGLTexture;
}

export class GodRayPass {
  private gl: WebGL2RenderingContext;
  private quad: FullscreenQuad;
  private program: WebGLProgram;
  private sceneFBO!: RTTexture;
  private currentSize = 0;

  // Uniform locations
  private uScene: WebGLUniformLocation | null;
  private uSunUV: WebGLUniformLocation | null;
  private uSunVisible: WebGLUniformLocation | null;
  private uExposure: WebGLUniformLocation | null;
  private uDecay: WebGLUniformLocation | null;
  private uDensity: WebGLUniformLocation | null;
  private uWeight: WebGLUniformLocation | null;

  constructor(renderer: Renderer, faceSize: number) {
    this.gl = renderer.gl;
    this.quad = new FullscreenQuad(this.gl);
    this.program = renderer.createProgram(postprocessVertSrc, godRaysFragSrc);

    const { gl } = this;
    this.uScene = gl.getUniformLocation(this.program, 'uScene');
    this.uSunUV = gl.getUniformLocation(this.program, 'uSunUV');
    this.uSunVisible = gl.getUniformLocation(this.program, 'uSunVisible');
    this.uExposure = gl.getUniformLocation(this.program, 'uExposure');
    this.uDecay = gl.getUniformLocation(this.program, 'uDecay');
    this.uDensity = gl.getUniformLocation(this.program, 'uDensity');
    this.uWeight = gl.getUniformLocation(this.program, 'uWeight');

    this._createFBO(faceSize);
  }

  private _createFBO(size: number): void {
    if (this.currentSize === size) return;
    if (this.currentSize > 0) this._disposeFBO();

    const { gl } = this;

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.sceneFBO = { fbo, texture };
    this.currentSize = size;
  }

  private _disposeFBO(): void {
    const { gl } = this;
    gl.deleteFramebuffer(this.sceneFBO.fbo);
    gl.deleteTexture(this.sceneFBO.texture);
  }

  /**
   * Apply god rays to the currently bound cubemap face.
   *
   * @param cubemapFBOHandle - Handle to the cubemap FBO (face already bound)
   * @param sunUV - The sun's projected UV position on this face
   * @param sunVisible - Whether the sun is close enough to this face
   * @param faceSize - Resolution of each cubemap face
   * @param params - God ray parameters
   */
  apply(
    cubemapFBOHandle: WebGLFramebuffer,
    sunUV: [number, number],
    sunVisible: boolean,
    faceSize: number,
    params: GodRayParams,
  ): void {
    if (!params.enabled || !sunVisible) return;

    const { gl } = this;
    this._createFBO(faceSize);

    // Step 1: Copy current face to temp FBO
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, cubemapFBOHandle);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.sceneFBO.fbo);
    gl.blitFramebuffer(
      0,
      0,
      faceSize,
      faceSize,
      0,
      0,
      faceSize,
      faceSize,
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST,
    );

    // Step 2: Render god rays additively onto cubemap face
    gl.bindFramebuffer(gl.FRAMEBUFFER, cubemapFBOHandle);
    gl.viewport(0, 0, faceSize, faceSize);

    gl.useProgram(this.program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneFBO.texture);
    gl.uniform1i(this.uScene, 0);
    gl.uniform2f(this.uSunUV, sunUV[0], sunUV[1]);
    gl.uniform1f(this.uSunVisible, 1.0);
    gl.uniform1f(this.uExposure, params.exposure);
    gl.uniform1f(this.uDecay, params.decay);
    gl.uniform1f(this.uDensity, params.density);
    gl.uniform1f(this.uWeight, params.weight);

    this.quad.draw();

    // Restore normal blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  /** Resize internal FBO to match new face size */
  resize(faceSize: number): void {
    this._createFBO(faceSize);
  }

  /** Clean up all GPU resources */
  dispose(): void {
    const { gl } = this;
    this._disposeFBO();
    gl.deleteProgram(this.program);
    this.quad.dispose();
  }
}
