/**
 * BloomPass — multi-pass bloom post-processing effect.
 *
 * Pipeline per cubemap face:
 *   1. Copy rendered face → scene texture
 *   2. Extract bright pixels above threshold → bright FBO
 *   3. Ping-pong separable Gaussian blur (H→V, repeated)
 *   4. Composite: scene + blurred bloom → cubemap face
 *
 * Uses 3 temporary 2D framebuffers at the cubemap face resolution.
 */

import { FullscreenQuad } from '@/renderer/FullscreenQuad';
import type { Renderer } from '@/renderer/Renderer';

import blurFragSrc from '@/shaders/bloom-blur.frag.glsl?raw';
import compositeFragSrc from '@/shaders/bloom-composite.frag.glsl?raw';
import extractFragSrc from '@/shaders/bloom-extract.frag.glsl?raw';
import postprocessVertSrc from '@/shaders/postprocess.vert.glsl?raw';

export interface BloomParams {
  enabled: boolean;
  /** Luminance threshold for bright extraction (0–1) */
  threshold: number;
  /** Soft knee for smooth threshold falloff (0–1) */
  softKnee: number;
  /** Bloom intensity multiplier (0–5) */
  intensity: number;
  /** Blur radius / iterations (1–8) */
  iterations: number;
}

/** Wraps a 2D RGBA8 texture + framebuffer pair */
interface RTTexture {
  fbo: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
}

export class BloomPass {
  private gl: WebGL2RenderingContext;
  private quad: FullscreenQuad;

  // FBOs
  private sceneFBO!: RTTexture;
  private pingFBO!: RTTexture;
  private pongFBO!: RTTexture;

  // Programs
  private extractProgram: WebGLProgram;
  private blurProgram: WebGLProgram;
  private compositeProgram: WebGLProgram;
  /** Simple blit program (copies scene texture to output 1:1) */
  private blitProgram: WebGLProgram;

  // Uniform locations — extract
  private uExtractScene: WebGLUniformLocation | null;
  private uExtractThreshold: WebGLUniformLocation | null;
  private uExtractSoftKnee: WebGLUniformLocation | null;

  // Uniform locations — blur
  private uBlurTexture: WebGLUniformLocation | null;
  private uBlurDirection: WebGLUniformLocation | null;

  // Uniform locations — composite
  private uCompositeScene: WebGLUniformLocation | null;
  private uCompositeBloom: WebGLUniformLocation | null;
  private uCompositeIntensity: WebGLUniformLocation | null;

  private currentSize = 0;

  constructor(renderer: Renderer, faceSize: number) {
    this.gl = renderer.gl;
    this.quad = new FullscreenQuad(this.gl);

    // Compile programs
    this.extractProgram = renderer.createProgram(postprocessVertSrc, extractFragSrc);
    this.blurProgram = renderer.createProgram(postprocessVertSrc, blurFragSrc);
    this.compositeProgram = renderer.createProgram(postprocessVertSrc, compositeFragSrc);

    // Simple blit shader (just copies a texture)
    const blitFragSrc = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 fragColor;
uniform sampler2D uTexture;
void main() { fragColor = texture(uTexture, vUV); }
`;
    this.blitProgram = renderer.createProgram(postprocessVertSrc, blitFragSrc);

    // Get uniform locations
    const { gl } = this;
    this.uExtractScene = gl.getUniformLocation(this.extractProgram, 'uScene');
    this.uExtractThreshold = gl.getUniformLocation(this.extractProgram, 'uThreshold');
    this.uExtractSoftKnee = gl.getUniformLocation(this.extractProgram, 'uSoftKnee');

    this.uBlurTexture = gl.getUniformLocation(this.blurProgram, 'uTexture');
    this.uBlurDirection = gl.getUniformLocation(this.blurProgram, 'uDirection');

    this.uCompositeScene = gl.getUniformLocation(this.compositeProgram, 'uScene');
    this.uCompositeBloom = gl.getUniformLocation(this.compositeProgram, 'uBloom');
    this.uCompositeIntensity = gl.getUniformLocation(this.compositeProgram, 'uIntensity');

    // uBlitTexture not needed — blit uses texture unit 0 default

    // Create FBOs
    this._createFBOs(faceSize);
  }

  /** Create or resize the 3 temporary FBOs */
  private _createFBOs(size: number): void {
    if (this.currentSize === size) return;

    // Dispose old FBOs if resizing
    if (this.currentSize > 0) {
      this._disposeFBO(this.sceneFBO);
      this._disposeFBO(this.pingFBO);
      this._disposeFBO(this.pongFBO);
    }

    this.sceneFBO = this._createRT(size, size);
    this.pingFBO = this._createRT(size, size);
    this.pongFBO = this._createRT(size, size);
    this.currentSize = size;
  }

  /** Create a render target (2D texture + FBO) */
  private _createRT(width: number, height: number): RTTexture {
    const { gl } = this;

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return { fbo, texture, width, height };
  }

  private _disposeFBO(rt: RTTexture): void {
    const { gl } = this;
    gl.deleteFramebuffer(rt.fbo);
    gl.deleteTexture(rt.texture);
  }

  /**
   * Apply bloom post-processing to the currently bound cubemap face.
   *
   * @param cubemapFBO - The cubemap framebuffer currently bound to the face
   * @param faceSize - Resolution of each cubemap face
   * @param params - Bloom parameters
   */
  apply(cubemapFBOHandle: WebGLFramebuffer, faceSize: number, params: BloomParams): void {
    if (!params.enabled) return;

    const { gl } = this;

    // Ensure FBOs are the right size
    this._createFBOs(faceSize);

    // ── Step 1: Copy the current cubemap face to sceneFBO ──
    // Use blit framebuffer for efficiency
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

    // ── Step 2: Extract bright pixels ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pingFBO.fbo);
    gl.viewport(0, 0, faceSize, faceSize);
    gl.disable(gl.BLEND);

    gl.useProgram(this.extractProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneFBO.texture);
    gl.uniform1i(this.uExtractScene, 0);
    gl.uniform1f(this.uExtractThreshold, params.threshold);
    gl.uniform1f(this.uExtractSoftKnee, params.softKnee);
    this.quad.draw();

    // ── Step 3: Ping-pong Gaussian blur ──
    gl.useProgram(this.blurProgram);
    gl.uniform1i(this.uBlurTexture, 0);

    for (let i = 0; i < params.iterations; i++) {
      // Horizontal blur: ping → pong
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.pongFBO.fbo);
      gl.viewport(0, 0, faceSize, faceSize);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.pingFBO.texture);
      gl.uniform2f(this.uBlurDirection, 1.0 / faceSize, 0);
      this.quad.draw();

      // Vertical blur: pong → ping
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.pingFBO.fbo);
      gl.viewport(0, 0, faceSize, faceSize);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.pongFBO.texture);
      gl.uniform2f(this.uBlurDirection, 0, 1.0 / faceSize);
      this.quad.draw();
    }

    // ── Step 4: Composite scene + bloom → cubemap face ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, cubemapFBOHandle);
    gl.viewport(0, 0, faceSize, faceSize);

    gl.useProgram(this.compositeProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneFBO.texture);
    gl.uniform1i(this.uCompositeScene, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.pingFBO.texture);
    gl.uniform1i(this.uCompositeBloom, 1);

    gl.uniform1f(this.uCompositeIntensity, params.intensity);
    this.quad.draw();

    // Reset state
    gl.activeTexture(gl.TEXTURE0);
    gl.enable(gl.BLEND);
  }

  /** Resize internal FBOs to match new face size */
  resize(faceSize: number): void {
    this._createFBOs(faceSize);
  }

  /** Clean up all GPU resources */
  dispose(): void {
    const { gl } = this;
    this._disposeFBO(this.sceneFBO);
    this._disposeFBO(this.pingFBO);
    this._disposeFBO(this.pongFBO);
    this.quad.dispose();
    gl.deleteProgram(this.extractProgram);
    gl.deleteProgram(this.blurProgram);
    gl.deleteProgram(this.compositeProgram);
    gl.deleteProgram(this.blitProgram);
  }
}
