/**
 * SunLayer — renders a realistic sun with disk, corona, and atmospheric glow.
 *
 * Uses a fullscreen quad approach, computing sun appearance in the fragment shader
 * based on the angle between the view direction and sun direction.
 */

import type { RenderLayer, RenderParams } from '@/layers/RenderLayer';
import { FullscreenQuad } from '@/renderer/FullscreenQuad';
import type { Renderer } from '@/renderer/Renderer';
import type { HexColor } from '@/types';
import { hexToRgb } from '@/utils/color';
import { mat4, vec3 } from 'gl-matrix';

import fullscreenVertSrc from '@/shaders/fullscreen.vert.glsl?raw';
import sunFragSrc from '@/shaders/sun.frag.glsl?raw';

export interface SunLayerParams {
  position: [number, number, number];
  color: HexColor;
  size: number;
  coronaSize: number;
  coronaIntensity: number;
  glowIntensity: number;
  limbDarkening: number;
}

const DEFAULT_PARAMS: SunLayerParams = {
  position: [1, 0.3, 0.5],
  color: '#fff5e0',
  size: 0.02,
  coronaSize: 0.08,
  coronaIntensity: 0.7,
  glowIntensity: 0.4,
  limbDarkening: 0.6,
};

export class SunLayer implements RenderLayer {
  readonly id = 'sun';
  readonly name = 'Sun';
  enabled = true;
  order = 30;

  private program: WebGLProgram | null = null;
  private quad: FullscreenQuad | null = null;
  private params: SunLayerParams = { ...DEFAULT_PARAMS };

  // Uniform locations
  private locs: Record<string, WebGLUniformLocation | null> = {};

  init(renderer: Renderer): void {
    this.program = renderer.createProgram(fullscreenVertSrc, sunFragSrc);
    const { gl } = renderer;
    const p = this.program;

    this.locs = {
      uInvViewProj: gl.getUniformLocation(p, 'uInvViewProj'),
      uSunDirection: gl.getUniformLocation(p, 'uSunDirection'),
      uSunColor: gl.getUniformLocation(p, 'uSunColor'),
      uSunSize: gl.getUniformLocation(p, 'uSunSize'),
      uCoronaSize: gl.getUniformLocation(p, 'uCoronaSize'),
      uCoronaIntensity: gl.getUniformLocation(p, 'uCoronaIntensity'),
      uGlowIntensity: gl.getUniformLocation(p, 'uGlowIntensity'),
      uLimbDarkening: gl.getUniformLocation(p, 'uLimbDarkening'),
    };

    this.quad = new FullscreenQuad(gl);
  }

  render(renderer: Renderer, params: RenderParams): void {
    const { gl } = renderer;
    if (!this.program || !this.quad) return;

    gl.useProgram(this.program);

    // Compute inverse view-projection
    const viewProj = mat4.create();
    mat4.multiply(viewProj, params.projectionMatrix as mat4, params.viewMatrix as mat4);
    const invViewProj = mat4.create();
    mat4.invert(invViewProj, viewProj);
    gl.uniformMatrix4fv(this.locs['uInvViewProj'], false, invViewProj as Float32Array);

    // Set sun direction (normalized)
    const dir = vec3.create();
    vec3.normalize(dir, this.params.position as vec3);
    gl.uniform3f(this.locs['uSunDirection'], dir[0], dir[1], dir[2]);

    // Set sun color
    const [r, g, b] = hexToRgb(this.params.color);
    gl.uniform3f(this.locs['uSunColor'], r, g, b);

    // Set sun parameters
    gl.uniform1f(this.locs['uSunSize'], this.params.size);
    gl.uniform1f(this.locs['uCoronaSize'], this.params.coronaSize);
    gl.uniform1f(this.locs['uCoronaIntensity'], this.params.coronaIntensity);
    gl.uniform1f(this.locs['uGlowIntensity'], this.params.glowIntensity);
    gl.uniform1f(this.locs['uLimbDarkening'], this.params.limbDarkening);

    // Additive blending for sun glow
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    this.quad.draw();

    // Restore normal blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  updateParams(params: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(params)) {
      if (key in this.params) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.params as any)[key] = value;
      }
    }
  }

  getParams(): Record<string, unknown> {
    return { ...this.params };
  }

  dispose(): void {
    this.quad?.dispose();
    this.quad = null;
    this.program = null;
  }
}
