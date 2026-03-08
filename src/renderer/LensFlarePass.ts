/**
 * LensFlarePass — renders analytical lens flare elements per cubemap face.
 *
 * Draws ghost elements and a halo ring along the sun-center axis
 * using purely additive blending (no scene sampling required).
 */

import { FullscreenQuad } from '@/renderer/FullscreenQuad';
import type { Renderer } from '@/renderer/Renderer';

import lensFlareFragSrc from '@/shaders/lens-flare.frag.glsl?raw';
import postprocessVertSrc from '@/shaders/postprocess.vert.glsl?raw';

export interface LensFlareParams {
  enabled: boolean;
  /** Overall intensity (0-2) */
  intensity: number;
  /** Number of ghost elements (1-8) */
  ghostCount: number;
  /** Spacing between ghosts (0.1-1.0) */
  ghostSpacing: number;
  /** Halo ring radius from center (0.1-0.8) */
  haloRadius: number;
  /** Halo ring brightness (0-1) */
  haloIntensity: number;
  /** Chromatic aberration amount (0-1) */
  chromaticAberration: number;
}

export class LensFlarePass {
  private gl: WebGL2RenderingContext;
  private quad: FullscreenQuad;
  private program: WebGLProgram;

  // Uniform locations
  private uSunUV: WebGLUniformLocation | null;
  private uSunVisible: WebGLUniformLocation | null;
  private uIntensity: WebGLUniformLocation | null;
  private uGhostCount: WebGLUniformLocation | null;
  private uGhostSpacing: WebGLUniformLocation | null;
  private uHaloRadius: WebGLUniformLocation | null;
  private uHaloIntensity: WebGLUniformLocation | null;
  private uChromatic: WebGLUniformLocation | null;

  constructor(renderer: Renderer) {
    this.gl = renderer.gl;
    this.quad = new FullscreenQuad(this.gl);
    this.program = renderer.createProgram(postprocessVertSrc, lensFlareFragSrc);

    const { gl } = this;
    this.uSunUV = gl.getUniformLocation(this.program, 'uSunUV');
    this.uSunVisible = gl.getUniformLocation(this.program, 'uSunVisible');
    this.uIntensity = gl.getUniformLocation(this.program, 'uIntensity');
    this.uGhostCount = gl.getUniformLocation(this.program, 'uGhostCount');
    this.uGhostSpacing = gl.getUniformLocation(this.program, 'uGhostSpacing');
    this.uHaloRadius = gl.getUniformLocation(this.program, 'uHaloRadius');
    this.uHaloIntensity = gl.getUniformLocation(this.program, 'uHaloIntensity');
    this.uChromatic = gl.getUniformLocation(this.program, 'uChromatic');
  }

  /**
   * Apply lens flare to the currently bound cubemap face.
   * Uses purely additive blending — no scene copy needed.
   */
  apply(
    sunUV: [number, number],
    sunVisible: boolean,
    faceSize: number,
    params: LensFlareParams,
  ): void {
    if (!params.enabled || !sunVisible) return;

    const { gl } = this;

    gl.viewport(0, 0, faceSize, faceSize);
    gl.useProgram(this.program);

    // Additive blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    gl.uniform2f(this.uSunUV, sunUV[0], sunUV[1]);
    gl.uniform1f(this.uSunVisible, 1.0);
    gl.uniform1f(this.uIntensity, params.intensity);
    gl.uniform1i(this.uGhostCount, params.ghostCount);
    gl.uniform1f(this.uGhostSpacing, params.ghostSpacing);
    gl.uniform1f(this.uHaloRadius, params.haloRadius);
    gl.uniform1f(this.uHaloIntensity, params.haloIntensity);
    gl.uniform1f(this.uChromatic, params.chromaticAberration);

    this.quad.draw();

    // Restore normal blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  /** Clean up GPU resources */
  dispose(): void {
    const { gl } = this;
    gl.deleteProgram(this.program);
    this.quad.dispose();
  }
}
