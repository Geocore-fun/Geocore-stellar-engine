/**
 * MilkyWayLayer — renders a procedural Milky Way band across the sky.
 *
 * Uses a galactic-plane-aligned noise pattern with configurable tilt,
 * rotation, brightness, and a core bulge effect. Rendered as a fullscreen
 * quad with a specialized fragment shader.
 */

import type { RenderLayer, RenderParams } from '@/layers/RenderLayer';
import { FullscreenQuad } from '@/renderer/FullscreenQuad';
import type { Renderer } from '@/renderer/Renderer';
import type { HexColor } from '@/types';
import { hexToRgb } from '@/utils/color';
import { mat4 } from 'gl-matrix';

import fullscreenVertSrc from '@/shaders/fullscreen.vert.glsl?raw';
import milkyWayFragSrc from '@/shaders/milky-way.frag.glsl?raw';

export interface MilkyWayParams {
  enabled: boolean;
  /** Color at galactic center / bright regions */
  coreColor: HexColor;
  /** Color at edges of the band */
  edgeColor: HexColor;
  /** Overall brightness multiplier */
  brightness: number;
  /** Noise density/intensity */
  density: number;
  /** Width of the band (higher = narrower) */
  width: number;
  /** Noise spatial scale */
  scale: number;
  /** Tilt angle of galactic plane (degrees) */
  tilt: number;
  /** Rotation of galactic plane around Y axis (degrees) */
  rotation: number;
  /** Noise octaves */
  octaves: number;
  /** Noise lacunarity */
  lacunarity: number;
  /** Noise gain */
  gain: number;
  /** 3D offset for panning */
  offset: [number, number, number];
  /** Extra brightness at galactic center */
  coreBrightness: number;
  /** Angular size of core bulge */
  coreSize: number;
}

const DEFAULT_PARAMS: MilkyWayParams = {
  enabled: false,
  coreColor: '#c4b5a0',
  edgeColor: '#3a3550',
  brightness: 0.5,
  density: 1.2,
  width: 4.0,
  scale: 1.5,
  tilt: 62.87,
  rotation: 0,
  octaves: 5,
  lacunarity: 2.0,
  gain: 0.5,
  offset: [0, 0, 0],
  coreBrightness: 0.3,
  coreSize: 0.8,
};

export class MilkyWayLayer implements RenderLayer {
  readonly id = 'milky-way';
  readonly name = 'Milky Way';
  enabled = false;
  order = 19; // Just before nebula (20), after constellations

  private program: WebGLProgram | null = null;
  private quad: FullscreenQuad | null = null;
  private params: MilkyWayParams = { ...DEFAULT_PARAMS };
  private locs: Record<string, WebGLUniformLocation | null> = {};

  init(renderer: Renderer): void {
    this.program = renderer.createProgram(fullscreenVertSrc, milkyWayFragSrc);
    const { gl } = renderer;
    const p = this.program;

    this.locs = {
      uInvViewProj: gl.getUniformLocation(p, 'uInvViewProj'),
      uTilt: gl.getUniformLocation(p, 'uTilt'),
      uRotation: gl.getUniformLocation(p, 'uRotation'),
      uCoreColor: gl.getUniformLocation(p, 'uCoreColor'),
      uEdgeColor: gl.getUniformLocation(p, 'uEdgeColor'),
      uBrightness: gl.getUniformLocation(p, 'uBrightness'),
      uDensity: gl.getUniformLocation(p, 'uDensity'),
      uWidth: gl.getUniformLocation(p, 'uWidth'),
      uScale: gl.getUniformLocation(p, 'uScale'),
      uSeed: gl.getUniformLocation(p, 'uSeed'),
      uOffset: gl.getUniformLocation(p, 'uOffset'),
      uOctaves: gl.getUniformLocation(p, 'uOctaves'),
      uLacunarity: gl.getUniformLocation(p, 'uLacunarity'),
      uGain: gl.getUniformLocation(p, 'uGain'),
      uCoreBrightness: gl.getUniformLocation(p, 'uCoreBrightness'),
      uCoreSize: gl.getUniformLocation(p, 'uCoreSize'),
    };

    this.quad = new FullscreenQuad(gl);
  }

  render(renderer: Renderer, params: RenderParams): void {
    const { gl } = renderer;
    if (!this.program || !this.quad) return;

    gl.useProgram(this.program);

    // Inverse view-projection for direction computation
    const viewProj = mat4.create();
    mat4.multiply(viewProj, params.projectionMatrix as mat4, params.viewMatrix as mat4);
    const invViewProj = mat4.create();
    mat4.invert(invViewProj, viewProj);
    gl.uniformMatrix4fv(this.locs['uInvViewProj'], false, invViewProj as Float32Array);

    // Galactic plane orientation (convert degrees to radians)
    gl.uniform1f(this.locs['uTilt'], (this.params.tilt * Math.PI) / 180);
    gl.uniform1f(this.locs['uRotation'], (this.params.rotation * Math.PI) / 180);

    // Colors
    const core = hexToRgb(this.params.coreColor);
    const edge = hexToRgb(this.params.edgeColor);
    gl.uniform3f(this.locs['uCoreColor'], core[0], core[1], core[2]);
    gl.uniform3f(this.locs['uEdgeColor'], edge[0], edge[1], edge[2]);

    // Parameters
    gl.uniform1f(this.locs['uBrightness'], this.params.brightness);
    gl.uniform1f(this.locs['uDensity'], this.params.density);
    gl.uniform1f(this.locs['uWidth'], this.params.width);
    gl.uniform1f(this.locs['uScale'], this.params.scale);
    gl.uniform1f(this.locs['uSeed'], params.seed);
    gl.uniform3f(
      this.locs['uOffset'],
      this.params.offset[0],
      this.params.offset[1],
      this.params.offset[2],
    );
    gl.uniform1i(this.locs['uOctaves'], this.params.octaves);
    gl.uniform1f(this.locs['uLacunarity'], this.params.lacunarity);
    gl.uniform1f(this.locs['uGain'], this.params.gain);
    gl.uniform1f(this.locs['uCoreBrightness'], this.params.coreBrightness);
    gl.uniform1f(this.locs['uCoreSize'], this.params.coreSize);

    // Enable additive blending for glow
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
