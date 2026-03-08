/**
 * PointStarLayer — renders thousands of stars as GL_POINTS.
 *
 * Stars are positioned on a unit sphere using seeded RNG.
 * Each star has randomized size, brightness, and slight color variation
 * to simulate stellar population diversity.
 */

import type { RenderLayer, RenderParams } from '@/layers/RenderLayer';
import type { Renderer } from '@/renderer/Renderer';
import { SeededRNG } from '@/utils/rng';
import { mat4 } from 'gl-matrix';

import pointStarsFragSrc from '@/shaders/point-stars.frag.glsl?raw';
import pointStarsVertSrc from '@/shaders/point-stars.vert.glsl?raw';

export interface PointStarParams {
  count: number;
  minBrightness: number;
  maxBrightness: number;
  minSize: number;
  maxSize: number;
  colorVariation: number;
}

const DEFAULT_PARAMS: PointStarParams = {
  count: 100000,
  minBrightness: 0.3,
  maxBrightness: 1.0,
  minSize: 0.5,
  maxSize: 2.5,
  colorVariation: 0.15,
};

export class PointStarLayer implements RenderLayer {
  readonly id = 'point-stars';
  readonly name = 'Point Stars';
  enabled = true;
  order = 10;

  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private vbo: WebGLBuffer | null = null;
  private uViewProjLoc: WebGLUniformLocation | null = null;
  private uFaceSizeLoc: WebGLUniformLocation | null = null;

  private params: PointStarParams = { ...DEFAULT_PARAMS };
  private currentSeed = -1;
  private currentCount = -1;
  private gl: WebGL2RenderingContext | null = null;

  init(renderer: Renderer): void {
    this.gl = renderer.gl;
    this.program = renderer.createProgram(pointStarsVertSrc, pointStarsFragSrc);
    const { gl } = renderer;

    this.uViewProjLoc = gl.getUniformLocation(this.program, 'uViewProj');
    this.uFaceSizeLoc = gl.getUniformLocation(this.program, 'uFaceSize');

    // Create VAO and VBO (will be populated in generateStars)
    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();
  }

  /**
   * Generate star vertex data.
   * Each star: position (vec3) + size (float) + color (vec3) + brightness (float) = 8 floats
   */
  private generateStars(seed: number): void {
    const gl = this.gl;
    if (!gl || !this.vao || !this.vbo) return;

    const { count, minBrightness, maxBrightness, minSize, maxSize, colorVariation } = this.params;
    const rng = new SeededRNG(seed);

    // 8 floats per star: pos(3) + size(1) + color(3) + brightness(1)
    const data = new Float32Array(count * 8);

    for (let i = 0; i < count; i++) {
      const offset = i * 8;

      // Random position on unit sphere (uniform distribution)
      const theta = rng.range(0, Math.PI * 2);
      const phi = Math.acos(rng.range(-1, 1));
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);

      // Position (placed far away on a large sphere)
      data[offset + 0] = x * 50;
      data[offset + 1] = y * 50;
      data[offset + 2] = z * 50;

      // Size — use power distribution (more small stars, fewer large)
      const sizeT = Math.pow(rng.next(), 3);
      data[offset + 3] = minSize + sizeT * (maxSize - minSize);

      // Color — slight variation from white
      // Simulate stellar colors: blue-white to orange-red
      const colorT = rng.next();
      const variation = colorVariation;
      if (colorT < 0.6) {
        // White-ish (most stars)
        data[offset + 4] = 1.0 - rng.next() * variation * 0.3;
        data[offset + 5] = 1.0 - rng.next() * variation * 0.3;
        data[offset + 6] = 1.0;
      } else if (colorT < 0.8) {
        // Warm yellow/orange
        data[offset + 4] = 1.0;
        data[offset + 5] = 0.85 - rng.next() * variation;
        data[offset + 6] = 0.7 - rng.next() * variation;
      } else if (colorT < 0.95) {
        // Blue-white
        data[offset + 4] = 0.8 - rng.next() * variation * 0.5;
        data[offset + 5] = 0.85 - rng.next() * variation * 0.3;
        data[offset + 6] = 1.0;
      } else {
        // Red giants (rare)
        data[offset + 4] = 1.0;
        data[offset + 5] = 0.5 - rng.next() * variation;
        data[offset + 6] = 0.3 - rng.next() * variation * 0.5;
      }

      // Brightness — power distribution (more dim stars)
      const brightnessT = Math.pow(rng.next(), 2);
      data[offset + 7] = minBrightness + brightnessT * (maxBrightness - minBrightness);
    }

    // Upload to GPU
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    const stride = 8 * 4; // 8 floats × 4 bytes
    // aPosition (location 0): vec3
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
    // aSize (location 1): float
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 3 * 4);
    // aColor (location 2): vec3
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 4 * 4);
    // aBrightness (location 3): float
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 7 * 4);

    gl.bindVertexArray(null);

    this.currentSeed = seed;
    this.currentCount = count;
  }

  render(renderer: Renderer, params: RenderParams): void {
    const { gl } = renderer;
    if (!this.program || !this.vao) return;

    // Regenerate stars if seed or count changed
    if (params.seed !== this.currentSeed || this.params.count !== this.currentCount) {
      this.generateStars(params.seed);
    }

    gl.useProgram(this.program);

    // Compute view-projection matrix
    const viewProj = mat4.create();
    mat4.multiply(viewProj, params.projectionMatrix as mat4, params.viewMatrix as mat4);
    gl.uniformMatrix4fv(this.uViewProjLoc, false, viewProj as Float32Array);
    gl.uniform1f(this.uFaceSizeLoc, params.faceSize);

    // Enable additive blending for stars
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, this.params.count);
    gl.bindVertexArray(null);

    // Restore normal blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  updateParams(params: Record<string, unknown>): void {
    let needsRegenerate = false;

    for (const [key, value] of Object.entries(params)) {
      if (key in this.params) {
        const k = key as keyof PointStarParams;
        if (this.params[k] !== value) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this.params as any)[k] = value;
          needsRegenerate = true;
        }
      }
    }

    // Force regeneration on next render if params changed
    if (needsRegenerate) {
      this.currentSeed = -1;
    }
  }

  getParams(): Record<string, unknown> {
    return { ...this.params };
  }

  dispose(): void {
    const gl = this.gl;
    if (gl) {
      if (this.vbo) gl.deleteBuffer(this.vbo);
      if (this.vao) gl.deleteVertexArray(this.vao);
      if (this.program) gl.deleteProgram(this.program);
    }
    this.program = null;
    this.vao = null;
    this.vbo = null;
  }
}
