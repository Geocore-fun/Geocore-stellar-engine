/**
 * NebulaLayer — renders procedural nebula clouds using 4D Perlin noise.
 *
 * Uses fractal Brownian motion (FBM) with configurable octaves,
 * lacunarity, and gain. The 4th noise dimension is driven by the seed
 * for deterministic variation.
 */

import type { RenderLayer, RenderParams } from '@/layers/RenderLayer';
import { FullscreenQuad } from '@/renderer/FullscreenQuad';
import type { Renderer } from '@/renderer/Renderer';
import type { HexColor } from '@/types';
import { hexToRgb } from '@/utils/color';
import { mat4 } from 'gl-matrix';

import fullscreenVertSrc from '@/shaders/fullscreen.vert.glsl?raw';
import nebulaFragSrc from '@/shaders/nebula.frag.glsl?raw';

export interface NebulaLayerParams {
  color1: HexColor;
  color2: HexColor;
  color3: HexColor;
  density: number;
  falloff: number;
  scale: number;
  octaves: number;
  lacunarity: number;
  gain: number;
  offset: [number, number, number];
  brightness: number;
}

const DEFAULT_PARAMS: NebulaLayerParams = {
  color1: '#1a0533',
  color2: '#0a1628',
  color3: '#120a28',
  density: 0.5,
  falloff: 2.0,
  scale: 1.0,
  octaves: 6,
  lacunarity: 2.0,
  gain: 0.5,
  offset: [0, 0, 0],
  brightness: 0.6,
};

export class NebulaLayer implements RenderLayer {
  readonly id = 'nebula';
  readonly name = 'Nebula';
  enabled = true;
  order = 20;

  private program: WebGLProgram | null = null;
  private quad: FullscreenQuad | null = null;
  private params: NebulaLayerParams = { ...DEFAULT_PARAMS };

  // Uniform locations
  private locs: Record<string, WebGLUniformLocation | null> = {};

  init(renderer: Renderer): void {
    this.program = renderer.createProgram(fullscreenVertSrc, nebulaFragSrc);
    const { gl } = renderer;
    const p = this.program;

    this.locs = {
      uInvViewProj: gl.getUniformLocation(p, 'uInvViewProj'),
      uColor1: gl.getUniformLocation(p, 'uColor1'),
      uColor2: gl.getUniformLocation(p, 'uColor2'),
      uColor3: gl.getUniformLocation(p, 'uColor3'),
      uDensity: gl.getUniformLocation(p, 'uDensity'),
      uFalloff: gl.getUniformLocation(p, 'uFalloff'),
      uScale: gl.getUniformLocation(p, 'uScale'),
      uOctaves: gl.getUniformLocation(p, 'uOctaves'),
      uLacunarity: gl.getUniformLocation(p, 'uLacunarity'),
      uGain: gl.getUniformLocation(p, 'uGain'),
      uBrightness: gl.getUniformLocation(p, 'uBrightness'),
      uOffset: gl.getUniformLocation(p, 'uOffset'),
      uSeed: gl.getUniformLocation(p, 'uSeed'),
    };

    // Create fullscreen quad for rendering
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

    // Set colors
    const c1 = hexToRgb(this.params.color1);
    const c2 = hexToRgb(this.params.color2);
    const c3 = hexToRgb(this.params.color3);
    gl.uniform3f(this.locs['uColor1'], c1[0], c1[1], c1[2]);
    gl.uniform3f(this.locs['uColor2'], c2[0], c2[1], c2[2]);
    gl.uniform3f(this.locs['uColor3'], c3[0], c3[1], c3[2]);

    // Set noise parameters
    gl.uniform1f(this.locs['uDensity'], this.params.density);
    gl.uniform1f(this.locs['uFalloff'], this.params.falloff);
    gl.uniform1f(this.locs['uScale'], this.params.scale);
    gl.uniform1i(this.locs['uOctaves'], this.params.octaves);
    gl.uniform1f(this.locs['uLacunarity'], this.params.lacunarity);
    gl.uniform1f(this.locs['uGain'], this.params.gain);
    gl.uniform1f(this.locs['uBrightness'], this.params.brightness);
    gl.uniform3f(
      this.locs['uOffset'],
      this.params.offset[0],
      this.params.offset[1],
      this.params.offset[2],
    );
    gl.uniform1f(this.locs['uSeed'], params.seed);

    // Enable alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.quad.draw();
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
